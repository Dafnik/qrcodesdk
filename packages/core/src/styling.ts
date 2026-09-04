import {QRCodeError} from './error';
import type {
  QRCodeColor,
  QRCodeFinderShape,
  QRCodeMatrix,
  QRCodeModuleShape,
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
] as const satisfies readonly QRCodeModuleShape[];
const FINDER_SHAPES = [
  'square',
  'rounded',
  'extra-rounded',
  'circle',
] as const satisfies readonly QRCodeFinderShape[];

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
  assertKnownKeys(style?.modules, 'style.modules', ['shape', 'color']);
  assertKnownKeys(style?.finder, 'style.finder', ['outer', 'center']);
  assertKnownKeys(style?.finder?.outer, 'style.finder.outer', ['shape', 'color']);
  assertKnownKeys(style?.finder?.center, 'style.finder.center', ['shape', 'color']);

  const moduleSize = style?.moduleSize ?? 5;
  const quietZone = style?.quietZone ?? 4;
  const foreground = style?.foreground ?? '#000000';
  const background = style?.background ?? '#ffffff';
  const moduleShape = style?.modules?.shape ?? 'square';
  const finderOuterShape = style?.finder?.outer?.shape ?? 'square';
  const finderCenterShape = style?.finder?.center?.shape ?? 'square';

  validatePositiveInteger('style.moduleSize', moduleSize);
  validateNonNegativeInteger('style.quietZone', quietZone);
  validateColor('style.foreground', foreground);
  validateColor('style.background', background);
  validateColor('style.modules.color', style?.modules?.color ?? foreground);
  validateColor('style.finder.outer.color', style?.finder?.outer?.color ?? foreground);
  validateColor('style.finder.center.color', style?.finder?.center?.color ?? foreground);
  validateEnum('style.modules.shape', moduleShape, MODULE_SHAPES);
  validateEnum('style.finder.outer.shape', finderOuterShape, FINDER_SHAPES);
  validateEnum('style.finder.center.shape', finderCenterShape, FINDER_SHAPES);

  return {
    moduleSize,
    quietZone,
    foreground,
    background,
    modules: {shape: moduleShape, color: style?.modules?.color ?? foreground},
    finder: {
      outer: {shape: finderOuterShape, color: style?.finder?.outer?.color ?? foreground},
      center: {shape: finderCenterShape, color: style?.finder?.center?.color ?? foreground},
    },
  };
}

export function resolveQRCodeTextStyle(style?: QRCodeTextStyle): Required<QRCodeTextStyle> {
  assertKnownKeys(style, 'style', ['moduleSize', 'quietZone']);
  const moduleSize = style?.moduleSize ?? 5;
  const quietZone = style?.quietZone ?? 4;
  validatePositiveInteger('style.moduleSize', moduleSize);
  validateNonNegativeInteger('style.quietZone', quietZone);
  return {moduleSize, quietZone};
}

export function calculateQRCodeOutputSize(
  matrix: QRCodeMatrix,
  style: Pick<Required<QRCodeTextStyle>, 'moduleSize' | 'quietZone'>,
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
  const hexadecimal = color.slice(1);
  return [
    Number.parseInt(hexadecimal.slice(0, 2), 16),
    Number.parseInt(hexadecimal.slice(2, 4), 16),
    Number.parseInt(hexadecimal.slice(4, 6), 16),
    hexadecimal.length === 8 ? Number.parseInt(hexadecimal.slice(6, 8), 16) : 255,
  ];
}

export function assertKnownKeys(
  value: object | undefined,
  path: string,
  knownKeys: readonly string[],
): void {
  if (!value) return;
  const known = new Set(knownKeys);
  const unknown = Object.keys(value).find((key) => !known.has(key));
  if (unknown !== undefined) {
    const field = `${path}.${unknown}`;
    throw new QRCodeError('INVALID_OPTIONS', `Unknown QR code option ${field}`, {
      details: {field, value: (value as Record<string, unknown>)[unknown]},
    });
  }
}

function validatePositiveInteger(field: string, value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throwInvalid(field, 'a positive safe integer', value);
  }
}

function validateNonNegativeInteger(field: string, value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throwInvalid(field, 'a non-negative safe integer', value);
  }
}

function validateColor(field: string, value: unknown): asserts value is QRCodeColor {
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) {
    throwInvalid(field, 'an RGB or RGBA hex color', value);
  }
}

function validateEnum<T extends string>(
  field: string,
  value: unknown,
  values: readonly T[],
): asserts value is T {
  if (!values.some((candidate) => candidate === value)) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code ${field} must be one of ${values.join(', ')}, received ${String(value)}`,
      {details: {field, value, supportedValues: values}},
    );
  }
}

function throwInvalid(field: string, expected: string, value: unknown): never {
  throw new QRCodeError(
    'INVALID_OPTIONS',
    `QR code ${field} must be ${expected}, received ${String(value)}`,
    {details: {field, value}},
  );
}
