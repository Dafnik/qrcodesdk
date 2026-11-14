import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

/**
 * Decoder results without DOM access, shared by the page and the decode workers. The page
 * rasterizes in `rasterize.ts`, the workers in `worker-dom.ts`.
 */
export type DecoderId = 'zxing';

export const DECODERS: readonly {readonly id: DecoderId; readonly label: string}[] = [
  {id: 'zxing', label: 'ZXing'},
];

export function decoderLabel(decoder: DecoderId): string {
  return DECODERS.find(({id}) => id === decoder)!.label;
}

/** Why a decoder is known to fail on a fixture, so a failed decode isn't a regression. */
export type KnownDecodeIssues = Readonly<Partial<Record<DecoderId, string>>>;

export type DecodeStatus = 'pass' | 'fail' | 'known-fail';

export type DecodeResult = {
  readonly status: DecodeStatus;
  readonly message: string;
  readonly decoded?: string;
  readonly width?: number;
  readonly height?: number;
  readonly durationMs: number;
};

/** RGBA pixels of an output on a white page. */
export type Pixels = {
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  readonly width: number;
  readonly height: number;
};

/** Rasterized pixels, or why rasterizing failed, and how long it took. */
export type Raster = {readonly pixels: Pixels | string; readonly durationMs: number};

/** Scans rasterized output with each decoder and compares the text with the payload. */
export async function decodeRaster(
  {pixels, durationMs: rasterizeMs}: Raster,
  payload: string,
  decoders: readonly DecoderId[],
  knownIssues: KnownDecodeIssues = {},
): Promise<[DecoderId, DecodeResult][]> {
  const results: [DecoderId, DecodeResult][] = [];

  for (const decoder of decoders) {
    const decoderStart = performance.now();
    const knownIssue = knownIssues[decoder];
    const result = (
      status: 'pass' | 'fail',
      message: string,
      extra: Partial<DecodeResult> = {},
    ): DecodeResult => ({
      status: status === 'fail' && knownIssue ? 'known-fail' : status,
      message: status === 'fail' && knownIssue ? `${message} Known issue: ${knownIssue}` : message,
      durationMs: rasterizeMs + performance.now() - decoderStart,
      ...extra,
    });

    if (typeof pixels === 'string') {
      results.push([decoder, result('fail', pixels)]);
      continue;
    }
    const {width, height} = pixels;
    let decoded: string | undefined;
    try {
      decoded = await DECODE[decoder](pixels);
    } catch (error) {
      results.push([
        decoder,
        result('fail', `${decoderLabel(decoder)} failed: ${String(error)}`, {width, height}),
      ]);
      continue;
    }

    if (decoded === undefined) {
      results.push([
        decoder,
        result(
          'fail',
          `${decoderLabel(decoder)} found no QR code in the ${width}×${height} output.`,
        ),
      ]);
    } else if (decoded !== payload) {
      results.push([
        decoder,
        result('fail', 'The decoded text differs from the payload.', {decoded, width, height}),
      ]);
    } else {
      results.push([
        decoder,
        result('pass', `${decoderLabel(decoder)} decoded the ${width}×${height} output.`, {
          decoded,
          width,
          height,
        }),
      ]);
    }
  }
  return results;
}

const DECODE: Readonly<Record<DecoderId, (pixels: Pixels) => Promise<string | undefined>>> = {
  async zxing(pixels) {
    const {readBarcodes} = await loadZXing();
    const [code] = await readBarcodes(
      {...pixels, colorSpace: 'srgb'},
      // The same options as the roundtrip tests in `@repo/core-testing/decoder`.
      {
        formats: ['QRCodeModel2', 'MicroQRCode', 'RMQRCode'],
        tryHarder: true,
        tryInvert: false,
        maxNumberOfSymbols: 1,
      },
    );
    return code?.isValid ? code.text : undefined;
  },
};

let zxing: Promise<typeof import('zxing-wasm/reader')> | undefined;

/** Loads ZXing and its WebAssembly binary on first use, from this site instead of a CDN. */
function loadZXing(): Promise<typeof import('zxing-wasm/reader')> {
  zxing ??= import('zxing-wasm/reader').then((module) => {
    module.prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith('.wasm') ? zxingWasmUrl : prefix + path,
      },
    });
    return module;
  });
  return zxing;
}
