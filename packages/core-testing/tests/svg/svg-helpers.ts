import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {expect} from 'vitest';
import {
  type ReaderOptions,
  type ZXingReaderModule,
  prepareZXingModule,
  readBarcodes,
} from 'zxing-wasm/reader';

export type SvgPath = {
  tag: string;
  attrs: Record<string, string>;
};

type QRCodeDecoder = 'jsQR' | 'ZXing';

const ALL_QR_CODE_DECODERS = ['jsQR', 'ZXing'] as const satisfies readonly QRCodeDecoder[];
const ZXING_READER_OPTIONS = {
  formats: ['QRCode'],
  maxNumberOfSymbols: 1,
  textMode: 'Plain',
  tryInvert: false,
} as const satisfies ReaderOptions;
const ZXING_PURE_READER_OPTIONS = {
  ...ZXING_READER_OPTIONS,
  isPure: true,
  returnErrors: true,
} as const satisfies ReaderOptions;

let zxingModulePromise: Promise<ZXingReaderModule> | undefined;

export function extractSvgAttrs(svg: string): Record<string, string> {
  const match = svg.match(/<svg\b([\s\S]*?)>/);
  if (!match) throw new Error('SVG root element was not found');
  return parseAttrs(match[1]);
}

export function extractPaths(svg: string): SvgPath[] {
  return Array.from(svg.matchAll(/<path\b([^>]*)\/>/g), ([tag, attrs]) => ({
    tag,
    attrs: parseAttrs(attrs),
  }));
}

export async function expectSvgQRCodeToDecode(
  svg: string,
  expected: string,
  decoders: readonly QRCodeDecoder[] = ALL_QR_CODE_DECODERS,
): Promise<void> {
  const {data, info} = await sharp(Buffer.from(svg))
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  const imageData = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);

  for (const decoder of decoders) {
    if (decoder === 'jsQR') {
      const result = jsQR(imageData, info.width, info.height, {inversionAttempts: 'dontInvert'});
      expect(
        result?.data,
        `jsQR failed to decode SVG rendered to ${info.width}x${info.height} PNG`,
      ).toBe(expected);
      continue;
    }

    await prepareZXingReader();
    const results = await decodeWithZXing({
      colorSpace: 'srgb',
      data: imageData,
      width: info.width,
      height: info.height,
    });
    expect(
      results,
      `ZXing returned ${results.length} results for SVG rendered to ${info.width}x${info.height} PNG`,
    ).toHaveLength(1);
    expect(results[0]?.error, 'ZXing returned an SVG decode error').toBe('');
    expect(results[0]?.text, 'ZXing decoded an unexpected SVG payload').toBe(expected);
  }
}

function prepareZXingReader(): Promise<ZXingReaderModule> {
  return (zxingModulePromise ??= prepareZXingModule({
    fireImmediately: true,
    overrides: {
      wasmBinary: readFileSync(
        fileURLToPath(import.meta.resolve('zxing-wasm/reader/zxing_reader.wasm')),
      ),
    },
  }));
}

async function decodeWithZXing(imageData: ImageData) {
  const results = await readBarcodes(imageData, ZXING_READER_OPTIONS);
  if (results.length > 0) return results;

  return (await readBarcodes(imageData, ZXING_PURE_READER_OPTIONS)).filter(
    ({symbology}) => symbology === 'QRCode',
  );
}

export function expectSvgToMatchFileSnapshot(svg: string, snapshotPath: string): void {
  if (process.env.UPDATE_SVG_SNAPSHOTS === '1') {
    mkdirSync(dirname(snapshotPath), {recursive: true});
    writeFileSync(snapshotPath, svg);
  }

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `SVG snapshot does not exist: ${snapshotPath}. Run with UPDATE_SVG_SNAPSHOTS=1 to create it.`,
    );
  }

  expect(svg).toBe(readFileSync(snapshotPath, 'utf8'));
}

export function parseAttrs(rawAttrs: string): Record<string, string> {
  return Object.fromEntries(
    Array.from(rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g), ([, key, value]) => [key, value]),
  );
}
