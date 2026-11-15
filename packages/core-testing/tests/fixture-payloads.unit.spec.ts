import {describe, expect, test} from 'vitest';

import {QRCodeError, qrcode} from '@qrcodesdk/core';
import type {QRCodeErrorCorrectionLevel, QRCodeMode, QRCodeVersion} from '@qrcodesdk/core';
import {kanji} from '@qrcodesdk/core/kanji';
import {type QRCodeMicroVersion, microQR} from '@qrcodesdk/core/micro';
import {rMQR} from '@qrcodesdk/core/rmqr';

import {
  QR_CODE_MICRO_TEST_FIXTURES,
  QR_CODE_RMQR_TEST_FIXTURES,
  QR_CODE_TEST_FIXTURES,
  RMQR_VERSIONS,
  TOTAL_MICRO_QR_CODE_COMBINATIONS,
  TOTAL_RMQR_CODE_COMBINATIONS,
  createFixturePayload,
  fixtureCapacity,
  fixtureMicroCapacity,
  fixtureRMQRCapacity,
  fixtureSeed,
  getAllMicroQRCodeCombinations,
  getAllQRCodeAutoMaskCombinations,
  getAllQRCodeECICombinations,
  getAllRMQRCodeCombinations,
} from '../src';

const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as const satisfies readonly QRCodeErrorCorrectionLevel[];
const MODES = [
  'numeric',
  'alphanumeric',
  'octet',
  'kanji',
] as const satisfies readonly QRCodeMode[];

const CAPACITY_CASES = Array.from({length: 40}, (_, index) => (index + 1) as QRCodeVersion).flatMap(
  (version) =>
    ECC_LEVELS.flatMap((errorCorrectionLevel) => [
      ...MODES.map((mode) => ({version, errorCorrectionLevel, mode, eci: false})),
      {version, errorCorrectionLevel, mode: 'octet' as const, eci: true},
    ]),
);

const MICRO_SYMBOLS = [
  ['M1', 'L'],
  ['M2', 'L'],
  ['M2', 'M'],
  ['M3', 'L'],
  ['M3', 'M'],
  ['M4', 'L'],
  ['M4', 'M'],
  ['M4', 'Q'],
] as const satisfies readonly (readonly [QRCodeMicroVersion, QRCodeErrorCorrectionLevel])[];

const MICRO_CAPACITY_CASES = MICRO_SYMBOLS.flatMap(([version, errorCorrectionLevel]) =>
  MODES.map((mode) => ({version, errorCorrectionLevel, mode})),
);

const RMQR_CAPACITY_CASES = RMQR_VERSIONS.flatMap((version) =>
  (['M', 'H'] as const).flatMap((errorCorrectionLevel) =>
    MODES.map((mode) => ({version, errorCorrectionLevel, mode})),
  ),
);

const ALL_MICRO_QR_CODE_COMBINATIONS = [...getAllMicroQRCodeCombinations()];
const ALL_RMQR_CODE_COMBINATIONS = [...getAllRMQRCodeCombinations()];

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

describe('createFixturePayload()', () => {
  test('is deterministic per seed and differs between seeds', () => {
    for (const mode of MODES) {
      expect(createFixturePayload(mode, 64, 1)).toBe(createFixturePayload(mode, 64, 1));
      expect(createFixturePayload(mode, 64, 1)).not.toBe(createFixturePayload(mode, 64, 2));
    }
    expect(fixtureSeed('a')).toBe(fixtureSeed('a'));
    expect(fixtureSeed('a')).not.toBe(fixtureSeed('b'));
  });

  test('uses each mode alphabet without long single-character runs', () => {
    const patterns = {
      numeric: /^[0-9]+$/,
      alphanumeric: /^[0-9A-Z $%*+\-./:]+$/,
      octet: /^[\x20-\x7e]+$/,
      kanji: /^[\u3000-\u30ff\u4e00-\u9fff\uff00-\uffef]+$/,
    } as const;

    for (const mode of MODES) {
      const payload = createFixturePayload(mode, 2_000, fixtureSeed(mode));
      expect(payload).toHaveLength(2_000);
      expect(payload).toMatch(patterns[mode]);
      expect(payload).not.toMatch(/(.)\1{7}/);
      expect(new Set(payload).size).toBeGreaterThan(mode === 'numeric' ? 9 : 40);
      if (mode === 'kanji') {
        const chunk = payload.slice(0, 1_000);
        expect(qrcode(chunk).mode('kanji').kanji(kanji).matrix().width).toBeGreaterThan(21);
      }
    }
  });

  test('fills the exact UTF-8 byte length with multi-byte characters', () => {
    for (let length = 0; length <= 64; length += 1) {
      const payload = createFixturePayload('octet', length, length, {utf8: true});
      expect(utf8Length(payload)).toBe(length);
    }
    const payload = createFixturePayload('octet', 1_000, 7, {utf8: true});
    expect(utf8Length(payload)).toBeGreaterThan(payload.length);
  });
});

