import {QRCodeError} from './error';
import {assertKnownKeys, throwInvalid} from './options';
import type {
  QRCodeColor,
  QRCodeMatrix,
  QRCodeResolvedVisualStyle,
  QRCodeTextStyle,
  QRCodeVisualStyle,
} from './types';

const COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
const MODULE_SHAPES = [
  'square',
  'circle',
  'rounded',
  'extra-rounded',
  'diagonal',
  'diagonal-rounded',
] as const;
const FINDER_SHAPES = ['square', 'rounded', 'extra-rounded', 'circle'] as const;
const SHAPE_KEYS = ['shape', 'color'];

export type QRCodeRGBA = readonly [red: number, green: number, blue: number, alpha: number];

export function resolveQRCodeVisualStyle(style?: QRCodeVisualStyle): QRCodeResolvedVisualStyle {
  assertKnownKeys(style, 'style', [
    'moduleSize',
    'quietZone',
    'foreground',
    'background',
    'modules',
    'finder',
  ]);
  const finder = style?.finder;
  assertKnownKeys(style?.modules, 'style.modules', SHAPE_KEYS);
  assertKnownKeys(finder, 'style.finder', ['outer', 'center']);
  assertKnownKeys(finder?.outer, 'style.finder.outer', SHAPE_KEYS);
  assertKnownKeys(finder?.center, 'style.finder.center', SHAPE_KEYS);

  const {moduleSize, quietZone} = resolveQRCodeTextStyle(style, false);
  const foreground = style?.foreground ?? '#000000';
  const background = style?.background ?? '#ffffff';
  validateColor('style.foreground', foreground);
  validateColor('style.background', background);

  const parts = (
    [
      ['modules', style?.modules, MODULE_SHAPES],
      ['finder.outer', finder?.outer, FINDER_SHAPES],
      ['finder.center', finder?.center, FINDER_SHAPES],
    ] as const
  ).map(([path, part, shapes]) => {
    const color = part?.color ?? foreground;
    validateColor(`style.${path}.color`, color);
    return {path, shape: part?.shape ?? 'square', color, shapes};
  });
  for (const {path, shape, shapes} of parts) {
    if (!(shapes as readonly unknown[]).includes(shape)) {
      throw new QRCodeError(
        'INVALID_OPTIONS',
        `QR code style.${path}.shape must be one of ${shapes.join(', ')}, received ${String(shape)}`,
        {details: {field: `style.${path}.shape`, value: shape, supportedValues: shapes}},
      );
    }
  }
  const [modules, outer, center] = parts.map(({shape, color}) => ({shape, color}));

  return {
    moduleSize,
    quietZone,
    foreground,
    background,
    modules,
    finder: {outer, center},
  } as QRCodeResolvedVisualStyle;
}

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
  const outputSize = style.moduleSize * (matrix.length + 2 * style.quietZone);
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
