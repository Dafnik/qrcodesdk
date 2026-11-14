import type {QRCodeEncodingMode, QRCodeSymbolMatrixOptions} from '@qrcodesdk/core';
import {type QRCodeMicroMask, type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';
import {circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';

import {createFixturePayload, fixtureSeed} from './fixture-payloads';
import type {QRCodeStyleVariantFixture} from './style-variant-fixtures';

/** A Micro QR code with a pinned version and mask, like `QRCodeTestFixture` for standard QR codes. */
export type QRCodeMicroTestFixture = {
  readonly name: string;
  readonly payload: string;
  readonly mode?: QRCodeEncodingMode;
  readonly version: QRCodeMicroVersion;
  readonly mask: QRCodeMicroMask;
  /** Micro QR codes support `L` and `M`, and `Q` in M4. M1 only detects errors. */
  readonly errorCorrectionLevel: 'L' | 'M' | 'Q';
};

/** Creates the matrix options that select the fixture's Micro QR symbol. */
export function fixtureMicroMatrixOptions({
  mode,
  version,
  mask,
  errorCorrectionLevel,
}: QRCodeMicroTestFixture): QRCodeSymbolMatrixOptions {
  return {symbol: microQR({version, mask}), mode, errorCorrectionLevel};
}

/**
 * Micro QR fixtures across every symbol (M1, M2-L/M, M3-L/M, M4-L/M/Q), mode, and mask, including
 * the ISO/IEC 18004 Annex example and the maximum capacity of each mode. jsQR cannot read Micro QR
 * codes, so roundtrips decode them with ZXing.
 */
export const QR_CODE_MICRO_TEST_FIXTURES = [
  {
    name: 'micro-m1-numeric',
    payload: '12345',
    mode: 'numeric',
    version: 'M1',
    mask: 0,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'micro-m1-numeric-short',
    payload: '7',
    mode: 'numeric',
    version: 'M1',
    mask: 2,
    errorCorrectionLevel: 'M',
  },
  {
    name: 'micro-m2-numeric-iso-example',
    payload: '01234567',
    mode: 'numeric',
    version: 'M2',
    mask: 1,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'micro-m2-alphanumeric',
    payload: 'AB-12',
    mode: 'alphanumeric',
    version: 'M2',
    mask: 3,
    errorCorrectionLevel: 'M',
  },
  {
    name: 'micro-m3-numeric',
    payload: '314159265358979323',
    mode: 'numeric',
    version: 'M3',
    mask: 2,
    errorCorrectionLevel: 'M',
  },
  {
    name: 'micro-m3-alphanumeric',
    payload: 'HELLO WORLD',
    mode: 'alphanumeric',
    version: 'M3',
    mask: 0,
    errorCorrectionLevel: 'M',
  },
  {
    name: 'micro-m3-bytes',
    payload: 'hello',
    mode: 'octet',
    version: 'M3',
    mask: 1,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'micro-m3-bytes-utf8',
    payload: 'Grüße',
    mode: 'octet',
    version: 'M3',
    mask: 3,
    errorCorrectionLevel: 'M',
  },
  {
    name: 'micro-m4-alphanumeric-q',
    payload: 'QRCODESDK',
    mode: 'alphanumeric',
    version: 'M4',
    mask: 2,
    errorCorrectionLevel: 'Q',
  },
  {
    name: 'micro-m4-bytes-emoji',
    payload: '✅🚀',
    mode: 'octet',
    version: 'M4',
    mask: 0,
    errorCorrectionLevel: 'M',
  },
  {
    name: 'micro-numeric-max-capacity',
    payload: createFixturePayload('numeric', 35, fixtureSeed('micro-numeric-max-capacity')),
    mode: 'numeric',
    version: 'M4',
    mask: 3,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'micro-alphanumeric-max-capacity',
    payload: createFixturePayload(
      'alphanumeric',
      21,
      fixtureSeed('micro-alphanumeric-max-capacity'),
    ),
    mode: 'alphanumeric',
    version: 'M4',
    mask: 1,
    errorCorrectionLevel: 'L',
  },
  {
    name: 'micro-bytes-max-capacity',
    payload: createFixturePayload('octet', 15, fixtureSeed('micro-bytes-max-capacity')),
    mode: 'octet',
    version: 'M4',
    mask: 2,
    errorCorrectionLevel: 'L',
  },
] as const satisfies readonly QRCodeMicroTestFixture[];

/** A style variant of a Micro QR code, with the symbol its `matrixOptions` select. */
export type QRCodeMicroStyleVariantFixture = QRCodeStyleVariantFixture & {
  readonly symbol: Pick<QRCodeMicroTestFixture, 'version' | 'mask' | 'errorCorrectionLevel'>;
};

const microPayload = 'QRCODESDK MICRO';
const microSymbol = {version: 'M4', mask: 1, errorCorrectionLevel: 'M'} as const;
const microMatrixOptions = fixtureMicroMatrixOptions({
  name: 'micro-style-variant',
  payload: microPayload,
  ...microSymbol,
});

/**
 * Micro QR style variants: the default 2-module quiet zone, module shapes, and the single finder
 * pattern. Finder rings stay square or diagonal, because ZXing cannot locate a Micro QR finder ring
 * with a corner radius of 0.5 or more.
 */
export const QR_CODE_MICRO_STYLE_VARIANT_FIXTURES = [
  {
    name: 'micro-default-quiet-zone',
    payload: microPayload,
    matrixOptions: microMatrixOptions,
    symbol: microSymbol,
    styling: {moduleSize: 6},
  },
  {
    name: 'micro-quiet-zone-4',
    payload: microPayload,
    matrixOptions: microMatrixOptions,
    symbol: microSymbol,
    styling: {moduleSize: 6, quietZone: 4},
  },
  {
    name: 'micro-rounded-modules',
    payload: microPayload,
    matrixOptions: microMatrixOptions,
    symbol: microSymbol,
    styling: {moduleSize: 6, modules: rounded()},
  },
  {
    name: 'micro-finder-style',
    payload: microPayload,
    matrixOptions: microMatrixOptions,
    symbol: microSymbol,
    styling: {
      moduleSize: 6,
      modules: circle(),
      finder: finder({ring: diagonal(), center: circle(), color: '#1d4ed8'}),
    },
  },
  {
    name: 'micro-colors',
    payload: microPayload,
    matrixOptions: microMatrixOptions,
    symbol: microSymbol,
    styling: {moduleSize: 6, foreground: '#0f172a', background: '#fef3c7'},
  },
] as const satisfies readonly QRCodeMicroStyleVariantFixture[];
