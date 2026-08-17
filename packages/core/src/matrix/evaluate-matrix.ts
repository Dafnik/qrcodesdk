import type {QRCodeMatrix} from '../types';

// N1+(k-5) points for each consecutive row of k same-colored modules,
// where k >= 5. no overlapping row counts.
const PENALTY_CONSECUTIVE = 3;
// N2 points for each 2x2 block of same-colored modules.
// overlapping block does count.
const PENALTY_TWO_BY_TWO = 3;
// N3 points for each finder-like pattern with four light modules on either side.
const PENALTY_FINDER_LIKE = 40;
// N4*k points for every (5*k)% deviation from 50% black density.
// i.e. k=1 for 55~60% and 40~45%, k=2 for 60~65% and 35~40%, etc.
const PENALTY_DENSITY = 10;
const FINDER_LIKE_LEFT_PADDING = 0x05d;
const FINDER_LIKE_RIGHT_PADDING = 0x5d0;
const FINDER_LIKE_WINDOW_MASK = 0x7ff;

/**
 * Evaluates the resulting matrix and returns the score (lower is better).
 * (cf. JIS X 0510:2004 sec 8.8.2)
 *
 * The evaluation procedure tries to avoid the problematic patterns naturally
 * occurring from the original matrix. For example, it penalizes the patterns
 * which just look like the finder pattern which will confuse the decoder.
 * We choose the mask which results in the lowest score among 8 possible ones.
 *
 * Note: ZXing seems to use the same procedure and in many cases its choice
 * agrees with ours, but sometimes it does not. Practically it doesn't matter.
 *
 * @param {QRCodeMatrix} matrix - The matrix to be evaluated.
 * @returns {number} The score of the matrix evaluation (lower is better).
 */
export function evaluateMatrix(matrix: QRCodeMatrix): number {
  const matrixLength = matrix.length;
  let score = 0;
  let numberOfBlackSquares = 0;

  for (let i = 0; i < matrixLength; i++) {
    const row = matrix[i]!;
    const nextRow = matrix[i + 1];

    let rowRunModule = row[0]!;
    let rowRunLength = 0;
    let rowFinderLikeWindow = 0;
    let rowLastMatchedModuleIndex = -1;

    let columnRunModule = matrix[0]![i]!;
    let columnRunLength = 0;
    let columnFinderLikeWindow = 0;
    let columnLastMatchedModuleIndex = -1;

    for (let j = 0; j < matrixLength; j++) {
      const rowModule = row[j]!;
      const columnModule = matrix[j]![i]!;

      if (rowModule === rowRunModule) {
        rowRunLength++;
      } else {
        if (rowRunLength >= 5) score += PENALTY_CONSECUTIVE + rowRunLength - 5;
        rowRunModule = rowModule;
        rowRunLength = 1;
      }

      if (columnModule === columnRunModule) {
        columnRunLength++;
      } else {
        if (columnRunLength >= 5) score += PENALTY_CONSECUTIVE + columnRunLength - 5;
        columnRunModule = columnModule;
        columnRunLength = 1;
      }

      rowFinderLikeWindow = ((rowFinderLikeWindow << 1) & FINDER_LIKE_WINDOW_MASK) | rowModule;
      const rowIsLeftPaddedMatch = rowFinderLikeWindow === FINDER_LIKE_LEFT_PADDING;
      const rowIsRightPaddedMatch = rowFinderLikeWindow === FINDER_LIKE_RIGHT_PADDING;
      if (j >= 10 && (rowIsLeftPaddedMatch || rowIsRightPaddedMatch)) {
        const numberOfModules = j + 1;
        if (!(rowIsRightPaddedMatch && rowLastMatchedModuleIndex === numberOfModules - 4)) {
          score += PENALTY_FINDER_LIKE;
        }
        rowLastMatchedModuleIndex = numberOfModules;
      }

      columnFinderLikeWindow =
        ((columnFinderLikeWindow << 1) & FINDER_LIKE_WINDOW_MASK) | columnModule;
      const columnIsLeftPaddedMatch = columnFinderLikeWindow === FINDER_LIKE_LEFT_PADDING;
      const columnIsRightPaddedMatch = columnFinderLikeWindow === FINDER_LIKE_RIGHT_PADDING;
      if (j >= 10 && (columnIsLeftPaddedMatch || columnIsRightPaddedMatch)) {
        const numberOfModules = j + 1;
        if (!(columnIsRightPaddedMatch && columnLastMatchedModuleIndex === numberOfModules - 4)) {
          score += PENALTY_FINDER_LIKE;
        }
        columnLastMatchedModuleIndex = numberOfModules;
      }

      numberOfBlackSquares += rowModule;
      if (
        nextRow !== undefined &&
        j > 0 &&
        row[j - 1] === rowModule &&
        nextRow[j] === rowModule &&
        nextRow[j - 1] === rowModule
      ) {
        score += PENALTY_TWO_BY_TWO;
      }
    }

    if (rowRunLength >= 5) score += PENALTY_CONSECUTIVE + rowRunLength - 5;
    if (columnRunLength >= 5) score += PENALTY_CONSECUTIVE + columnRunLength - 5;
  }

  score +=
    PENALTY_DENSITY *
    ((Math.abs(numberOfBlackSquares / matrixLength / matrixLength - 0.5) / 0.05) | 0);
  return score;
}
