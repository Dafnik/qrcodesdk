import {type RGBAPixel, getAllQRCodeCombinations} from '@repo/core-testing';
import jsQR from 'jsqr';
import {expect} from 'vitest';
import {
  type ReaderOptions,
  type ZXingReaderModule,
  prepareZXingModule,
  readBarcodes,
} from 'zxing-wasm/reader';
import zxingReaderWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

export const BLACK = {red: 0, green: 0, blue: 0, alpha: 255};
export const WHITE = {red: 255, green: 255, blue: 255, alpha: 255};

/**
 * Version 23/L QR codes always fail to decode with jsQR
 * https://github.com/cozmo/jsQR/issues/251
 */
const ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()];
const ROUNDTRIP_COMBINATIONS_BOTH_DECODERS = ROUNDTRIP_COMBINATIONS.filter(
  (fixture) => !isJsQRVersion23Failure(fixture),
);
const ROUNDTRIP_COMBINATIONS_ZXING_ONLY = ROUNDTRIP_COMBINATIONS.filter(isJsQRVersion23Failure);

export const ROUNDTRIP_COMBINATIONS_BOTH_DECODERS_ONE = ROUNDTRIP_COMBINATIONS_BOTH_DECODERS.filter(
  (_, i) => i % 2 === 0,
);
export const ROUNDTRIP_COMBINATIONS_BOTH_DECODERS_TWO = ROUNDTRIP_COMBINATIONS_BOTH_DECODERS.filter(
  (_, i) => i % 2 !== 0,
);
export const ROUNDTRIP_COMBINATIONS_ZXING_ONLY_ONE = ROUNDTRIP_COMBINATIONS_ZXING_ONLY.filter(
  (_, i) => i % 2 === 0,
);
export const ROUNDTRIP_COMBINATIONS_ZXING_ONLY_TWO = ROUNDTRIP_COMBINATIONS_ZXING_ONLY.filter(
  (_, i) => i % 2 !== 0,
);

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

export async function imageToCanvas(image: HTMLImageElement): Promise<HTMLCanvasElement> {
  await waitForImage(image);

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  getCanvasContext(canvas).drawImage(image, 0, 0);

  return canvas;
}

export function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Expected a 2D canvas context');
  return context;
}

export function expectPixel(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  rgba: RGBAPixel,
): void {
  expect(getPixel(canvas, x, y)).toEqual(rgba);
}

export async function expectCanvasQRCodeToDecode(
  canvas: HTMLCanvasElement,
  expected: string,
  decoders: readonly QRCodeDecoder[] = ALL_QR_CODE_DECODERS,
): Promise<void> {
  const context = getCanvasContext(canvas);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  for (const decoder of decoders) {
    if (decoder === 'jsQR') {
      const result = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'dontInvert',
      });
      expect(result?.data, `jsQR failed to decode ${canvas.width}x${canvas.height} canvas`).toBe(
        expected,
      );
      continue;
    }

    await prepareZXingReader();
    const results = await decodeWithZXing(imageData);
    expect(
      results,
      `ZXing returned ${results.length} results for ${canvas.width}x${canvas.height} canvas`,
    ).toHaveLength(1);
    expect(results[0]?.error, 'ZXing returned a canvas decode error').toBe('');
    expect(results[0]?.text, `ZXing decoded an unexpected canvas payload`).toBe(expected);
  }
}

function prepareZXingReader(): Promise<ZXingReaderModule> {
  return (zxingModulePromise ??= prepareZXingModule({
    fireImmediately: true,
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith('.wasm') ? zxingReaderWasmUrl : prefix + path,
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

function isJsQRVersion23Failure({
  version,
  errorCorrectionLevel,
}: {
  version: number;
  errorCorrectionLevel: string;
}): boolean {
  return version === 23 && errorCorrectionLevel === 'L';
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(), {once: true});
    image.addEventListener('error', () => reject(new Error('Expected QR code image to load')), {
      once: true,
    });
  });
}

function getPixel(canvas: HTMLCanvasElement, x: number, y: number): RGBAPixel {
  const [red, green, blue, alpha] = getCanvasContext(canvas).getImageData(x, y, 1, 1).data;
  return {red, green, blue, alpha};
}
