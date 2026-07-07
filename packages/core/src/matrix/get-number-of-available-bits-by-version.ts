import type {QRCodeVersion} from '../types';
import {VERSIONS} from './const';
import {needsVersionInfo} from './needs-version-info';

/**
 * Returns the number of bits available for code words in a given version.
 *
 * @param {number} version - The version number of the QR code.
 * @returns {number} The number of bits available for code words in this version.
 */
export function getNumberOfAvailableBitsByVersion(version: QRCodeVersion): number {
  /*
   * |<--------------- n --------------->|
   * |        |<----- n-17 ---->|        |
   * +-------+                ///+-------+ ----
   * |       |                ///|       |    ^
   * |  9x9  |       @@@@@    ///|  9x8  |    |
   * |       | # # # @5x5@ # # # |       |    |
   * +-------+       @@@@@       +-------+    |
   *       #                               ---|
   *                                        ^ |
   *       #                                |
   *     @@@@@       @@@@@       @@@@@      | n
   *     @5x5@       @5x5@       @5x5@   n-17
   *     @@@@@       @@@@@       @@@@@      | |
   *       #                                | |
   * //////                                 v |
   * //////#                               ---|
   * +-------+       @@@@@       @@@@@        |
   * |       |       @5x5@       @5x5@        |
   * |  8x9  |       @@@@@       @@@@@        |
   * |       |                                v
   * +-------+                             ----
   *
   * when the entire code has n^2 modules and there are m^2-3 alignment
   * patterns, we have:
   * - 225 (= 9x9 + 9x8 + 8x9) modules for finder patterns and
   *   format information;
   * - 2n-34 (= 2(n-17)) modules for timing patterns;
   * - 36 (= 3x6 + 6x3) modules for version information, if any;
   * - 25m^2-75 (= (m^2-3)(5x5)) modules for alignment patterns
   *   if any, but 10m-20 (= 2(m-2)x5) of them overlaps with
   *   timing patterns.
   */
  const v = VERSIONS[version] ?? [[-100]];
  const alignmentPatterns = v[2]!;
  let numberOfBits = 16 * version * version + 128 * version + 64; // finder, timing and format info.
  if (needsVersionInfo(version)) numberOfBits -= 36; // version information
  if (alignmentPatterns.length) {
    // alignment patterns
    numberOfBits -=
      25 * alignmentPatterns.length * alignmentPatterns.length - 10 * alignmentPatterns.length - 55;
  }
  return numberOfBits;
}
