import type {
  QRCodeColorHex,
  QRCodeMatrix,
  QRCodeParsedStylingOptions,
  QRCodeStylingOptions,
} from './types';

const QR_CODE_COLOR_HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export function isValidQRCodeSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function isValidQRCodeMargin(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function isQRCodeColorHex(value: unknown): value is QRCodeColorHex {
  return typeof value === 'string' && QR_CODE_COLOR_HEX_PATTERN.test(value);
}

export function parseQRCodeStylingOptions(
  options?: QRCodeStylingOptions,
): QRCodeParsedStylingOptions {
  const styling: QRCodeParsedStylingOptions = {
    size: options?.size ?? 5,
    margin: options?.margin ?? 4,
    colors: {
      colorLight: options?.colors?.colorLight ?? '#ffffff',
      colorDark: options?.colors?.colorDark ?? '#000000',
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
