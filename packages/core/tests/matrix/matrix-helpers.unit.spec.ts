import {describe, expect, test} from 'vitest';

import {qrcode} from '../../src';
import {QR_CODE_MODULE_ROLES} from '../../src/matrix';
import {applyMaskToMatrix} from '../../src/matrix/apply-mask-to-matrix';
import {createBaseMatrix} from '../../src/matrix/create-base-matrix';
import {ECC_LEVEL_Q} from '../../src/matrix/error-correction';
import {densityPenalty, evaluateMatrix} from '../../src/matrix/evaluate-matrix';
import {fillDataInMatrix} from '../../src/matrix/fill-data-in-matrix';
import {fillFormatInformationInMatrix} from '../../src/matrix/fill-format-information-in-matrix';
import {toRows} from '../helpers';
import {MASK_FUNCTIONS, QR_CODE_MASKS, evaluateGroup, formatBitsMatch} from './helpers';

describe('matrix construction and mutation helpers', () => {
  test.each([1, 40] as const)('builds the version %s base pattern once', (version) => {
    const base = createBaseMatrix(version);
    const expectedSize = 17 + 4 * version;

    expect(base.size).toBe(expectedSize);
    expect(base.modules).toHaveLength(expectedSize * expectedSize);
    expect(base.roles).toHaveLength(expectedSize * expectedSize);
    expect(base.modules.every((value) => value === 0 || value === 1)).toBe(true);
    expect(createBaseMatrix(version)).toBe(base);
  });

  test('leaves the shared base matrix unchanged while generating every mask', () => {
    const base = createBaseMatrix(7);
    const modules = base.modules.slice();
    const roles = base.roles.slice();

    for (const mask of QR_CODE_MASKS) {
      qrcode('shared base matrix').version(7).mask(mask).matrix();
    }
    qrcode('shared base matrix').version(7).matrix();

    expect(createBaseMatrix(7)).toBe(base);
    expect(base.modules).toEqual(modules);
    expect(base.roles).toEqual(roles);
  });

  test('uses the public role numbers for internal roles', () => {
    const {size, roles} = createBaseMatrix(7);
    const role = (x: number, y: number) => roles[y * size + x];

    expect(Object.isFrozen(QR_CODE_MODULE_ROLES)).toBe(true);
    expect({
      data: role(9, 9),
      finderRing: role(0, 0),
      finderCenter: role(3, 3),
      separator: role(7, 7),
      alignmentRing: role(20, 20),
      alignmentCenter: role(22, 22),
      timing: role(10, 6),
      format: role(8, 0),
      version: role(size - 11, 0),
    }).toEqual(QR_CODE_MODULE_ROLES);
  });

  test('creates finder, timing, alignment, and version patterns', () => {
    const version1 = toRows(createBaseMatrix(1));
    expect(version1).toHaveLength(21);
    expect(version1[0]!.slice(0, 7)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(version1[3]!.slice(0, 7)).toEqual([1, 0, 1, 1, 1, 0, 1]);
    expect(version1[6]!.slice(9, 14)).toEqual([0, 1, 0, 1, 0]);

    const version2 = toRows(createBaseMatrix(2));
    expect(version2[16]!.slice(16, 21)).toEqual([1, 1, 1, 1, 1]);
    expect(version2[18]!.slice(16, 21)).toEqual([1, 0, 1, 0, 1]);

    const version7 = createBaseMatrix(7);
    const rows7 = toRows(version7);
    expect(version7.roles[34]).toBe(8);
    expect(rows7[34]![0]).toBe(rows7[0]![34]);
  });

  test('assigns a role to every function-pattern module, light or dark', () => {
    const {size, roles} = createBaseMatrix(7);
    const role = (x: number, y: number) => roles[y * size + x];

    expect([role(0, 0), role(1, 1), role(3, 3), role(7, 7), role(8, 0)]).toEqual([1, 1, 2, 3, 7]);
    expect([role(20, 20), role(21, 20), role(22, 22), role(10, 6), role(6, 10)]).toEqual([
      4, 4, 5, 6, 6,
    ]);
    expect([role(size - 11, 0), role(0, size - 11), role(9, 9)]).toEqual([8, 8, 0]);
    // The always-dark module next to the bottom-left finder belongs to the format area.
    expect(role(8, size - 8)).toBe(7);
  });

  test('fills data bits through data modules and pads with zeroes', () => {
    const modules = new Uint8Array(81);
    const roles = new Uint8Array(81);

    fillDataInMatrix(modules, roles, 9, [0b10101010]);

    const rows = toRows({size: 9, modules});
    expect([rows[8]![8], rows[8]![7], rows[7]![8], rows[7]![7]]).toEqual([1, 0, 1, 0]);
    expect(rows[0]![8]).toBe(0);
    expect(rows[0]![7]).toBe(0);
    expect(rows[0]![5]).toBe(0);
  });

  test('writes mirrored format information for the selected ECC level and mask', () => {
    const {size, modules} = createBaseMatrix(1);
    const copy = fillFormatInformationInMatrix(modules.slice(), size, ECC_LEVEL_Q, 5);

    expect(formatBitsMatch(copy, size, ECC_LEVEL_Q, 5)).toBe(true);
    expect(formatBitsMatch(copy, size, ECC_LEVEL_Q, 4)).toBe(false);
  });

  test('applies masks only to data modules', () => {
    const modules = Uint8Array.of(1, 0, 1, 0, 1, 0, 1, 0, 1);
    const roles = Uint8Array.of(1, 0, 0, 0, 1, 0, 0, 0, 1);

    applyMaskToMatrix(modules, roles, 3, 0);

    expect([modules[0], modules[4], modules[8]]).toEqual([1, 1, 1]);
    expect(modules[2]).toBe(0);
  });

  test.each(QR_CODE_MASKS)('applies mask %s to exactly its data pattern modules', (mask) => {
    const {size, modules: base, roles} = createBaseMatrix(7);
    const modules = applyMaskToMatrix(base.slice(), roles, size, mask);

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const index = i * size + j;
        const toggled = roles[index] === 0 && MASK_FUNCTIONS[mask]!(i, j);
        expect(modules[index]).toBe(toggled ? base[index]! ^ 1 : base[index]);
      }
    }
  });
});

describe('matrix evaluation helpers', () => {
  // The reference group evaluator backs the legacy score comparison in evaluate-matrix tests.
  test('reference evaluator penalizes consecutive and finder-like groups', () => {
    expect(evaluateGroup([0, 4])).toBe(0);
    expect(evaluateGroup([0, 5])).toBe(3);
    expect(evaluateGroup([0, 7])).toBe(5);
    expect(evaluateGroup([4, 1, 1, 3, 1, 1, 4])).toBe(40);
    expect(evaluateGroup([4, 1, 1, 3, 1, 1, 0])).toBe(40);
    expect(evaluateGroup([0, 1, 1, 3, 1, 1, 4])).toBe(40);
    expect(evaluateGroup([4, 2, 2, 6, 2, 2, 4])).toBe(4);
  });

  test('penalizes blocks and black density', () => {
    expect(evaluateMatrix(Uint8Array.of(0, 1, 1, 0), 2)).toBe(0);
    expect(evaluateMatrix(Uint8Array.of(1, 1, 1, 1), 2)).toBe(103);
  });

  test.each([
    [250, 625, 20],
    [375, 625, 20],
    [490, 1225, 20],
    [810, 2025, 20],
    [251, 625, 10],
    [313, 625, 0],
  ])('scores %s of %s dark modules with a density penalty of %s', (dark, total, penalty) => {
    expect(densityPenalty(dark, total)).toBe(penalty);
  });
});
