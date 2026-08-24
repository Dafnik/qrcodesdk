import {QRCodeError} from './error';

export type QRCodeEmailPayload = {
  to: string | readonly string[];
  cc?: string | readonly string[];
  bcc?: string | readonly string[];
  subject?: string;
  body?: string;
};

export type QRCodePhonePayload = {
  number: string;
  extension?: string;
};

export type QRCodeSMSPayload = {
  recipients: string | readonly string[];
  body?: string;
};

export type QRCodeGeoPayload = {
  latitude: number;
  longitude: number;
  altitude?: number;
  uncertainty?: number;
};

export type QRCodeWiFiEncryption = 'WPA' | 'WEP' | 'nopass';

export type QRCodeWiFiPayload = {
  ssid: string;
  password?: string;
  encryption?: QRCodeWiFiEncryption;
  hidden?: boolean;
};

export function emailPayload(value: QRCodeEmailPayload): string {
  const recipients = resolveList(value.to, 'to');
  const query = [
    queryEntry('cc', value.cc === undefined ? undefined : resolveList(value.cc, 'cc').join(',')),
    queryEntry(
      'bcc',
      value.bcc === undefined ? undefined : resolveList(value.bcc, 'bcc').join(','),
    ),
    queryEntry('subject', value.subject),
    queryEntry('body', value.body),
  ].filter((entry): entry is string => entry !== undefined);

  return `mailto:${recipients.map(encodeEmailAddress).join(',')}${query.length ? `?${query.join('&')}` : ''}`;
}

export function phonePayload(value: QRCodePhonePayload): string {
  const number = resolvePhoneNumber(value.number, 'number');
  if (value.extension === undefined) return `tel:${number}`;
  if (!/^\d+$/.test(value.extension)) {
    invalidPayload('extension', value.extension, 'Phone extensions must contain only digits');
  }
  return `tel:${number};ext=${value.extension}`;
}

export function smsPayload(value: QRCodeSMSPayload): string {
  const recipients = resolveList(value.recipients, 'recipients').map((recipient) =>
    resolvePhoneNumber(recipient, 'recipients'),
  );
  const body = value.body === undefined ? '' : `?body=${encodeURIComponent(value.body)}`;
  return `sms:${recipients.join(',')}${body}`;
}

export function geoPayload(value: QRCodeGeoPayload): string {
  validateCoordinate('latitude', value.latitude, -90, 90);
  validateCoordinate('longitude', value.longitude, -180, 180);
  if (value.altitude !== undefined && !Number.isFinite(value.altitude)) {
    invalidPayload('altitude', value.altitude, 'Altitude must be finite');
  }
  if (
    value.uncertainty !== undefined &&
    (!Number.isFinite(value.uncertainty) || value.uncertainty < 0)
  ) {
    invalidPayload('uncertainty', value.uncertainty, 'Uncertainty must be non-negative and finite');
  }

  const coordinates = [value.latitude, value.longitude, value.altitude]
    .filter((coordinate): coordinate is number => coordinate !== undefined)
    .join(',');
  return `geo:${coordinates}${value.uncertainty === undefined ? '' : `;u=${value.uncertainty}`}`;
}

export function wifiPayload(value: QRCodeWiFiPayload): string {
  validateText('ssid', value.ssid, false);
  if (value.password !== undefined) validateText('password', value.password, true);
  if (value.hidden !== undefined && typeof value.hidden !== 'boolean') {
    invalidPayload('hidden', value.hidden, 'Hidden must be a boolean');
  }

  const encryption = value.encryption ?? (value.password === undefined ? 'nopass' : 'WPA');
  if (!['WPA', 'WEP', 'nopass'].includes(encryption)) {
    invalidPayload('encryption', encryption, 'Unsupported Wi-Fi encryption');
  }
  if (encryption === 'nopass' && value.password !== undefined) {
    invalidPayload('password', value.password, 'Open Wi-Fi networks cannot include a password');
  }
  if (encryption !== 'nopass' && value.password === undefined) {
    invalidPayload('password', value.password, 'Encrypted Wi-Fi networks require a password');
  }

  const fields = [`T:${encryption}`, `S:${escapeWiFiValue(value.ssid)}`];
  if (value.password !== undefined) fields.push(`P:${escapeWiFiValue(value.password)}`);
  if (value.hidden !== undefined) fields.push(`H:${String(value.hidden)}`);
  return `WIFI:${fields.join(';')};;`;
}

function resolveList(value: string | readonly string[], field: string): readonly string[] {
  const values = typeof value === 'string' ? [value] : value;
  if (values.length === 0) invalidPayload(field, value, `${field} must not be empty`);
  for (const item of values) validateText(field, item, false);
  return values;
}

function queryEntry(name: string, value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  validateText(name, value, true);
  return `${name}=${encodeURIComponent(value)}`;
}

function encodeEmailAddress(value: string): string {
  return encodeURIComponent(value).replace(/%40/g, '@');
}

function resolvePhoneNumber(value: string, field: string): string {
  validateText(field, value, false);
  if (!/^\+?[0-9().-]+$/.test(value)) {
    invalidPayload(field, value, 'Phone numbers may contain digits and RFC 3966 separators');
  }
  return value;
}

function validateCoordinate(field: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    invalidPayload(field, value, `${field} must be from ${minimum} to ${maximum}`);
  }
}

function validateText(field: string, value: string, allowEmpty: boolean): void {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0) || /[\0\r\n]/.test(value)) {
    invalidPayload(field, value, `${field} contains invalid text`);
  }
}

function escapeWiFiValue(value: string): string {
  return value.replace(/([\\;,:"'])/g, '\\$1');
}

function invalidPayload(field: string, value: unknown, reason: string): never {
  throw new QRCodeError('INVALID_INPUT', `Invalid QR code payload: ${reason}`, {
    details: {field, value, reason},
  });
}
