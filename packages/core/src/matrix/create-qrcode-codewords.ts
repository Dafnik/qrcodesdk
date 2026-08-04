import type {QRCodeCodewords, QRCodeResolvedMatrixOptions} from '../types';
import {augmentECCs, augmentECCsWithMetadata} from './augment-eccs';
import {encode, encodeWithMetadata} from './encode';
import {getGF256GeneratorPolynomials} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import type {QRCodeEncodedBitMetadata} from './metadata';
import {VERSIONS} from './version-config';

type QRCodeCodewordsWithMetadata = {
  readonly codewords: QRCodeCodewords;
  readonly bitMetadata: readonly QRCodeEncodedBitMetadata[];
};

export function createQRCodeCodewords({
  segments,
  errorCorrectionLevel,
  version,
}: QRCodeResolvedMatrixOptions): QRCodeCodewords {
  const versionConfig = VERSIONS[version] ?? [[-100]];
  const dataCodewords = encode(
    version,
    segments,
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel) >> 3,
  );
  const generatorPolynomials = getGF256GeneratorPolynomials();

  return augmentECCs(
    dataCodewords,
    versionConfig[1]![errorCorrectionLevel]!,
    generatorPolynomials[versionConfig[0]![errorCorrectionLevel]!]!,
  );
}

export function createQRCodeCodewordsWithMetadata({
  segments,
  errorCorrectionLevel,
  version,
}: QRCodeResolvedMatrixOptions): QRCodeCodewordsWithMetadata {
  const versionConfig = VERSIONS[version] ?? [[-100]];
  const {codewords: dataCodewords, bitMetadata} = encodeWithMetadata(
    version,
    segments,
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel) >> 3,
  );
  const generatorPolynomials = getGF256GeneratorPolynomials();

  return augmentECCsWithMetadata(
    dataCodewords,
    versionConfig[1]![errorCorrectionLevel]!,
    generatorPolynomials[versionConfig[0]![errorCorrectionLevel]!]!,
    bitMetadata,
  );
}
