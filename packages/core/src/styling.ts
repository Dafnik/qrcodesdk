import {QRCodeError} from './error';
import {throwInvalid} from './options';
import type {QRCodeColor, QRCodeMatrix, QRCodeTextStyle} from './types';

const COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
export type QRCodeRGBA = readonly [red: number, green: number, blue: number, alpha: number];

/** Validates a text style. An unset quiet zone depends on the matrix; see `resolveQuietZone`. */
export function resolveQRCodeTextStyle(
  style?: QRCodeTextStyle,
): Required<Pick<QRCodeTextStyle, 'moduleSize'>> & Pick<QRCodeTextStyle, 'quietZone'> {
  const moduleSize = style?.moduleSize ?? 5;
  const quietZone = style?.quietZone;
  if (!Number.isSafeInteger(moduleSize) || moduleSize <= 0) {
    throwInvalid('style.moduleSize', 'a positive safe integer', moduleSize);
  }
  // `undefined < 0` is false, so an unset quiet zone passes.
  if (!Number.isSafeInteger(quietZone ?? 0) || quietZone! < 0) {
    throwInvalid('style.quietZone', 'a non-negative safe integer', quietZone);
  }
  return {moduleSize, quietZone};
}

/**
 * Defaults the quiet zone to the minimum of the symbol type: 2 modules for Micro QR codes, which
 * are at most 17 modules wide, and 4 modules for standard QR codes, which are at least 21.
 */
export function resolveQuietZone(quietZone: number | undefined, matrix: QRCodeMatrix): number {
  return quietZone ?? (matrix.size < 21 ? 2 : 4);
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

export function validateColor(field: string, value: QRCodeColor): void {
  if (!COLOR_PATTERN.test(value)) {
    throwInvalid(field, 'an RGB or RGBA hex color', value);
  }
}

/** Validates a color and lowercases it, so equal colors share one drawing layer. */
export function resolveColor(field: string, value: QRCodeColor): QRCodeColor {
  validateColor(field, value);
  return value.toLowerCase() as QRCodeColor;
}
