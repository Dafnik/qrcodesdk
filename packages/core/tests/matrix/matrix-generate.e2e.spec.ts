import {describe, expect, test} from 'vitest';

import {qrcode} from '../../src';
import {expectSquareBinaryMatrix} from './helpers';

describe('qrcode().matrix()', () => {
  test('generates square binary matrices with expected sizes', () => {
    expectSquareBinaryMatrix(qrcode('123456789').version(1).mask(1).matrix(), 21);
    expectSquareBinaryMatrix(qrcode('123456789').version(40).mask(1).matrix(), 177);
  });

  test('auto-detects modes and versions', () => {
    expect(qrcode('123456789').mask(1).matrix()).toEqual(
      qrcode('123456789').mode('numeric').mask(1).matrix(),
    );
    expect(qrcode('HELLO WORLD').mask(1).matrix()).toEqual(
      qrcode('HELLO WORLD').mode('alphanumeric').mask(1).matrix(),
    );
    expect(qrcode('hello world').mask(1).matrix()).toEqual(
      qrcode('hello world').mode('octet').mask(1).matrix(),
    );
    expect(qrcode('1'.repeat(42)).mask(1).matrix()).toHaveLength(25);
  });

  test('builder matrix and renderer paths use matrix generation', () => {
    const matrix = qrcode('123456789').mode('numeric').mask(1).matrix();

    expect(matrix).toEqual(
      qrcode('123456789').mode('numeric').errorCorrection('M').mask(1).matrix(),
    );
    expect(
      qrcode('123456789')
        .mode('numeric')
        .mask(1)
        .render((value) => value.length),
    ).toBe(21);
    // @ts-expect-error Testing Types
    expect(() => qrcode('123456789').render()).toThrow('QRCode: Renderer missing');
  });

  test('rejects invalid public options and incompatible data', () => {
    expect(() => qrcode('ABC').mode('numeric').matrix()).toThrow('QRCode: Invalid data format');
    expect(() => qrcode('abc').mode('alphanumeric').matrix()).toThrow(
      'QRCode: Invalid data format',
    );
    expect(() =>
      qrcode('123')
        .mode('kanji' as never)
        .matrix(),
    ).toThrow('QRCode: Invalid mode');
    expect(() =>
      qrcode('123')
        .errorCorrection('X' as never)
        .matrix(),
    ).toThrow('QRCode: Invalid ECC level');
    expect(() =>
      qrcode('123')
        .version(0 as never)
        .matrix(),
    ).toThrow('QRCode: Invalid version');
    expect(() =>
      qrcode('123')
        .version(41 as never)
        .matrix(),
    ).toThrow('QRCode: Invalid version');
    expect(() =>
      qrcode('123')
        .mask(8 as never)
        .matrix(),
    ).toThrow('QRCode: Invalid mask');
    expect(() => qrcode('1'.repeat(7_090)).mode('numeric').matrix()).toThrow(
      'QRCode: Data too large',
    );
  });

  test('throws Error instances for invalid runtime usage', () => {
    // @ts-expect-error Expected type error
    expect(() => qrcode('123456789').render()).toThrow(Error);
    expect(() => qrcode('ABC').mode('numeric').matrix()).toThrow(Error);
  });
});
