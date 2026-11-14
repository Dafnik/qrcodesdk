import type {QRCodeEncodingMode, QRCodeKanji, QRCodeSymbolMatrixOptions} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {type QRCodeRMQRHeight, type QRCodeRMQRVersion, rMQR} from '@qrcodesdk/core/rmqr';
import {alignment, circle, finder, rounded} from '@qrcodesdk/core/style';

import {createFixturePayload, fixtureSeed} from './fixture-payloads';
import type {QRCodeStyleVariantFixture} from './style-variant-fixtures';

/** An rMQR code with a pinned version or height, like `QRCodeTestFixture` for standard QR codes. */
export type QRCodeRMQRTestFixture = {
  readonly name: string;
  readonly payload: string;
  readonly mode?: QRCodeEncodingMode;
  /** An exact version, or a height whose narrowest fitting width is used. */
  readonly version: QRCodeRMQRVersion | QRCodeRMQRHeight;
  /** The version that the fixture produces. */
  readonly symbol: QRCodeRMQRVersion;
  /** rMQR codes support the levels `M` and `H`. */
  readonly errorCorrectionLevel: 'M' | 'H';
  /** The Kanji table, which Kanji mode requires. */
  readonly kanji?: QRCodeKanji;
};

/** Creates the matrix options that select the fixture's rMQR symbol. */
export function fixtureRMQRMatrixOptions({
  mode,
  version,
  errorCorrectionLevel,
  kanji,
}: Pick<
  QRCodeRMQRTestFixture,
  'mode' | 'version' | 'errorCorrectionLevel' | 'kanji'
>): QRCodeSymbolMatrixOptions {
  return {symbol: rMQR({version}), mode, errorCorrectionLevel, kanji};
}

/**
 * rMQR fixtures across every height, the narrowest and widest widths, both levels, and every mode,
 * including the maximum capacity of the largest version.
 */
export const QR_CODE_RMQR_TEST_FIXTURES = [
  {
    name: 'rmqr-r7x43-numeric',
    payload: '0123456789',
    mode: 'numeric',
    version: 'R7x43',
    symbol: 'R7x43',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r7-alphanumeric-h',
    payload: 'QRCODESDK RMQR',
    mode: 'alphanumeric',
    version: 'R7',
    symbol: 'R7x99',
    errorCorrectionLevel: 'H',
  },
  {
    name: 'rmqr-r9x59-bytes',
    payload: 'qrcodesdk.dev',
    mode: 'octet',
    version: 'R9x59',
    symbol: 'R9x59',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r11x27-numeric-h',
    payload: '31415',
    mode: 'numeric',
    version: 'R11x27',
    symbol: 'R11x27',
    errorCorrectionLevel: 'H',
  },
  {
    name: 'rmqr-r13x77-bytes-utf8',
    payload: 'Grüße aus Wien ✅',
    mode: 'octet',
    version: 'R13x77',
    symbol: 'R13x77',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r13-kanji',
    payload: '点茗東京タワー',
    mode: 'kanji',
    kanji,
    version: 'R13',
    symbol: 'R13x43',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r15x139-url-h',
    payload: 'https://qrcodesdk.dev/guides/rmqr-codes/?batch=2026-11-15',
    mode: 'octet',
    version: 'R15x139',
    symbol: 'R15x139',
    errorCorrectionLevel: 'H',
  },
  {
    name: 'rmqr-r17x139-numeric-max-capacity',
    payload: createFixturePayload('numeric', 361, fixtureSeed('rmqr-numeric-max-capacity')),
    mode: 'numeric',
    version: 'R17x139',
    symbol: 'R17x139',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r17x139-alphanumeric-max-capacity',
    payload: createFixturePayload(
      'alphanumeric',
      219,
      fixtureSeed('rmqr-alphanumeric-max-capacity'),
    ),
    mode: 'alphanumeric',
    version: 'R17x139',
    symbol: 'R17x139',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r17x139-bytes-max-capacity',
    payload: createFixturePayload('octet', 150, fixtureSeed('rmqr-bytes-max-capacity')),
    mode: 'octet',
    version: 'R17x139',
    symbol: 'R17x139',
    errorCorrectionLevel: 'M',
  },
  {
    name: 'rmqr-r17x139-kanji-max-capacity-h',
    payload: createFixturePayload('kanji', 46, fixtureSeed('rmqr-kanji-max-capacity-h')),
    mode: 'kanji',
    kanji,
    version: 'R17x139',
    symbol: 'R17x139',
    errorCorrectionLevel: 'H',
  },
] as const satisfies readonly QRCodeRMQRTestFixture[];

/** A style variant of an rMQR code, with the symbol its `matrixOptions` select. */
export type QRCodeRMQRStyleVariantFixture = QRCodeStyleVariantFixture & {
  readonly symbol: QRCodeRMQRVersion;
};

const rmqrPayload = 'QRCODESDK RMQR LABEL';
const rmqrMatrixOptions = fixtureRMQRMatrixOptions({version: 'R11x59', errorCorrectionLevel: 'M'});

/**
 * rMQR style variants: the default 2-module quiet zone, module shapes, and the finder pattern and
 * finder sub-pattern. ZXing cannot reliably locate rMQR codes whose finder ring or finder
 * sub-pattern center is shaped, so those stay square.
 */
export const QR_CODE_RMQR_STYLE_VARIANT_FIXTURES = [
  {
    name: 'rmqr-default-quiet-zone',
    payload: rmqrPayload,
    matrixOptions: rmqrMatrixOptions,
    symbol: 'R11x59',
    styling: {moduleSize: 6},
  },
  {
    name: 'rmqr-quiet-zone-4',
    payload: rmqrPayload,
    matrixOptions: rmqrMatrixOptions,
    symbol: 'R11x59',
    styling: {moduleSize: 6, quietZone: 4},
  },
  {
    name: 'rmqr-rounded-modules',
    payload: rmqrPayload,
    matrixOptions: rmqrMatrixOptions,
    symbol: 'R11x59',
    styling: {moduleSize: 6, modules: rounded()},
  },
  {
    name: 'rmqr-finder-and-alignment-style',
    payload: rmqrPayload,
    matrixOptions: rmqrMatrixOptions,
    symbol: 'R11x59',
    styling: {
      moduleSize: 6,
      modules: circle(),
      finder: finder({center: circle(), color: '#1d4ed8'}),
      alignment: alignment({ring: circle(), color: '#be123c'}),
    },
  },
  {
    name: 'rmqr-colors',
    payload: rmqrPayload,
    matrixOptions: rmqrMatrixOptions,
    symbol: 'R11x59',
    styling: {moduleSize: 6, foreground: '#0f172a', background: '#fef3c7'},
  },
] as const satisfies readonly QRCodeRMQRStyleVariantFixture[];
