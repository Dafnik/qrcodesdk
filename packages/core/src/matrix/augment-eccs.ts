import {calculateECC} from './calculate-ecc';
import type {QRCodeCodewords, QRCodePolynomial} from './types';

/**
 * Augments ECC code words to given code words. The resulting words are
 * ready to be encoded in the matrix.
 *
 * The actual augmenting procedure follows JIS X 0510:2004 sec 8.7.
 * The code is simplified using the fact that the size of each code & ECC
 * blocks is almost the same; for example, when we have 4 blocks and 46 data words,
 * the number of code words in those blocks are 11, 11, 12, 12 respectively.
 *
 * @param {number[]} poly - The array of code words to which ECC words are to be augmented.
 * @param {number} blockNumber - The number of blocks into which the code words are divided.
 * @param {number[]} genPoly - The generator polynomial used for calculating ECC words.
 * @returns {number[]} The augmented array of code words ready for encoding in the matrix.
 */
export function augmentECCs(
  poly: QRCodeCodewords,
  blockNumber: number,
  genPoly: QRCodePolynomial,
): QRCodeCodewords {
  const subSize = (poly.length / blockNumber) | 0,
    pivot = blockNumber - (poly.length % blockNumber),
    // Blocks from the pivot on hold one more code word.
    blockStart = (block: number) => block * subSize + Math.max(0, block - pivot),
    eccs: QRCodeCodewords[] = [],
    result: QRCodeCodewords = [];

  for (let j = 0; j < blockNumber; j++) {
    eccs.push(calculateECC(poly, genPoly, blockStart(j), blockStart(j + 1)));
  }
  for (let i = 0; i < subSize; i++) {
    for (let j = 0; j < blockNumber; j++) result.push(poly[blockStart(j) + i]!);
  }
  for (let j = pivot; j < blockNumber; j++) result.push(poly[blockStart(j + 1) - 1]!);
  for (let i = 0; i < genPoly.length; i++) {
    for (let j = 0; j < blockNumber; j++) result.push(eccs[j]![i]!);
  }
  return result;
}