describe('fixtureCapacity()', () => {
  test('matches the well-known version 40 L maximums', () => {
    expect(fixtureCapacity(40, 'L', 'numeric')).toBe(7_089);
    expect(fixtureCapacity(40, 'L', 'alphanumeric')).toBe(4_296);
    expect(fixtureCapacity(40, 'L', 'octet')).toBe(2_953);
    expect(fixtureCapacity(40, 'L', 'octet', true)).toBe(2_952);
    expect(fixtureCapacity(1, 'H', 'numeric')).toBe(17);
    expect(fixtureCapacity(40, 'L', 'kanji')).toBe(1_817);
    expect(fixtureCapacity(1, 'H', 'kanji')).toBe(4);
  });

  test.each(CAPACITY_CASES)(
    'agrees with core for version $version, ECC $errorCorrectionLevel, mode $mode, ECI $eci',
    ({version, errorCorrectionLevel, mode, eci}) => {
      const capacity = fixtureCapacity(version, errorCorrectionLevel, mode, eci);
      const fitting = createFixturePayload(mode, capacity, version, {utf8: eci});
      const oversized = `${fitting}${createFixturePayload(mode, 1, version)}`;
      const build = (value: string) =>
        qrcode(value).options({mode, version, errorCorrectionLevel, eci, mask: 0, kanji}).matrix();

      expect(build(fitting).width).toBe(17 + 4 * version);
      expect(() => build(oversized)).toThrow('QRCode: Payload too large');
    },
  );
});

describe('fixtureMicroCapacity()', () => {
  test('matches the well-known Micro QR maximums', () => {
    expect(fixtureMicroCapacity('M1', 'L', 'numeric')).toBe(5);
    expect(fixtureMicroCapacity('M1', 'M', 'numeric')).toBe(5);
    expect(fixtureMicroCapacity('M4', 'L', 'numeric')).toBe(35);
    expect(fixtureMicroCapacity('M4', 'L', 'alphanumeric')).toBe(21);
    expect(fixtureMicroCapacity('M4', 'L', 'octet')).toBe(15);
    expect(fixtureMicroCapacity('M4', 'L', 'kanji')).toBe(9);
    expect(fixtureMicroCapacity('M2', 'M', 'octet')).toBe(0);
    expect(() => fixtureMicroCapacity('M2', 'Q', 'numeric')).toThrow();
  });

  test.each(MICRO_CAPACITY_CASES)(
    'agrees with core for $version-$errorCorrectionLevel, mode $mode',
    ({version, errorCorrectionLevel, mode}) => {
      const capacity = fixtureMicroCapacity(version, errorCorrectionLevel, mode);
      const seed = fixtureSeed(`${version}-${errorCorrectionLevel}-${mode}`);
      const build = (value: string) =>
        qrcode(value)
          .options({symbol: microQR({version}), errorCorrectionLevel, mode, kanji})
          .matrix();
      const oversized = createFixturePayload(mode, capacity + 1, seed);

      if (capacity > 0) {
        expect(build(createFixturePayload(mode, capacity, seed)).width).toBe(
          Number(version.slice(1)) * 2 + 9,
        );
      }
      expect(() => build(oversized)).toThrowError(QRCodeError);
    },
  );
});

describe('fixtureRMQRCapacity()', () => {
  test('matches the well-known rMQR maximums', () => {
    expect(fixtureRMQRCapacity('R17x139', 'M', 'numeric')).toBe(361);
    expect(fixtureRMQRCapacity('R17x139', 'M', 'alphanumeric')).toBe(219);
    expect(fixtureRMQRCapacity('R17x139', 'M', 'octet')).toBe(150);
    expect(fixtureRMQRCapacity('R17x139', 'M', 'kanji')).toBe(92);
    expect(fixtureRMQRCapacity('R17x139', 'H', 'kanji')).toBe(46);
  });

  test.each(RMQR_CAPACITY_CASES)(
    'agrees with core for $version-$errorCorrectionLevel, mode $mode',
    ({version, errorCorrectionLevel, mode}) => {
      const capacity = fixtureRMQRCapacity(version, errorCorrectionLevel, mode);
      const seed = fixtureSeed(`${version}-${errorCorrectionLevel}-${mode}`);
      const build = (value: string) =>
        qrcode(value)
          .options({symbol: rMQR({version}), errorCorrectionLevel, mode, kanji})
          .matrix();
      const [height, width] = version.slice(1).split('x').map(Number);
      const matrix = build(createFixturePayload(mode, capacity, seed));

      expect([matrix.height, matrix.width]).toEqual([height, width]);
      expect(() => build(createFixturePayload(mode, capacity + 1, seed))).toThrow(
        'QRCode: Payload too large',
      );
    },
  );
});

