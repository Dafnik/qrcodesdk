import type {QRCodeCodewords, ɵQRCodeResolvedMatrixOptions} from '../types';
import {augmentECCs, augmentECCsWithMetadata} from './augment-eccs';
import {encode, encodeWithMetadata} from './encode';
import {getGF256GeneratorPolynomials} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import type {QRCodeEncodedBitMetadata} from './metadata';
import {getErrorCorrectionBlockCount, getErrorCorrectionCodewordsPerBlock} from './version-config';

type QRCodeCodewordsWithMetadata = {
  readonly codewords: QRCodeCodewords;
  readonly bitMetadata: readonly QRCodeEncodedBitMetadata[];
};

export function createQRCodeCodewords({
  segments,
  errorCorrectionLevel,
  version,
  eci,
}: ɵQRCodeResolvedMatrixOptions): QRCodeCodewords {
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

export function createQRCodeCodewordsWithMetadata({
  segments,
  errorCorrectionLevel,
  version,
  eci,
}: ɵQRCodeResolvedMatrixOptions): QRCodeCodewordsWithMetadata {
  const {codewords: dataCodewords, bitMetadata} = encodeWithMetadata(
    version,
    segments,
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel) >> 3,
    eci,
  );
  const generatorPolynomials = getGF256GeneratorPolynomials();

  return augmentECCsWithMetadata(
    dataCodewords,
    getErrorCorrectionBlockCount(version, errorCorrectionLevel),
    generatorPolynomials[getErrorCorrectionCodewordsPerBlock(version, errorCorrectionLevel)]!,
    bitMetadata,
  );
}
