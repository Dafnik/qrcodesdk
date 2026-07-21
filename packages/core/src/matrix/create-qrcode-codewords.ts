import type {QRCodeCodewords, QRCodeResolvedMatrixOptions} from '../types';
import {augmentECCs} from './augment-eccs';
import {encode} from './encode';
import {getGF256GeneratorPolynomials} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {VERSIONS} from './version-config';

export function createQRCodeCodewords({
  data,
  mode,
  errorCorrectionLevel,
  version,
}: QRCodeResolvedMatrixOptions): QRCodeCodewords {
  const versionConfig = VERSIONS[version] ?? [[-100]];
  const dataCodewords = encode(
    version,
    mode,
    data,
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel) >> 3,
  );
  const generatorPolynomials = getGF256GeneratorPolynomials();

  return augmentECCs(
    dataCodewords,
    versionConfig[1]![errorCorrectionLevel]!,
    generatorPolynomials[versionConfig[0]![errorCorrectionLevel]!]!,
  );
}