describe('Micro QR and rMQR combinations', () => {
  test('provide every unique Micro QR symbol, mask, and supported mode combination', () => {
    const keys = ALL_MICRO_QR_CODE_COMBINATIONS.map(
      ({version, errorCorrectionLevel, mask, mode}) =>
        `${version}-${errorCorrectionLevel}-${mask}-${mode}`,
    );

    expect(ALL_MICRO_QR_CODE_COMBINATIONS).toHaveLength(TOTAL_MICRO_QR_CODE_COMBINATIONS);
    expect(new Set(keys).size).toBe(TOTAL_MICRO_QR_CODE_COMBINATIONS);
    expect(new Set(ALL_MICRO_QR_CODE_COMBINATIONS.map(({name}) => name)).size).toBe(
      TOTAL_MICRO_QR_CODE_COMBINATIONS,
    );
    for (const {payload, version, errorCorrectionLevel, mode} of ALL_MICRO_QR_CODE_COMBINATIONS) {
      expect(mode === 'octet' ? utf8Length(payload) : payload.length).toBe(
        fixtureMicroCapacity(version, errorCorrectionLevel, mode),
      );
    }
  });

  test('provide every unique rMQR version, ECC level, and mode combination', () => {
    const keys = ALL_RMQR_CODE_COMBINATIONS.map(
      ({version, errorCorrectionLevel, mode}) => `${version}-${errorCorrectionLevel}-${mode}`,
    );

    expect(ALL_RMQR_CODE_COMBINATIONS).toHaveLength(TOTAL_RMQR_CODE_COMBINATIONS);
    expect(new Set(keys).size).toBe(TOTAL_RMQR_CODE_COMBINATIONS);
    expect(new Set(ALL_RMQR_CODE_COMBINATIONS.map(({name}) => name)).size).toBe(
      TOTAL_RMQR_CODE_COMBINATIONS,
    );
    for (const {
      payload,
      version,
      symbol,
      errorCorrectionLevel,
      mode,
    } of ALL_RMQR_CODE_COMBINATIONS) {
      expect(symbol).toBe(version);
      expect(mode === 'octet' ? utf8Length(payload) : payload.length).toBe(
        fixtureRMQRCapacity(symbol, errorCorrectionLevel, mode),
      );
    }
  });
});

describe('fixture payloads', () => {
  test('fill every ECI and automatic-mask combination exactly', () => {
    for (const {payload, version, errorCorrectionLevel, mode, eci} of [
      ...getAllQRCodeECICombinations(),
      ...getAllQRCodeAutoMaskCombinations(),
    ]) {
      expect(mode === 'octet' ? utf8Length(payload) : payload.length).toBe(
        fixtureCapacity(version, errorCorrectionLevel, mode, eci),
      );
    }
  });

  test('fill the static max-capacity fixtures exactly', () => {
    for (const fixture of QR_CODE_TEST_FIXTURES.filter(({name}) => name.endsWith('max-capacity'))) {
      expect(fixture.mode === 'kanji' ? fixture.payload.length : utf8Length(fixture.payload)).toBe(
        fixtureCapacity(40, 'L', fixture.mode),
      );
    }
    for (const fixture of QR_CODE_MICRO_TEST_FIXTURES.filter(({name}) =>
      name.endsWith('max-capacity'),
    )) {
      expect(fixture.mode === 'octet' ? utf8Length(fixture.payload) : fixture.payload.length).toBe(
        fixtureMicroCapacity(fixture.version, fixture.errorCorrectionLevel, fixture.mode),
      );
    }
    for (const fixture of QR_CODE_RMQR_TEST_FIXTURES.filter(({name}) =>
      name.includes('max-capacity'),
    )) {
      expect(fixture.mode === 'octet' ? utf8Length(fixture.payload) : fixture.payload.length).toBe(
        fixtureRMQRCapacity(fixture.symbol, fixture.errorCorrectionLevel, fixture.mode),
      );
    }
  });
});
