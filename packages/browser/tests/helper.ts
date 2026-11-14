import {
  type QRCodeFixtureImage,
  type RGBAPixel,
  getAllQRCodeCombinations,
} from '@repo/core-testing';
import {type QRCodeScan, type QRCodeScanFormat, decodeQRCode} from '@repo/core-testing/decoder';
import {expect} from 'vitest';
import {prepareZXingModule} from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// Vite serves the local WebAssembly binary, so ZXing does not fetch it from a CDN.
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? wasmUrl : prefix + path,
  },
});

export const BLACK = {red: 0, green: 0, blue: 0, alpha: 255};
export const WHITE = {red: 255, green: 255, blue: 255, alpha: 255};

/** All combinations, split in two halves so the canvas and the image roundtrips share them. */
const ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()];
export const ROUNDTRIP_COMBINATIONS_ONE = ROUNDTRIP_COMBINATIONS.filter((_, i) => i % 2 === 0);
export const ROUNDTRIP_COMBINATIONS_TWO = ROUNDTRIP_COMBINATIONS.filter((_, i) => i % 2 !== 0);

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

/** Draws fixture pixels on a canvas, for use with `canvasCenterImage()`. */
export function fixtureImageCanvas({width, height, data}: QRCodeFixtureImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  getCanvasContext(canvas).putImageData(new ImageData(new Uint8ClampedArray(data), width), 0, 0);
  return canvas;
}

/** Scans the code as displayed on a white page, so transparent backgrounds stay light. */
export function scanCanvasQRCode(
  source: HTMLCanvasElement,
  format: QRCodeScanFormat = 'QRCodeModel2',
): Promise<QRCodeScan> {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = getCanvasContext(canvas);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0);
  const {data} = context.getImageData(0, 0, canvas.width, canvas.height);
  return decodeQRCode(data, canvas.width, canvas.height, format);
}

/** Scans a QR code and returns its text. */
export async function decodeCanvasQRCode(source: HTMLCanvasElement): Promise<string> {
  return (await scanCanvasQRCode(source)).text;
}

/** Scans a Micro QR code. */
export function decodeCanvasMicroQRCode(source: HTMLCanvasElement): Promise<QRCodeScan> {
  return scanCanvasQRCode(source, 'MicroQRCode');
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
