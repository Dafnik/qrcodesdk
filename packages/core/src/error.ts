export const QR_CODE_ERROR_CODES = [
  'INVALID_INPUT',
  'DATA_TOO_LARGE',
  'INVALID_OPTIONS',
  'RENDERER_MISSING',
  'INVALID_IMAGE_SOURCE',
  'RENDER_FAILED',
] as const;

export type QRCodeErrorCode = (typeof QR_CODE_ERROR_CODES)[number];

export type QRCodeErrorOptions = {
  details?: Readonly<Record<string, unknown>>;
  cause?: unknown;
};

export class QRCodeError extends Error {
  readonly code: QRCodeErrorCode;
  readonly details: Readonly<Record<string, unknown>>;
  readonly cause: unknown;

  constructor(code: QRCodeErrorCode, message: string, options: QRCodeErrorOptions = {}) {
    super(message);
    this.name = 'QRCodeError';
    this.code = code;
    this.details = options.details ?? {};
    this.cause = options.cause;
  }
}
