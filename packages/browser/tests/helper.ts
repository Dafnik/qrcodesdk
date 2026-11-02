import {
  type QRCodeFixtureImage,
  type RGBAPixel,
  getAllQRCodeCombinations,
} from '@repo/core-testing';
import jsQR from 'jsqr';
import {expect} from 'vitest';

export const BLACK = {red: 0, green: 0, blue: 0, alpha: 255};
export const WHITE = {red: 255, green: 255, blue: 255, alpha: 255};

/**
 * Version 23 QR codes always fail to decode
 * https://github.com/cozmo/jsQR/issues/251
 */
const JSQR_ROUNDTRIP_COMBINATIONS = [...getAllQRCodeCombinations()].filter(
  ({version, errorCorrectionLevel}) => version !== 23 || errorCorrectionLevel !== 'L',
);
export const JSQR_ROUNDTRIP_COMBINATIONS_ONE = JSQR_ROUNDTRIP_COMBINATIONS.filter(
  (_, i) => i % 2 === 0,
);
export const JSQR_ROUNDTRIP_COMBINATIONS_TWO = JSQR_ROUNDTRIP_COMBINATIONS.filter(
  (_, i) => i % 2 !== 0,
);

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

// Scans the code as displayed on a white page, so transparent backgrounds stay light.
export function decodeCanvasQRCode(source: HTMLCanvasElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = getCanvasContext(canvas);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, canvas.width, canvas.height, {
    inversionAttempts: 'dontInvert',
  });

  if (!result) {
    throw new Error(`Unable to decode ${canvas.width}x${canvas.height} canvas QR code`);
  }

  return result.data;
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
