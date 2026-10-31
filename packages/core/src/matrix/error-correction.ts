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

type GF256LookupTables = {
  exponents: QRCodeCodewords;
  logarithms: QRCodeCodewords;
};

let cachedGF256LookupTables: GF256LookupTables | undefined;
const generatorPolynomials: QRCodePolynomial[] = [[]];

// GF(2^8)-to-integer mapping with a reducing polynomial x^8+x^4+x^3+x^2+1
// invariant: exponents[logarithms[i]] == i for all i in [1,256]
export function getGF256LookupTables(): GF256LookupTables {
  if (!cachedGF256LookupTables) {
    const exponents: QRCodeCodewords = [];
    const logarithms: QRCodeCodewords = [-1];
    for (let i = 0, value = 1; i < 255; i++) {
      exponents.push(value);
      logarithms[value] = i;
      value = (value * 2) ^ (value >= 128 ? 0x11d : 0);
    }
    cachedGF256LookupTables = {exponents, logarithms};
  }
  return cachedGF256LookupTables;
}

// Generator polynomial of the given degree (JIS X 0510:2004 Appendix A), as logarithms.
export function getGF256GeneratorPolynomial(degree: number): QRCodePolynomial {
  const {exponents, logarithms} = getGF256LookupTables();
  for (let i = generatorPolynomials.length - 1; i < degree; i++) {
    const previousPolynomial = generatorPolynomials[i]!;
    const polynomial: QRCodePolynomial = [];
    for (let j = 0; j <= i; j++) {
      const a = j < i ? exponents[previousPolynomial[j]!]! : 0;
      const b = exponents[(i + (previousPolynomial[j - 1] || 0)) % 255]!;
      polynomial.push(logarithms[a ^ b]!);
    }
    generatorPolynomials.push(polynomial);
  }
  return generatorPolynomials[degree]!;
}
