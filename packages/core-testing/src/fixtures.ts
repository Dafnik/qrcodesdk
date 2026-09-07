import type {QRCodeMatrixOptions} from '@qrcodesdk/core';

export type QRCodeTestFixture = Readonly<
  QRCodeMatrixOptions & {
    readonly name: string;
    readonly payload: string;
  }
>;

export const QR_CODE_ECI_TEST_FIXTURE = {
  name: 'bytes-utf8-eci',
  payload: 'Grüße ✅',
  mode: 'octet',
  eci: true,
  version: 2,
  mask: 5,
} as const satisfies QRCodeTestFixture;

export const QR_CODE_TEST_FIXTURES = [
  {
    name: 'numeric',
    payload: '1234567890',
    mode: 'numeric',
    version: 1,
    mask: 1,
  },
  {
    name: 'numeric-long',
    payload: '867530912345678901234567890',
    mode: 'numeric',
    version: 2,
    mask: 4,
  },
  {
    name: 'numeric-leading-zeroes',
    payload: '000012340000',
    mode: 'numeric',
    version: 1,
    mask: 6,
  },
  {
    name: 'alphanumeric',
    payload: 'HELLO WORLD',
    mode: 'alphanumeric',
    version: 1,
    mask: 2,
  },
  {
    name: 'alphanumeric-symbols',
    payload: 'A1 B2-C3.D4/E5:F6',
    mode: 'alphanumeric',
    version: 2,
    mask: 0,
  },
  {
    name: 'bytes',
    payload: 'hello, 世界',
    mode: 'octet',
    version: 2,
    mask: 3,
  },
  {
    name: 'bytes-emoji',
    payload: 'QR ✅🚀',
    mode: 'octet',
    version: 3,
    mask: 7,
  },
  {
    name: 'bytes-newline',
    payload: 'line one\nline two\nline three',
    mode: 'octet',
    version: 3,
    mask: 1,
  },
  {
    name: 'bytes-json',
    payload: '{"type":"qr","ok":true,"count":42}',
    mode: 'octet',
    version: 3,
    mask: 2,
  },
  {
    name: 'bytes-empty-string',
    payload: '',
    mode: 'octet',
    version: 1,
    mask: 0,
  },
  {
    name: 'numeric-version-5',
    payload: '3141592653589793238462643383279',
    mode: 'numeric',
    version: 5,
    mask: 7,
  },
  {
    name: 'alphanumeric-version-4',
    payload: 'THE QUICK BROWN FOX 123',
    mode: 'alphanumeric',
    version: 4,
    mask: 3,
  },
  {
    name: 'bytes-version-6-unicode',
    payload: 'Café Münchner Kindl — 東京',
    mode: 'octet',
    version: 6,
    mask: 4,
  },
  QR_CODE_ECI_TEST_FIXTURE,
  {
    name: 'numeric-max-capacity',
    payload: '1'.repeat(7_089),
    mode: 'numeric',
    version: 40,
    mask: 0,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'alphanumeric-max-capacity',
    payload: 'A'.repeat(4_296),
    mode: 'alphanumeric',
    version: 40,
    mask: 1,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'bytes-max-capacity',
    payload: 'A'.repeat(2_953),
    mode: 'octet',
    version: 40,
    mask: 2,
    errorCorrectionLevel: 'L',
  },
] as const satisfies readonly QRCodeTestFixture[];
