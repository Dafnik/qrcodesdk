import {describe, expectTypeOf, test} from 'vitest';

import type {QRCodeErrorCorrectionLevel, QRCodeInputData, QRCodeMatrixOptions} from '../src';

describe('public API types', () => {
  test('exports user-facing matrix input types', () => {
    expectTypeOf<QRCodeInputData>().toEqualTypeOf<string | number>();
    expectTypeOf<QRCodeErrorCorrectionLevel>().toEqualTypeOf<'L' | 'M' | 'Q' | 'H'>();
    expectTypeOf<QRCodeMatrixOptions>().toMatchTypeOf<{
      version?: number;
      mode?: string;
      errorCorrectionLevel?: string;
      mask?: number;
    }>();
  });
});
