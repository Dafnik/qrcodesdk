import {QRCodeError} from './error';
import type {QRCodeImageOverlayOptions, ɵQRCodeResolvedImageOverlay} from './types';

const DEFAULT_IMAGE_SIZE = 0.4;
const DEFAULT_IMAGE_PADDING = 1;

export function resolveQRCodeImageOverlay<TSource>(
  moduleCount: number,
  margin: number,
  options?: QRCodeImageOverlayOptions<TSource>,
): ɵQRCodeResolvedImageOverlay<TSource> | undefined {
  if (!options) return undefined;

  if (options.source === undefined || options.source === null) {
    throw new QRCodeError('INVALID_IMAGE_SOURCE', 'QR code image source is required', {
      details: {source: options.source},
    });
  }

  const size = options.size ?? DEFAULT_IMAGE_SIZE;
  if (!Number.isFinite(size) || size <= 0 || size > 1) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code image size must be greater than 0 and at most 1, received ${String(size)}`,
      {details: {field: 'image.size', value: size}},
    );
  }

  const padding = options.padding ?? DEFAULT_IMAGE_PADDING;
  if (!Number.isFinite(padding) || padding < 0) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code image padding must be a non-negative finite number, received ${String(padding)}`,
      {details: {field: 'image.padding', value: padding}},
    );
  }

  const clearBackground = options.clearBackground ?? true;
  if (typeof clearBackground !== 'boolean') {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code image clearBackground must be a boolean, received ${String(clearBackground)}`,
      {details: {field: 'image.clearBackground', value: clearBackground}},
    );
  }

  const imageSize = moduleCount * size;
  const imageX = margin + (moduleCount - imageSize) / 2;
  const imageY = imageX;
  const matrixStart = margin;
  const matrixEnd = margin + moduleCount;
  const clearX = Math.max(matrixStart, imageX - padding);
  const clearY = Math.max(matrixStart, imageY - padding);
  const clearEndX = Math.min(matrixEnd, imageX + imageSize + padding);
  const clearEndY = Math.min(matrixEnd, imageY + imageSize + padding);

  return {
    source: options.source,
    size,
    padding,
    clearBackground,
    imageX,
    imageY,
    imageSize,
    clearX,
    clearY,
    clearSize: Math.min(clearEndX - clearX, clearEndY - clearY),
  };
}
