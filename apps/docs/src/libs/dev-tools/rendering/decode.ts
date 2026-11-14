import jsQR from 'jsqr';
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

import type {RendererId} from './renderers';

/** A renderer's output, captured before a recycled tile replaces it. */
export type RenderedOutput =
  | {readonly kind: 'svg'; readonly svg: string}
  | {readonly kind: 'image'; readonly image: HTMLImageElement}
  | {readonly kind: 'canvas'; readonly canvas: HTMLCanvasElement};

export type DecoderId = 'jsqr' | 'zxing';

export const DECODERS: readonly {readonly id: DecoderId; readonly label: string}[] = [
  {id: 'jsqr', label: 'jsQR'},
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

type Pixels = {readonly data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number};

/** Reads the output a `@qrcodesdk/angular` component rendered into its host element. */
export function captureOutput(host: Element, renderer: RendererId): RenderedOutput | undefined {
  switch (renderer) {
    case 'svg': {
      const svg = host.querySelector('svg');
      return svg ? {kind: 'svg', svg: svg.outerHTML} : undefined;
    }
    case 'canvas': {
      const canvas = host.querySelector('canvas');
      return canvas ? {kind: 'canvas', canvas} : undefined;
    }
    default: {
      const image = host.querySelector('img');
      return image ? {kind: 'image', image} : undefined;
    }
  }
}

/**
 * Scans the output with each decoder on a white page, so transparent backgrounds stay light. The
 * output is rasterized once and shared by the decoders.
 */
export async function decodeOutput(
  output: RenderedOutput | undefined,
  payload: string,
  decoders: readonly DecoderId[],
  knownIssues: KnownDecodeIssues = {},
): Promise<Map<DecoderId, DecodeResult>> {
  const results = new Map<DecoderId, DecodeResult>();
  const start = performance.now();
  let pixels: Pixels | string;
  try {
    pixels = await rasterize(output);
  } catch (error) {
    pixels = error instanceof Error ? error.message : String(error);
  }
  const rasterizeMs = performance.now() - start;

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
      results.set(decoder, result('fail', pixels));
      continue;
    }
    const {width, height} = pixels;
    let decoded: string | undefined;
    try {
      decoded = await DECODE[decoder](pixels);
    } catch (error) {
      results.set(
        decoder,
        result('fail', `${decoderLabel(decoder)} failed: ${String(error)}`, {width, height}),
      );
      continue;
    }

    if (decoded === undefined) {
      results.set(
        decoder,
        result(
          'fail',
          `${decoderLabel(decoder)} found no QR code in the ${width}×${height} output.`,
        ),
      );
    } else if (decoded !== payload) {
      results.set(
        decoder,
        result('fail', 'The decoded text differs from the payload.', {decoded, width, height}),
      );
    } else {
      results.set(
        decoder,
        result('pass', `${decoderLabel(decoder)} decoded the ${width}×${height} output.`, {
          decoded,
          width,
          height,
        }),
      );
    }
  }
  return results;
}

const DECODE: Readonly<Record<DecoderId, (pixels: Pixels) => Promise<string | undefined>>> = {
  jsqr: ({data, width, height}) =>
    Promise.resolve(jsQR(data, width, height, {inversionAttempts: 'dontInvert'})?.data),
  async zxing(pixels) {
    const {readBarcodes} = await loadZXing();
    const [code] = await readBarcodes(
      {...pixels, colorSpace: 'srgb'},
      // jsQR reads only standard QR codes. ZXing also reads Micro QR codes.
      {formats: ['QRCode', 'MicroQRCode'], tryHarder: true, maxNumberOfSymbols: 1},
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

async function rasterize(output: RenderedOutput | undefined): Promise<Pixels> {
  if (!output) throw new Error('The component rendered no output.');
  const {source, width, height} = await toImageSource(output);
  if (!width || !height) throw new Error('The output has no size.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Unable to create a 2D canvas context.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return {data: context.getImageData(0, 0, width, height).data, width, height};
}

async function toImageSource(
  output: RenderedOutput,
): Promise<{source: CanvasImageSource; width: number; height: number}> {
  switch (output.kind) {
    case 'canvas':
      return {source: output.canvas, width: output.canvas.width, height: output.canvas.height};
    case 'image':
      await waitForImage(output.image);
      return {
        source: output.image,
        width: output.image.naturalWidth,
        height: output.image.naturalHeight,
      };
    case 'svg': {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(output.svg)}`;
      await waitForImage(image);
      const root = new DOMParser().parseFromString(output.svg, 'image/svg+xml').documentElement;
      const width = Number(root.getAttribute('width')) || image.naturalWidth;
      const height = Number(root.getAttribute('height')) || image.naturalHeight;
      return {source: image, width, height};
    }
  }
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete) {
    return image.naturalWidth > 0
      ? Promise.resolve()
      : Promise.reject(new Error('The image failed to load.'));
  }
  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(), {once: true});
    image.addEventListener('error', () => reject(new Error('The image failed to load.')), {
      once: true,
    });
  });
}
