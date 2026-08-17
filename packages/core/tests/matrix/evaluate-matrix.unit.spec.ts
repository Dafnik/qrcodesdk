import {describe, expect, test} from 'vitest';

import {qrcode} from '../../src';
import {evaluateMatrix} from '../../src/matrix/evaluate-matrix';
import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeModule,
  QRCodeVersion,
} from '../../src/types';

const REPRESENTATIVE_VERSIONS = [1, 2, 7, 20, 40] as const satisfies readonly QRCodeVersion[];
const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];
const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

describe('evaluateMatrix', () => {
  test('matches the legacy score for every mask across representative QR versions', () => {
    for (const version of REPRESENTATIVE_VERSIONS) {
      for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
        for (const mask of MASKS) {
          const matrix = qrcode('A')
            .config({errorCorrectionLevel, mask, mode: 'alphanumeric', version})
            .matrix();

          expect(evaluateMatrix(matrix)).toBe(evaluateMatrixLegacy(matrix));
        }
      }
    }
  });

  test('matches the legacy score for deterministic random matrices', () => {
    for (const version of REPRESENTATIVE_VERSIONS) {
      for (let seed = 1; seed <= 16; seed++) {
        const matrix = createDeterministicMatrix(version, seed);
        expect(evaluateMatrix(matrix)).toBe(evaluateMatrixLegacy(matrix));
      }
    }
  });

  test.each([
    ['all light', ['000000000000000']],
    ['all dark', ['111111111111111']],
    ['alternating', ['010101010101010']],
    ['runs around the N1 boundary', ['000011111000000', '000011111100000']],
    ['left-padded finder-like sequence', ['000010111010101']],
    ['right-padded finder-like sequence', ['101010111010000']],
    ['finder-like sequence at both boundaries', ['000010111010000']],
    ['overlapping two-by-two blocks', ['111', '111', '111']],
    ['density immediately around a five-percent boundary', ['11111111110', '00000000000']],
  ])('matches the legacy score for %s', (_name, rows) => {
    const width = rows[0]!.length;
    const squareRows = [...rows];
    while (squareRows.length < width) squareRows.push('01'.repeat(width).slice(0, width));
    const matrix = squareRows.map((row) => Array.from(row, Number)) as QRCodeMatrix;

    expect(evaluateMatrix(matrix)).toBe(evaluateMatrixLegacy(matrix));
  });
});

function createDeterministicMatrix(version: QRCodeVersion, seed: number): QRCodeMatrix {
  const size = 17 + 4 * version;
  let state = seed;

  return Array.from({length: size}, () =>
    Array.from({length: size}, () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return (state >>> 31) as QRCodeModule;
    }),
  );
}

function evaluateMatrixLegacy(matrix: QRCodeMatrix): number {
  const matrixLength = matrix.length;
  let score = 0;
  let numberOfBlackSquares = 0;

  for (let rowIndex = 0; rowIndex < matrixLength; rowIndex++) {
    const row = matrix[rowIndex]!;
    let groups = collectGroups(row);
    score += evaluateGroupsLegacy(groups);

    groups = collectGroups(
      Array.from({length: matrixLength}, (_, index) => matrix[index]![rowIndex]!),
    );
    score += evaluateGroupsLegacy(groups);

    const nextRow = matrix[rowIndex + 1] ?? [];
    numberOfBlackSquares += row[0]!;
    for (let columnIndex = 1; columnIndex < matrixLength; columnIndex++) {
      const module = row[columnIndex]!;
      numberOfBlackSquares += module;
      if (
        row[columnIndex - 1] === module &&
        nextRow[columnIndex] === module &&
        nextRow[columnIndex - 1] === module
      ) {
        score += 3;
      }
    }
  }

  return (
    score + 10 * ((Math.abs(numberOfBlackSquares / matrixLength / matrixLength - 0.5) / 0.05) | 0)
  );
}

function collectGroups(modules: readonly QRCodeModule[]): number[] {
  const groups = [0];
  let index = 0;

  while (index < modules.length) {
    let length = 0;
    while (index < modules.length && modules[index]) {
      length++;
      index++;
    }
    groups.push(length);

    length = 0;
    while (index < modules.length && !modules[index]) {
      length++;
      index++;
    }
    groups.push(length);
  }

  return groups;
}

function evaluateGroupsLegacy(groups: readonly number[]): number {
  let score = 0;
  for (const length of groups) {
    if (length >= 5) score += 3 + length - 5;
  }

  let finderLikeWindow = 0;
  let numberOfModules = 0;
  let lastMatchedModuleIndex = -1;
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const module = groupIndex % 2;
    for (let index = 0; index < groups[groupIndex]!; index++) {
      finderLikeWindow = ((finderLikeWindow << 1) & 0x7ff) | module;
      numberOfModules++;
      const isLeftPaddedMatch = finderLikeWindow === 0x05d;
      const isRightPaddedMatch = finderLikeWindow === 0x5d0;
      if (numberOfModules >= 11 && (isLeftPaddedMatch || isRightPaddedMatch)) {
        if (!(isRightPaddedMatch && lastMatchedModuleIndex === numberOfModules - 4)) score += 40;
        lastMatchedModuleIndex = numberOfModules;
      }
    }
  }

  return score;
}
