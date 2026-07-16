import type {QRCodeMatrixOptions} from '@qrcodesdk/core';

export interface QRCodeTestFixture extends QRCodeMatrixOptions {
  name: string;
  data: string;
}

export const QR_CODE_TEST_FIXTURES: QRCodeTestFixture[] = [
  {
    name: 'numeric',
    data: '1234567890',
    mode: 'numeric',
    version: 1,
    mask: 1,
  },
  {
    name: 'numeric-long',
    data: '867530912345678901234567890',
    mode: 'numeric',
    version: 2,
    mask: 4,
  },
  {
    name: 'numeric-leading-zeroes',
    data: '000012340000',
    mode: 'numeric',
    version: 1,
    mask: 6,
  },
  {
    name: 'alphanumeric',
    data: 'HELLO WORLD',
    mode: 'alphanumeric',
    version: 1,
    mask: 2,
  },
  {
    name: 'alphanumeric-symbols',
    data: 'A1 B2-C3.D4/E5:F6',
    mode: 'alphanumeric',
    version: 2,
    mask: 0,
  },
  {
    name: 'bytes',
    data: 'hello, 世界',
    mode: 'octet',
    version: 2,
    mask: 3,
  },
  {
    name: 'bytes-emoji',
    data: 'QR ✅🚀',
    mode: 'octet',
    version: 3,
    mask: 7,
  },
  {
    name: 'bytes-newline',
    data: 'line one\nline two\nline three',
    mode: 'octet',
    version: 3,
    mask: 1,
  },
  {
    name: 'bytes-json',
    data: '{"type":"qr","ok":true,"count":42}',
    mode: 'octet',
    version: 3,
    mask: 2,
  },
  {
    name: 'bytes-empty-string',
    data: '',
    mode: 'octet',
    version: 1,
    mask: 0,
  },
  {
    name: 'numeric-version-5',
    data: '3141592653589793238462643383279',
    mode: 'numeric',
    version: 5,
    mask: 7,
  },
  {
    name: 'alphanumeric-version-4',
    data: 'THE QUICK BROWN FOX 123',
    mode: 'alphanumeric',
    version: 4,
    mask: 3,
  },
  {
    name: 'bytes-version-6-unicode',
    data: 'Café Münchner Kindl — 東京',
    mode: 'octet',
    version: 6,
    mask: 4,
  },
  {
    name: 'numeric-max-capacity',
    data: '1'.repeat(7_089),
    mode: 'numeric',
    version: 40,
    mask: 0,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'alphanumeric-max-capacity',
    data: 'A'.repeat(4_296),
    mode: 'alphanumeric',
    version: 40,
    mask: 1,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'bytes-max-capacity',
    data: 'A'.repeat(2_953),
    mode: 'octet',
    version: 40,
    mask: 2,
    errorCorrectionLevel: 'L',
  },
];
