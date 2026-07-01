import {describe, expect, test} from 'vitest';

import {ECC_LEVEL_Q} from '../../src/matrix/const';
import {createBaseMatrix} from '../../src/matrix/create-base-matrix';
import {evaluateGroup} from '../../src/matrix/evaluate-group';
import {evaluateMatrix} from '../../src/matrix/evaluate-matrix';
import {fillDataInMatrix} from '../../src/matrix/fill-data-in-matrix';
import {fillFormatInformationInMatrix} from '../../src/matrix/fill-format-information-in-matrix';
import {maskMatrixData} from '../../src/matrix/mask-matrix-data';
import {formatBitsMatch} from './helpers';

describe('matrix construction and mutation helpers', () => {
  test('creates finder, timing, alignment, and version patterns', () => {
    const version1 = createBaseMatrix(1);
    expect(version1.matrix).toHaveLength(21);
    expect(version1.reserved).toHaveLength(21);
    expect(version1.matrix[0].slice(0, 7)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(version1.matrix[3].slice(0, 7)).toEqual([1, 0, 1, 1, 1, 0, 1]);
    expect(Array.from({length: 5}, (_, offset) => version1.matrix[6][9 + offset])).toEqual([
      0, 1, 0, 1, 0,
    ]);

    const version2 = createBaseMatrix(2);
    expect(version2.matrix[16].slice(16, 21)).toEqual([1, 1, 1, 1, 1]);
    expect(version2.matrix[18].slice(16, 21)).toEqual([1, 0, 1, 0, 1]);

    const version7 = createBaseMatrix(7);
    expect(version7.matrix[0][34]).toBeDefined();
    expect(version7.reserved[0][34]).toBe(1);
    expect(version7.matrix[34][0]).toBe(version7.matrix[0][34]);
  });

  test('fills data bits through non-reserved modules and pads with zeroes', () => {
    const matrix = Array.from({length: 9}, () => Array<number>(9));
    const reserved = Array.from({length: 9}, () => Array<number>(9).fill(0));

    fillDataInMatrix(matrix, reserved, [0b10101010]);

    expect([matrix[8][8], matrix[8][7], matrix[7][8], matrix[7][7]]).toEqual([1, 0, 1, 0]);
    expect(matrix[0][8]).toBe(0);
    expect(matrix[0][7]).toBe(0);
    expect(matrix[0][5]).toBe(0);
  });

  test('writes mirrored format information for the selected ECC level and mask', () => {
    const {matrix} = createBaseMatrix(1);
    fillFormatInformationInMatrix(matrix, ECC_LEVEL_Q, 5);

    expect(formatBitsMatch(matrix, ECC_LEVEL_Q, 5)).toBe(true);
    expect(formatBitsMatch(matrix, ECC_LEVEL_Q, 4)).toBe(false);
  });

  test('masks only data modules and is reversible', () => {
    const matrix = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ];
    const reserved = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const original = matrix.map((row) => row.slice());

    maskMatrixData(matrix, reserved, 0);

    expect(matrix[0][0]).toBe(original[0][0]);
    expect(matrix[1][1]).toBe(original[1][1]);
    expect(matrix[2][2]).toBe(original[2][2]);
    expect(matrix[0][2]).toBe(0);

    maskMatrixData(matrix, reserved, 0);

    expect(matrix).toEqual(original);
  });
});

describe('matrix evaluation helpers', () => {
  test('penalizes consecutive and finder-like groups', () => {
    expect(evaluateGroup([0, 4])).toBe(0);
    expect(evaluateGroup([0, 5])).toBe(3);
    expect(evaluateGroup([0, 7])).toBe(5);
    expect(evaluateGroup([4, 1, 1, 3, 1, 1, 4])).toBe(40);
  });

  test('penalizes blocks and black density', () => {
    expect(
      evaluateMatrix([
        [0, 1],
        [1, 0],
      ]),
    ).toBe(0);
    expect(
      evaluateMatrix([
        [1, 1],
        [1, 1],
      ]),
    ).toBe(103);
  });
});
