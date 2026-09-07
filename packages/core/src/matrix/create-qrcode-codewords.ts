import type {QRCodeCodewords, QRCodeResolvedMatrixOptions} from '../types';
import {augmentECCs} from './augment-eccs';
import {encode} from './encode';
import {getGF256GeneratorPolynomials} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {getErrorCorrectionBlockCount, getErrorCorrectionCodewordsPerBlock} from './version-config';

export function createQRCodeCodewords({
  segments,
  errorCorrectionLevel,
  version,
  eci,
}: QRCodeResolvedMatrixOptions): QRCodeCodewords {
  const dataCodewords = encode(
    version,
    segments,
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel) >> 3,
    eci,
  );
  const generatorPolynomials = getGF256GeneratorPolynomials();

  return augmentECCs(
    dataCodewords,
    getErrorCorrectionBlockCount(version, errorCorrectionLevel),
    generatorPolynomials[getErrorCorrectionCodewordsPerBlock(version, errorCorrectionLevel)]!,
  );
}
