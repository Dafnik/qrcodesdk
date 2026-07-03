import type {QRCodeMatrix} from '@qrcodesdk/core';

export function validatePixelGeometry(renderer: string, modSize: number, margin: number): void {
  if (!Number.isInteger(modSize) || modSize <= 0) {
    throw new Error(`${renderer} QR code size must be a positive integer, received ${modSize}`);
  }

  if (!Number.isInteger(margin) || margin < 0) {
    throw new Error(
      `${renderer} QR code margin must be a non-negative integer, received ${margin}`,
    );
  }
}

export function getRenderedSize(matrix: QRCodeMatrix, modSize: number, margin: number): number {
  const imageSize = modSize * (matrix.length + 2 * margin);

  if (!Number.isInteger(imageSize) || imageSize <= 0) {
    throw new Error(`QR code dimensions must be positive integers, received ${imageSize}`);
  }

  return imageSize;
}
