// N1+(k-5) points for each consecutive row of k same-colored modules,
// where k >= 5. no overlapping row counts.
const PENALTY_CONSECUTIVE = 3;

// N3 points for each pattern with >4W:1B:1W:3B:1W:1B or
// 1B:1W:3B:1W:1B:>4W.
const PENALTY_FINDER_LIKE = 40;
const FINDER_LIKE_LEFT_PADDING = 0x05d;
const FINDER_LIKE_RIGHT_PADDING = 0x5d0;
const FINDER_LIKE_WINDOW_MASK = 0x7ff;

/**
 * Evaluates a group of modules and assigns a penalty score based on certain patterns.
 *
 * @param {number[]} groups - An array representing the group of modules.
 * @returns {number} The penalty score for the group.
 */
export function evaluateGroup(groups: number[]): number {
  // assumes [W,B,W,B,W,...,B,W]
  let score = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i]! >= 5) score += PENALTY_CONSECUTIVE + (groups[i]! - 5);
  }

  let finderLikeWindow = 0;
  let numberOfModules = 0;
  let lastMatchedModuleIndex = -1;
  for (let i = 0; i < groups.length; i++) {
    const module = i % 2;
    for (let j = 0; j < groups[i]!; j++) {
      finderLikeWindow = ((finderLikeWindow << 1) & FINDER_LIKE_WINDOW_MASK) | module;
      numberOfModules++;
      const isLeftPaddedMatch = finderLikeWindow === FINDER_LIKE_LEFT_PADDING;
      const isRightPaddedMatch = finderLikeWindow === FINDER_LIKE_RIGHT_PADDING;
      if (numberOfModules >= 11 && (isLeftPaddedMatch || isRightPaddedMatch)) {
        if (!(isRightPaddedMatch && lastMatchedModuleIndex === numberOfModules - 4)) {
          score += PENALTY_FINDER_LIKE;
        }
        lastMatchedModuleIndex = numberOfModules;
      }
    }
  }

  return score;
}
