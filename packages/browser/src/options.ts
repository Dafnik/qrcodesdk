import {QRCodeError} from '@qrcodesdk/core';

export function assertKnownKeys(value: unknown, path: string, keys: readonly string[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    throw new QRCodeError('INVALID_OPTIONS', `QR code ${path} must be a plain object`, {
      details: {field: path, value},
    });
  }
  const known = new Set(keys);
  const unknown = Object.keys(value).find((key) => !known.has(key));
  if (unknown !== undefined) {
    const field = `${path}.${unknown}`;
    throw new QRCodeError('INVALID_OPTIONS', `Unknown QR code option ${field}`, {
      details: {field, value: value[unknown]},
    });
  }
}

export function assertOptionalString(
  value: unknown,
  field: string,
): asserts value is string | undefined {
  if (value !== undefined && typeof value !== 'string') {
    throw new QRCodeError('INVALID_OPTIONS', `QR code ${field} must be a string`, {
      details: {field, value},
    });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
