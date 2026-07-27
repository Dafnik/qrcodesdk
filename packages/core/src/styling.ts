import type {
  QRCodeColorHex,
  QRCodeCornerDotType,
  QRCodeCornerSquareType,
  QRCodeDotType,
  QRCodeMatrix,
  QRCodeParsedStylingOptions,
  QRCodeStylingOptions,
} from './types';

export const QR_CODE_COLOR_HEX_PATTERN = /^#[0-9a-f]{6}$/i;
export const QR_CODE_DOT_TYPES = [
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'square',
  'extra-rounded',
] as const satisfies readonly QRCodeDotType[];
export const QR_CODE_CORNER_SQUARE_TYPES = [
  'dot',
  'square',
  'extra-rounded',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
] as const satisfies readonly QRCodeCornerSquareType[];
export const QR_CODE_CORNER_DOT_TYPES = [
  'dot',
  'square',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'extra-rounded',
] as const satisfies readonly QRCodeCornerDotType[];

export function isValidQRCodeSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function isValidQRCodeMargin(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function isQRCodeColorHex(value: unknown): value is QRCodeColorHex {
  return typeof value === 'string' && QR_CODE_COLOR_HEX_PATTERN.test(value);
}

export function isQRCodeDotType(value: unknown): value is QRCodeDotType {
  return QR_CODE_DOT_TYPES.some((type) => type === value);
}

export function isQRCodeCornerSquareType(value: unknown): value is QRCodeCornerSquareType {
  return QR_CODE_CORNER_SQUARE_TYPES.some((type) => type === value);
}

export function isQRCodeCornerDotType(value: unknown): value is QRCodeCornerDotType {
  return QR_CODE_CORNER_DOT_TYPES.some((type) => type === value);
}

export function parseQRCodeStylingOptions(
  options?: QRCodeStylingOptions,
): QRCodeParsedStylingOptions {
  const colorDark = options?.colors?.colorDark ?? '#000000';
  const styling: QRCodeParsedStylingOptions = {
    size: options?.size ?? 5,
    margin: options?.margin ?? 4,
    colors: {
      colorLight: options?.colors?.colorLight ?? '#ffffff',
      colorDark,
    },
    dotsOptions: {
      color: options?.dotsOptions?.color ?? colorDark,
      type: options?.dotsOptions?.type ?? 'square',
    },
    cornersSquareOptions: {
      color: options?.cornersSquareOptions?.color ?? colorDark,
      type: options?.cornersSquareOptions?.type ?? 'square',
    },
    cornersDotOptions: {
      color: options?.cornersDotOptions?.color ?? colorDark,
      type: options?.cornersDotOptions?.type ?? 'square',
    },
  };

  validateQRCodeStylingOptions(styling);
  return styling;
}

export function calculateQRCodeRenderedSize(
  matrix: QRCodeMatrix,
  styling: Pick<QRCodeParsedStylingOptions, 'size' | 'margin'>,
): number {
  validateQRCodeSize(styling.size);
  validateQRCodeMargin(styling.margin);

  const renderedSize = styling.size * (matrix.length + 2 * styling.margin);
  if (!Number.isSafeInteger(renderedSize) || renderedSize <= 0) {
    throw new Error(
      `QR code dimensions must be positive integers, received ${String(renderedSize)}`,
    );
  }

  return renderedSize;
}

function validateQRCodeStylingOptions(styling: QRCodeParsedStylingOptions): void {
  validateQRCodeSize(styling.size);
  validateQRCodeMargin(styling.margin);
  validateQRCodeColor('colorLight', styling.colors.colorLight);
  validateQRCodeColor('colorDark', styling.colors.colorDark);
  validateQRCodeColor('dotsOptions.color', styling.dotsOptions.color);
  validateQRCodeColor('cornersSquareOptions.color', styling.cornersSquareOptions.color);
  validateQRCodeColor('cornersDotOptions.color', styling.cornersDotOptions.color);
  validateQRCodeType('dotsOptions.type', styling.dotsOptions.type, QR_CODE_DOT_TYPES);
  validateQRCodeType(
    'cornersSquareOptions.type',
    styling.cornersSquareOptions.type,
    QR_CODE_CORNER_SQUARE_TYPES,
  );
  validateQRCodeType(
    'cornersDotOptions.type',
    styling.cornersDotOptions.type,
    QR_CODE_CORNER_DOT_TYPES,
  );
}

function validateQRCodeSize(value: unknown): asserts value is number {
  if (!isValidQRCodeSize(value)) {
    throw new Error(`QR code size must be a positive integer, received ${String(value)}`);
  }
}

function validateQRCodeMargin(value: unknown): asserts value is number {
  if (!isValidQRCodeMargin(value)) {
    throw new Error(`QR code margin must be a non-negative integer, received ${String(value)}`);
  }
}

function validateQRCodeColor(name: string, value: unknown): asserts value is QRCodeColorHex {
  if (!isQRCodeColorHex(value)) {
    throw new Error(`QR code ${name} must be a 6-digit hex color, received ${String(value)}`);
  }
}

function validateQRCodeType<T extends string>(
  name: string,
  value: unknown,
  supportedTypes: readonly T[],
): asserts value is T {
  if (!supportedTypes.some((type) => type === value)) {
    throw new Error(
      `QR code ${name} must be one of ${supportedTypes.join(', ')}, received ${String(value)}`,
    );
  }
}
