import {QRCodeError} from '../error';

export function invalidPayload(field: string, value: unknown, reason: string): never {
  throw new QRCodeError('INVALID_PAYLOAD', `Invalid QR code payload: ${reason}`, {
    details: {field, value: field === 'password' ? '[REDACTED]' : value, reason},
  });
}
