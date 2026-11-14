/**
 * The only module in the docs that imports private `@qrcodesdk/core` source files. The QR code
 * explanation reuses the stateless encoder helpers so its tables, bit lengths, error correction,
 * masks, and mask scores always match the encoder.
 *
 * These modules are not a published API. Keep this list to stateless helpers: never import the
 * option resolver or the Kanji registry, which need the identity of the published core objects.
 */
export {applyMaskToMatrix} from '../../../../../packages/core/src/matrix/apply-mask-to-matrix.ts';
export {augmentBCH} from '../../../../../packages/core/src/matrix/augment-bch.ts';
export {augmentECCs} from '../../../../../packages/core/src/matrix/augment-eccs.ts';
export {calculateECC} from '../../../../../packages/core/src/matrix/calculate-ecc.ts';
export {createBaseMatrix} from '../../../../../packages/core/src/matrix/create-base-matrix.ts';
export {
  ECC_LEVELS_MAP,
  getGF256GeneratorPolynomial,
} from '../../../../../packages/core/src/matrix/error-correction.ts';
export {evaluateMatrix} from '../../../../../packages/core/src/matrix/evaluate-matrix.ts';
export {fillDataInMatrix} from '../../../../../packages/core/src/matrix/fill-data-in-matrix.ts';
export {fillFormatInformationInMatrix} from '../../../../../packages/core/src/matrix/fill-format-information-in-matrix.ts';
export {getNumberOfAvailableBitsForData} from '../../../../../packages/core/src/matrix/get-number-of-available-bits-for-data.ts';
export {
  ALPHANUMERIC_CHARACTERS,
  ECI_UTF8_ASSIGNMENT,
  ECI_UTF8_BIT_LENGTH,
  MODES_MAP,
  MODE_ECI,
  getCharacterCountBits,
  getPayloadBitLength,
} from '../../../../../packages/core/src/matrix/mode.ts';
export type {
  QRCodeCodewords,
  QRCodeErrorCorrectionLevelValue,
  QRCodeSupportedModeIndicator,
} from '../../../../../packages/core/src/matrix/types.ts';
export {
  getErrorCorrectionBlockCount,
  getErrorCorrectionCodewordsPerBlock,
} from '../../../../../packages/core/src/matrix/version-config.ts';
export {
  getMicroCharacterCountBits,
  getMicroModeIndicator,
  getMicroSegmentBitLength,
  supportsMicroMode,
} from '../../../../../packages/core/src/micro/encode.ts';
export {
  createMicroBaseMatrix,
  evaluateMicroMatrix,
  fillMicroData,
  fillMicroFormatInformation,
} from '../../../../../packages/core/src/micro/matrix.ts';
export {
  type QRCodeMicroLevel,
  type QRCodeMicroVersionNumber,
  getMicroDataBits,
  getMicroDataCodewords,
  getMicroErrorCorrectionCodewords,
  getMicroSymbolNumber,
} from '../../../../../packages/core/src/micro/tables.ts';
