import type {RGBAPixel} from '@repo/core-testing';
import jsQR from 'jsqr';
import {expect} from 'vitest';

export const BLACK = {red: 0, green: 0, blue: 0, alpha: 255};
export const WHITE = {red: 255, green: 255, blue: 255, alpha: 255};

export function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Expected a 2D canvas context');
  return context;
}

export function getPixel(canvas: HTMLCanvasElement, x: number, y: number): RGBAPixel {
  const [red, green, blue, alpha] = getCanvasContext(canvas).getImageData(x, y, 1, 1).data;
  return {red, green, blue, alpha};
}

export function expectPixel(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  rgba: RGBAPixel,
): void {
  expect(getPixel(canvas, x, y)).toEqual(rgba);
}

export function decodeCanvasQRCode(canvas: HTMLCanvasElement): string {
  const context = getCanvasContext(canvas);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, canvas.width, canvas.height, {
    inversionAttempts: 'dontInvert',
  });

  if (!result) {
    throw new Error(`Unable to decode ${canvas.width}x${canvas.height} canvas QR code`);
  }

  return result.data;
}
