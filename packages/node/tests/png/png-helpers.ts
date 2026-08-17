import type {RGBAPixel} from '@repo/core-testing';
import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';
import {expect} from 'vitest';
import {
  type ReaderOptions,
  type ZXingReaderModule,
  prepareZXingModule,
  readBarcodes,
} from 'zxing-wasm/reader';

type QRCodeDecoder = 'jsQR' | 'ZXing';
type ZXingImageData = {
  colorSpace: 'srgb';
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

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

export async function expectPngQRCodeToDecode(
  input: Buffer | PNG,
  expected: string,
  decoders: readonly QRCodeDecoder[] = ALL_QR_CODE_DECODERS,
): Promise<void> {
  const png = Buffer.isBuffer(input) ? PNG.sync.read(input) : input;
  const imageData = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length);

  for (const decoder of decoders) {
    if (decoder === 'jsQR') {
      const result = jsQR(imageData, png.width, png.height, {inversionAttempts: 'dontInvert'});
      expect(result?.data, `jsQR failed to decode ${png.width}x${png.height} PNG`).toBe(expected);
      continue;
    }

    await prepareZXingReader();
    const results = await decodeWithZXing({
      colorSpace: 'srgb',
      data: imageData,
      width: png.width,
      height: png.height,
    });
    expect(
      results,
      `ZXing returned ${results.length} results for ${png.width}x${png.height} PNG`,
    ).toHaveLength(1);
    expect(results[0]?.error, 'ZXing returned a PNG decode error').toBe('');
    expect(results[0]?.text, 'ZXing decoded an unexpected PNG payload').toBe(expected);
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

async function decodeWithZXing(imageData: ZXingImageData) {
  const results = await readBarcodes(imageData, ZXING_READER_OPTIONS);
  if (results.length > 0) return results;

  return (await readBarcodes(imageData, ZXING_PURE_READER_OPTIONS)).filter(
    ({symbology}) => symbology === 'QRCode',
  );
}

export function expectPngToMatchFileSnapshot(png: Buffer, snapshotPath: string): void {
  if (process.env.UPDATE_PNG_SNAPSHOTS === '1') {
    mkdirSync(dirname(snapshotPath), {recursive: true});
    writeFileSync(snapshotPath, png);
  }

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `PNG snapshot does not exist: ${snapshotPath}. Run with UPDATE_PNG_SNAPSHOTS=1 to create it.`,
    );
  }

  expect(png).toEqual(readFileSync(snapshotPath));
}

export function getPngPixel(png: PNG, x: number, y: number): RGBAPixel {
  const index = (png.width * y + x) << 2;

  return {
    red: png.data[index],
    green: png.data[index + 1],
    blue: png.data[index + 2],
    alpha: png.data[index + 3],
  };
}
