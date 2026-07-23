import type {
  QRCodeCodewords,
  QRCodeErrorCorrectionLevel,
  QRCodeErrorCorrectionLevelValue,
  QRCodePolynomial,
} from '../types';

// ECC levels (cf. Table 22 in JIS X 0510:2004 p. 45)
export const ECC_LEVEL_L = 1,
  ECC_LEVEL_M = 0,
  ECC_LEVEL_Q = 3,
  ECC_LEVEL_H = 2 satisfies QRCodeErrorCorrectionLevelValue;

export const ECC_LEVELS_MAP: Record<QRCodeErrorCorrectionLevel, QRCodeErrorCorrectionLevelValue> = {
  L: ECC_LEVEL_L,
  M: ECC_LEVEL_M,
  Q: ECC_LEVEL_Q,
  H: ECC_LEVEL_H,
};

export const ECC_LEVELS = ['L', 'M', 'Q', 'H'] as QRCodeErrorCorrectionLevel[];

type GF256LookupTables = {
  exponents: QRCodeCodewords;
  logarithms: QRCodeCodewords;
};

let cachedGF256LookupTables: GF256LookupTables | undefined;
let cachedGF256GeneratorPolynomials: QRCodePolynomial[] | undefined;

// GF(2^8)-to-integer mapping with a reducing polynomial x^8+x^4+x^3+x^2+1
// invariant: exponents[logarithms[i]] == i for all i in [1,256]
export function getGF256LookupTables(): GF256LookupTables {
  cachedGF256LookupTables ??= createGF256LookupTables();
  return cachedGF256LookupTables;
}

// Generator polynomials up to degree 30 (JIS X 0510:2004 Appendix A).
export function getGF256GeneratorPolynomials(): QRCodePolynomial[] {
  cachedGF256GeneratorPolynomials ??= createGF256GeneratorPolynomials(getGF256LookupTables());
  return cachedGF256GeneratorPolynomials;
}

function createGF256LookupTables(): GF256LookupTables {
  const exponents: QRCodeCodewords = [];
  const logarithms: QRCodeCodewords = [-1];
  for (let i = 0, value = 1; i < 255; i++) {
    exponents.push(value);
    logarithms[value] = i;
    value = (value * 2) ^ (value >= 128 ? 0x11d : 0);
  }
  return {exponents, logarithms};
}

function createGF256GeneratorPolynomials({
  exponents,
  logarithms,
}: GF256LookupTables): QRCodePolynomial[] {
  const polynomials: QRCodePolynomial[] = [[]];
  for (let i = 0; i < 30; i++) {
    const previousPolynomial = polynomials[i]!;
    const polynomial: QRCodePolynomial = [];
    for (let j = 0; j <= i; j++) {
      const a = j < i ? exponents[previousPolynomial[j]!]! : 0;
      const b = exponents[(i + (previousPolynomial[j - 1] || 0)) % 255]!;
      polynomial.push(logarithms[a ^ b]!);
    }
    polynomials.push(polynomial);
  }
  return polynomials;
}
