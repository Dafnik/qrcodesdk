import {getGF256LookupTables} from './error-correction';
import type {QRCodeCodewords, QRCodePolynomial} from './types';

/**
 * Calculates ECC code words for given code words and generator polynomial.
 *
 * This is quite similar to CRC calculation as both Reed-Solomon and CRC use
 * the certain kind of cyclic codes, which is effectively the division of
 * zero-augmented polynomial by the generator polynomial. The only difference
 * is that Reed-Solomon uses GF(2^8), instead of CRC's GF(2), and Reed-Solomon
 * uses a different generator polynomial than CRC's.
 *
 * @param {number[]} poly - The array of code words for which ECC words are to be calculated.
 * @param {number[]} genPoly - The generator polynomial used for ECC calculation.
 * @param {number} start - The first code word of the block in `poly`.
 * @param {number} end - The end of the block in `poly`.
 * @returns {number[]} The array of calculated ECC code words.
 */
export function calculateECC(
  poly: readonly number[],
  genPoly: QRCodePolynomial,
  start = 0,
  end = poly.length,
): QRCodeCodewords {
  const {exponents, logarithms} = getGF256LookupTables();
  const polyLength = end - start;
  const modulus = poly.slice(start, end);
  for (let j = 0; j < genPoly.length; j++) modulus.push(0);
  for (let i = 0; i < polyLength;) {
    const value = modulus[i++]!;
    if (value) {
      const quotient = logarithms[value]!;
      for (let j = 0; j < genPoly.length; j++) {
        modulus[i + j]! ^= exponents[quotient + genPoly[j]!]!;
      }
    }
  }
  return modulus.slice(polyLength);
}
