import type {QRCodeCodewords, ResolvedQRCodeMatrixOptions} from '../types';
import {augmentECCs} from './augment-eccs';
import {VERSIONS, getGF256GeneratorPolynomials} from './const';
import {encode} from './encode';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';

export function createQRCodeCodewords({
  data,
  mode,
  errorCorrectionLevel,
  version,
}: ResolvedQRCodeMatrixOptions): QRCodeCodewords {
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
    versionConfig[1][errorCorrectionLevel],
    generatorPolynomials[versionConfig[0][errorCorrectionLevel]],
  );
}
