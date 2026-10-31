import {describe, expect, test} from 'vitest';

import {qrcode} from '../../src';
import {evaluateMatrix} from '../../src/matrix/evaluate-matrix';
import type {QRCodeErrorCorrectionLevel, QRCodeMask, QRCodeVersion} from '../../src/types';
import {toRows} from '../helpers';
import {evaluateGroup} from './helpers';

type Rows = readonly (readonly number[])[];

/** Scores rows with the production evaluator. */
function evaluateRows(rows: Rows, scoreLimit?: number): number {
  return evaluateMatrix(Uint8Array.from(rows.flat()), rows.length, scoreLimit);
}

const REPRESENTATIVE_VERSIONS = [1, 2, 7, 20, 40] as const satisfies readonly QRCodeVersion[];
const ERROR_CORRECTION_LEVELS = [
  'L',
  'M',
  'Q',
  'H',
] as const satisfies readonly QRCodeErrorCorrectionLevel[];
const MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const satisfies readonly QRCodeMask[];

describe('evaluateMatrix', () => {
  test('returns a sufficient lower bound when a candidate cannot beat the score limit', () => {
    let pruned = false;
    for (const version of REPRESENTATIVE_VERSIONS) {
      for (let seed = 1; seed <= 4; seed++) {
        const matrix = createDeterministicMatrix(version, seed);
        const exact = evaluateMatrixLegacy(matrix);
        for (const limit of [0, 1, Math.floor(exact / 2), exact, exact + 1, Infinity]) {
          const score = evaluateRows(matrix, limit);
          if (exact < limit) {
            expect(score).toBe(exact);
          } else {
            expect(score).toBeGreaterThanOrEqual(limit);
            expect(score).toBeLessThanOrEqual(exact);
            pruned ||= score < exact;
          }
        }
      }
    }
    expect(pruned).toBe(true);
  });

  test.each(REPRESENTATIVE_VERSIONS)(
    'keeps the same automatic mask winner as complete scoring at version %s',
    (version) => {
      for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
        for (const payload of ['A', '000123456789', 'é🦊']) {
          const options = {version, errorCorrectionLevel};
          const candidates = MASKS.map((mask) =>
            toRows(
              qrcode(payload)
                .options({...options, mask})
                .matrix(),
            ),
          );
          const scores = candidates.map(evaluateMatrixLegacy);
          const expected = candidates[scores.indexOf(Math.min(...scores))];
          expect(toRows(qrcode(payload).options(options).matrix())).toEqual(expected);
        }
      }
    },
  );

  test('matches the legacy score for every mask across representative QR versions', () => {
    for (const version of REPRESENTATIVE_VERSIONS) {
      for (const errorCorrectionLevel of ERROR_CORRECTION_LEVELS) {
        for (const mask of MASKS) {
          const matrix = toRows(
            qrcode('A')
              .options({errorCorrectionLevel, mask, mode: 'alphanumeric', version})
              .matrix(),
          );

          expect(evaluateRows(matrix)).toBe(evaluateMatrixLegacy(matrix));
        }
      }
    }
  });

  test('matches the legacy score for deterministic random matrices', () => {
    for (const version of REPRESENTATIVE_VERSIONS) {
      for (let seed = 1; seed <= 16; seed++) {
        const matrix = createDeterministicMatrix(version, seed);
        expect(evaluateRows(matrix)).toBe(evaluateMatrixLegacy(matrix));
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
    const matrix = squareRows.map((row) => Array.from(row, Number));

    expect(evaluateRows(matrix)).toBe(evaluateMatrixLegacy(matrix));
  });
});

function createDeterministicMatrix(version: QRCodeVersion, seed: number): Rows {
  const size = 17 + 4 * version;
  let state = seed;

  return Array.from({length: size}, () =>
    Array.from({length: size}, () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state >>> 31;
    }),
  );
}

function evaluateMatrixLegacy(matrix: Rows): number {
  const matrixLength = matrix.length;
  let score = 0;
  let numberOfBlackSquares = 0;

  for (let rowIndex = 0; rowIndex < matrixLength; rowIndex++) {
    const row = matrix[rowIndex]!;
    let groups = collectGroups(row);
    score += evaluateGroup(groups);

    groups = collectGroups(
      Array.from({length: matrixLength}, (_, index) => matrix[index]![rowIndex]!),
    );
    score += evaluateGroup(groups);

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

function collectGroups(modules: readonly number[]): number[] {
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
