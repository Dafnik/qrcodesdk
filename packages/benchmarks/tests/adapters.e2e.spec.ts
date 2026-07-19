import {QR_CODE_TEST_FIXTURES} from '@repo/core-testing';
import qrcodeGenerator from 'qrcode-generator';
import {describe, expect, test} from 'vitest';

import {BENCHMARK_ADAPTERS} from '../src/adapters';

describe('benchmark adapters', () => {
  const fixtures = ['numeric', 'alphanumeric', 'octet'].map((mode) =>
    QR_CODE_TEST_FIXTURES.find((fixture) => fixture.mode === mode)!,
  );

  test.each(BENCHMARK_ADAPTERS)(
    '$label produces native matrix results for every mode',
    (adapter) => {
      adapter.prepare?.();
      for (const fixture of fixtures) {
        expect(adapter.matrix(fixture)).toBe(17 + 4 * fixture.version!);
      }
    },
  );

  test.each(BENCHMARK_ADAPTERS)(
    '$label produces non-empty SVG results for every mode',
    (adapter) => {
      adapter.prepare?.();
      for (const fixture of fixtures) {
        expect(adapter.svg(fixture)).toBeGreaterThan(0);
      }
    },
  );

  test('selects the configured qrcode-generator byte converter', () => {
    const defaultAdapter = BENCHMARK_ADAPTERS.find(({id}) => id === 'qrcode-generator-default')!;
    const textEncoderAdapter = BENCHMARK_ADAPTERS.find(({id}) => id === 'qrcode-generator')!;
    const bundledUTF8Adapter = BENCHMARK_ADAPTERS.find(({id}) => id === 'qrcode-generator-utf8')!;
    const inputs = ['ASCII', 'Café 世界', 'QR ✅🚀'];

    defaultAdapter.prepare?.();
    const defaultBytes = inputs.map((input) => qrcodeGenerator.stringToBytes(input));

    textEncoderAdapter.prepare?.();
    const textEncoderBytes = inputs.map((input) => qrcodeGenerator.stringToBytes(input));

    bundledUTF8Adapter.prepare?.();
    const bundledUTF8Bytes = inputs.map((input) => qrcodeGenerator.stringToBytes(input));

    expect(defaultBytes[0]).toEqual(textEncoderBytes[0]);
    expect(defaultBytes[1]).not.toEqual(textEncoderBytes[1]);
    expect(defaultBytes[2]).not.toEqual(textEncoderBytes[2]);
    expect(bundledUTF8Bytes).toEqual(textEncoderBytes);
  });
});
