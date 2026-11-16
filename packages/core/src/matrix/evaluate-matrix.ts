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
// Two bits per sum s of four modules: N2 when they form a same-colored 2x2 block (s = 0 or 4).
const TWO_BY_TWO_PENALTIES = (PENALTY_TWO_BY_TWO << 8) | PENALTY_TWO_BY_TWO;
// A vertical pair sum that makes every 2x2 sum miss TWO_BY_TWO_PENALTIES.
const NO_PAIR = 8;
// N1 points added by the newest module, indexed by the last six modules of a row or column:
// a run that reaches five modules adds N1, and every further module adds one point.
const RUN_PENALTIES = /* @__PURE__ */ (() => {
  const penalties = new Uint8Array(64);
  penalties[0] = penalties[63] = 1;
  penalties[32] = penalties[31] = PENALTY_CONSECUTIVE;
  return penalties;
})();

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
 * Module colors are random in the data area, so the hot loop avoids branches that depend on
 * them: runs come from a lookup of the last six modules, which adds the N1 + (k - 5) points of a
 * run of k >= 5 modules one module at a time, and 2x2 blocks are counted arithmetically.
 *
 * @param {Uint8Array} modules - Row-major light and dark modules.
 * @param {number} matrixLength - Modules per side.
 * @param {number} scoreLimit - Stop when the candidate cannot beat this score.
 * @returns {number} The exact score, or a partial score at least scoreLimit after early exit.
 */
export function evaluateMatrix(
  modules: Readonly<Uint8Array>,
  matrixLength: number,
  scoreLimit = Infinity,
): number {
  let score = 0;
  let numberOfBlackSquares = 0;

  for (let i = 0; i < matrixLength; i++) {
    const row = i * matrixLength;
    const nextRow = i + 1 < matrixLength ? row + matrixLength : -1;

    // The windows start with a module of the other color, which ends runs at the border.
    // Finder-like patterns need 11 modules, so it never counts as one of them.
    let rowFinderLikeWindow = modules[row]! ^ 1;
    let rowLastMatchedModuleIndex = -1;

    let columnFinderLikeWindow = modules[i]! ^ 1;
    let columnLastMatchedModuleIndex = -1;

    let previousPair = NO_PAIR;

    for (let j = 0; j < matrixLength; j++) {
      const rowModule = modules[row + j]!;
      const columnModule = modules[j * matrixLength + i]!;

      rowFinderLikeWindow = ((rowFinderLikeWindow << 1) & FINDER_LIKE_WINDOW_MASK) | rowModule;
      columnFinderLikeWindow =
        ((columnFinderLikeWindow << 1) & FINDER_LIKE_WINDOW_MASK) | columnModule;
      score +=
        RUN_PENALTIES[rowFinderLikeWindow & 63]! + RUN_PENALTIES[columnFinderLikeWindow & 63]!;

      if (
        (rowFinderLikeWindow === FINDER_LIKE_LEFT_PADDING ||
          rowFinderLikeWindow === FINDER_LIKE_RIGHT_PADDING) &&
        j >= 10
      ) {
        const numberOfModules = j + 1;
        if (
          rowFinderLikeWindow !== FINDER_LIKE_RIGHT_PADDING ||
          rowLastMatchedModuleIndex !== numberOfModules - 4
        ) {
          score += PENALTY_FINDER_LIKE;
        }
        rowLastMatchedModuleIndex = numberOfModules;
      }

      if (
        (columnFinderLikeWindow === FINDER_LIKE_LEFT_PADDING ||
          columnFinderLikeWindow === FINDER_LIKE_RIGHT_PADDING) &&
        j >= 10
      ) {
        const numberOfModules = j + 1;
        if (
          columnFinderLikeWindow !== FINDER_LIKE_RIGHT_PADDING ||
          columnLastMatchedModuleIndex !== numberOfModules - 4
        ) {
          score += PENALTY_FINDER_LIKE;
        }
        columnLastMatchedModuleIndex = numberOfModules;
      }

      numberOfBlackSquares += rowModule;
      if (nextRow >= 0) {
        const pair = rowModule + modules[nextRow + j]!;
        score += (TWO_BY_TWO_PENALTIES >> ((pair + previousPair) * 2)) & 3;
        previousPair = pair;
      }
    }

    // Every remaining penalty is nonnegative, so ties and losing masks can stop here.
    if (score >= scoreLimit) return score;
  }

  return score + densityPenalty(numberOfBlackSquares, matrixLength * matrixLength);
}

/** N4 penalty. Integer math keeps exact 40% and 60% densities at k=2 instead of rounding down. */
export function densityPenalty(dark: number, total: number): number {
  return PENALTY_DENSITY * (((Math.abs(dark * 2 - total) * 10) / total) | 0);
}
