import {describe, expect, test} from 'vitest';

import {qrcode} from '@qrcodesdk/core';
import type {QRCodeErrorCorrectionLevel, QRCodeMode, QRCodeVersion} from '@qrcodesdk/core';

import {
  QR_CODE_TEST_FIXTURES,
  createFixturePayload,
  fixtureCapacity,
  fixtureSeed,
  getAllQRCodeAutoMaskCombinations,
  getAllQRCodeECICombinations,
} from '../src';

const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as const satisfies readonly QRCodeErrorCorrectionLevel[];
const MODES = ['numeric', 'alphanumeric', 'octet'] as const satisfies readonly QRCodeMode[];

const CAPACITY_CASES = Array.from({length: 40}, (_, index) => (index + 1) as QRCodeVersion).flatMap(
  (version) =>
    ECC_LEVELS.flatMap((errorCorrectionLevel) => [
      ...MODES.map((mode) => ({version, errorCorrectionLevel, mode, eci: false})),
      {version, errorCorrectionLevel, mode: 'octet' as const, eci: true},
    ]),
);

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
    } as const;

    for (const mode of MODES) {
      const payload = createFixturePayload(mode, 2_000, fixtureSeed(mode));
      expect(payload).toHaveLength(2_000);
      expect(payload).toMatch(patterns[mode]);
      expect(payload).not.toMatch(/(.)\1{7}/);
      expect(new Set(payload).size).toBeGreaterThan(mode === 'numeric' ? 9 : 40);
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
  });

  test.each(CAPACITY_CASES)(
    'agrees with core for version $version, ECC $errorCorrectionLevel, mode $mode, ECI $eci',
    ({version, errorCorrectionLevel, mode, eci}) => {
      const capacity = fixtureCapacity(version, errorCorrectionLevel, mode, eci);
      const fitting = createFixturePayload(mode, capacity, version, {utf8: eci});
      const oversized = `${fitting}${createFixturePayload(mode, 1, version)}`;
      const build = (value: string) =>
        qrcode(value).options({mode, version, errorCorrectionLevel, eci, mask: 0}).matrix();

      expect(build(fitting).size).toBe(17 + 4 * version);
      expect(() => build(oversized)).toThrow('QRCode: Payload too large');
    },
  );
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
      expect(utf8Length(fixture.payload)).toBe(fixtureCapacity(40, 'L', fixture.mode));
    }
  });
});
