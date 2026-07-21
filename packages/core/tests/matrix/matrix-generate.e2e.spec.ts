import {describe, expect, test} from 'vitest';

import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMode,
  type QRCodeVersion,
  qrcode,
} from '../../src';
import {ECC_LEVELS_MAP} from '../../src/matrix/error-correction';
import {getMaxDataLength} from '../../src/matrix/get-max-data-length';
import {MODES_MAP} from '../../src/matrix/mode';
import {expectSquareBinaryMatrix} from './helpers';

const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];
const MODES = ['numeric', 'alphanumeric', 'octet'] as const satisfies readonly QRCodeMode[];
const DATA_BY_MODE = {
  numeric: '1',
  alphanumeric: 'A',
  octet: 'A',
} as const satisfies Record<QRCodeMode, string>;

const CAPACITY_CASES = Array.from({length: 40}, (_, index) => (index + 1) as QRCodeVersion).flatMap(
  (version) =>
    ERROR_CORRECTION_LEVELS.flatMap((errorCorrectionLevel) =>
      MODES.map((mode) => ({
        version,
        errorCorrectionLevel,
        mode,
        capacity: getMaxDataLength(version, MODES_MAP[mode], ECC_LEVELS_MAP[errorCorrectionLevel]),
      })),
    ),
);

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

  test('builder configuration is immutable and retains the configured renderer', () => {
    const original = qrcode('123').renderer((matrix) => matrix.length);
    const configuredBuilders = [
      original.mode('numeric'),
      original.config({mode: 'numeric'}),
      original.errorCorrection('H'),
      original.version(2),
      original.mask(0),
    ];

    for (const builder of configuredBuilders) {
      expect(builder).not.toBe(original);
      expect(builder.render()).toBeGreaterThanOrEqual(21);
    }
    expect(original.render()).toBe(21);
  });

  test.each(CAPACITY_CASES)(
    'enforces exact capacity for version $version, ECC $errorCorrectionLevel, mode $mode',
    ({version, errorCorrectionLevel, mode, capacity}) => {
      const exactData = DATA_BY_MODE[mode].repeat(capacity);
      const oversizedData = `${exactData}${DATA_BY_MODE[mode]}`;

      expectSquareBinaryMatrix(
        qrcode(exactData)
          .mode(mode)
          .version(version)
          .errorCorrection(errorCorrectionLevel)
          .mask(0)
          .matrix(),
        17 + 4 * version,
      );
      expect(() =>
        qrcode(oversizedData)
          .mode(mode)
          .version(version)
          .errorCorrection(errorCorrectionLevel)
          .mask(0)
          .matrix(),
      ).toThrow('QRCode: Data too large');
    },
  );

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
    for (const invalidNumber of [
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(() => qrcode(invalidNumber).matrix()).toThrow('QRCode: Invalid data format');
    }
  });

  test('accepts non-negative safe integer input', () => {
    expect(qrcode(0).matrix()).toHaveLength(21);
    expect(qrcode(12345).matrix()).toHaveLength(21);
    expect(qrcode(Number.MAX_SAFE_INTEGER).matrix()).toHaveLength(21);
  });

  test('throws Error instances for invalid runtime usage', () => {
    // @ts-expect-error Expected type error
    expect(() => qrcode('123456789').render()).toThrow(Error);
    expect(() => qrcode('ABC').mode('numeric').matrix()).toThrow(Error);
  });
});
