import {describe, expect, test} from 'vitest';

import {QRCodeError, qrcode} from '@qrcodesdk/core';
import {microQR} from '@qrcodesdk/core/micro';

import {
  QR_CODE_MICRO_STYLE_VARIANT_FIXTURES,
  QR_CODE_MICRO_TEST_FIXTURES,
  fixtureMicroMatrixOptions,
} from '../src';

describe('QR_CODE_MICRO_TEST_FIXTURES', () => {
  test('have unique names and cover every Micro QR symbol and mode', () => {
    const names = [...QR_CODE_MICRO_TEST_FIXTURES, ...QR_CODE_MICRO_STYLE_VARIANT_FIXTURES].map(
      ({name}) => name,
    );
    expect(new Set(names).size).toBe(names.length);
    expect(
      new Set(
        QR_CODE_MICRO_TEST_FIXTURES.map(({version, errorCorrectionLevel}) =>
          version === 'M1' ? 'M1' : `${version}-${errorCorrectionLevel}`,
        ),
      ),
    ).toEqual(new Set(['M1', 'M2-L', 'M2-M', 'M3-L', 'M3-M', 'M4-L', 'M4-M', 'M4-Q']));
    expect(new Set(QR_CODE_MICRO_TEST_FIXTURES.map(({mode}) => mode))).toEqual(
      new Set(['numeric', 'alphanumeric', 'octet', 'kanji']),
    );
    expect(new Set(QR_CODE_MICRO_TEST_FIXTURES.map(({mask}) => mask))).toEqual(
      new Set([0, 1, 2, 3]),
    );
  });

  test.each(QR_CODE_MICRO_TEST_FIXTURES)('$name fits its pinned symbol', (fixture) => {
    const size = Number(fixture.version.slice(1)) * 2 + 9;
    expect(qrcode(fixture.payload).options(fixtureMicroMatrixOptions(fixture)).matrix().size).toBe(
      size,
    );
  });

  test.each(QR_CODE_MICRO_TEST_FIXTURES.filter(({name}) => name.endsWith('max-capacity')))(
    '$name fills its symbol',
    (fixture) => {
      expect(() =>
        qrcode(
          `${fixture.payload}${{numeric: '0', alphanumeric: 'A', octet: 'A', kanji: '漢'}[fixture.mode]}`,
        )
          .options(fixtureMicroMatrixOptions(fixture))
          .matrix(),
      ).toThrowError(QRCodeError);
    },
  );
});

describe('QR_CODE_MICRO_STYLE_VARIANT_FIXTURES', () => {
  test.each(QR_CODE_MICRO_STYLE_VARIANT_FIXTURES)(
    '$name selects the symbol it describes',
    (fixture) => {
      const {version, mask, errorCorrectionLevel} = fixture.symbol;
      expect(qrcode(fixture.payload).options(fixture.matrixOptions).matrix()).toEqual(
        qrcode(fixture.payload)
          .options({symbol: microQR({version, mask}), errorCorrectionLevel})
          .matrix(),
      );
    },
  );
});
