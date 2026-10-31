import {QRCodeError} from './error';

export function assertKnownKeys(value: unknown, path: string, knownKeys: readonly string[]): void {
  if (value === undefined) return;
  if (!isPlainObject(value)) {
    throwInvalid(path, 'a plain object', value);
  }
  const unknown = Object.keys(value).find((key) => !knownKeys.includes(key));
  if (unknown !== undefined) {
    const field = `${path}.${unknown}`;
    throw new QRCodeError('INVALID_OPTIONS', `Unknown QR code option ${field}`, {
      details: {field, value: (value as Record<string, unknown>)[unknown]},
    });
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
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

export function throwInvalid(field: string, expected: string, value: unknown): never {
  throw new QRCodeError(
    'INVALID_OPTIONS',
    `QR code ${field} must be ${expected}, received ${String(value)}`,
    {details: {field, value}},
  );
}

/** Checks that a renderer's center image was created by its factory, such as svgCenterImage(). */
export function assertCenterImage(value: unknown, method: string, factory: string): void {
  if (
    value !== undefined &&
    typeof (value as Record<string, unknown> | null)?.[method] !== 'function'
  ) {
    throwInvalid('centerImage', `created with ${factory}()`, value);
  }
}
