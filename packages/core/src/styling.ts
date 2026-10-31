import {QRCodeError} from './error';
import {assertKnownKeys, throwInvalid} from './options';
import type {QRCodeColor, QRCodeMatrix, QRCodeTextStyle} from './types';

const COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
export type QRCodeRGBA = readonly [red: number, green: number, blue: number, alpha: number];

export function resolveQRCodeTextStyle(
  style?: QRCodeTextStyle,
  validateKeys = true,
): Required<QRCodeTextStyle> {
  if (validateKeys) assertKnownKeys(style, 'style', ['moduleSize', 'quietZone']);
  const moduleSize = style?.moduleSize ?? 5;
  const quietZone = style?.quietZone ?? 4;
  if (typeof moduleSize !== 'number' || !Number.isSafeInteger(moduleSize) || moduleSize <= 0) {
    throwInvalid('style.moduleSize', 'a positive safe integer', moduleSize);
  }
  if (typeof quietZone !== 'number' || !Number.isSafeInteger(quietZone) || quietZone < 0) {
    throwInvalid('style.quietZone', 'a non-negative safe integer', quietZone);
  }
  return {moduleSize, quietZone};
}

export function calculateQRCodeOutputSize(
  matrix: QRCodeMatrix,
  style: Required<QRCodeTextStyle>,
): number {
  const outputSize = style.moduleSize * (matrix.size + 2 * style.quietZone);
  if (!Number.isSafeInteger(outputSize) || outputSize <= 0) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code dimensions must be positive safe integers, received ${String(outputSize)}`,
      {details: {field: 'dimensions', value: outputSize}},
    );
  }
  return outputSize;
}

export function parseQRCodeColor(color: QRCodeColor): QRCodeRGBA {
  const value = (index: number) => Number.parseInt(color.slice(index, index + 2), 16);
  return [value(1), value(3), value(5), color.length === 9 ? value(7) : 255];
}

export function validateColor(field: string, value: unknown): asserts value is QRCodeColor {
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) {
    throwInvalid(field, 'an RGB or RGBA hex color', value);
  }
}

/** Validates a color and lowercases it, so equal colors share one drawing layer. */
export function resolveColor(field: string, value: unknown): QRCodeColor {
  validateColor(field, value);
  return value.toLowerCase() as QRCodeColor;
}
