import {QRCodeError} from './error';

export function throwInvalid(field: string, expected: string, value: unknown): never {
  throw new QRCodeError(
    'INVALID_OPTIONS',
    `QR code ${field} must be ${expected}, received ${String(value)}`,
    {details: {field, value}},
  );
}
