import type {
  QRCodeEncodedData,
  QRCodeErrorCorrectionLevelValue,
  QRCodeInputData,
  QRCodeMask,
  QRCodeMatrix,
  QRCodeMatrixOptions,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';
import {augmentECCs} from './augment-eccs';
import {
  ALPHANUMERIC_REGEXP,
  ECC_LEVELS_MAP,
  GF256_GEN_POLY,
  MODES_MAP,
  MODE_OCTET,
  NUMERIC_REGEXP,
  VERSIONS,
} from './const';
import {createBaseMatrix} from './create-base-matrix';
import {encode} from './encode';
import {evaluateMatrix} from './evaluate-matrix';
import {fillDataInMatrix} from './fill-data-in-matrix';
import {fillFormatInformationInMatrix} from './fill-format-information-in-matrix';
import {getMaxDataLength} from './get-max-data-length';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {maskMatrixData} from './mask-matrix-data';
import {validateData} from './validate-data';

const QR_CODE_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const AUTO_MASK_CANDIDATES = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * Generates a QR code matrix for the given data and options.
 *
 * @param {QRCodeInputData} data - The data to be encoded.
 * @param {QRCodeMatrixOptions} options - The options for generating the QR code matrix.
 * @returns {QRCodeMatrix} The QR code matrix.
 * @throws {string} Throws an error if:
 *
 *                   - The mode or data format is invalid.
 *                   - The ECC level is invalid.
 *                   - The data is too large for the specified version and ECC level.
 *                   - The version is invalid.
 *                   - The mask is invalid.
 */
export function buildQRCodeMatrix(
  data: QRCodeInputData,
  options: QRCodeMatrixOptions = {},
): QRCodeMatrix {
  const mode = resolveMode(data, options.mode);
  const newData = validateData(mode, data);
  if (newData === undefined) throw 'QRCode: Invalid data format';

  const eccLevel = resolveEccLevel(options.errorCorrectionLevel);
  const version = resolveVersion(options.version, newData.length, mode, eccLevel);
  const mask = resolveMask(options.mask);

  return generate(newData, version, mode, eccLevel, mask);
}

function resolveMode(
  data: QRCodeInputData,
  requestedMode: QRCodeMatrixOptions['mode'],
): QRCodeSupportedModeIndicator {
  if (requestedMode !== undefined) {
    const mode = MODES_MAP[requestedMode];
    if (!isQRMode(mode)) throw 'QRCode: Invalid mode';
    return mode;
  }

  if (typeof data === 'number' || data.match(NUMERIC_REGEXP)) return MODES_MAP.numeric;

  if (data.match(ALPHANUMERIC_REGEXP)) return MODES_MAP.alphanumeric;

  return MODE_OCTET;
}

function isQRMode(mode: number | undefined): mode is QRCodeSupportedModeIndicator {
  return mode === MODES_MAP.numeric || mode === MODES_MAP.alphanumeric || mode === MODE_OCTET;
}

function resolveEccLevel(
  errorCorrectionLevel: QRCodeMatrixOptions['errorCorrectionLevel'],
): QRCodeErrorCorrectionLevelValue {
  const eccLevel = ECC_LEVELS_MAP[(errorCorrectionLevel ?? 'L') as keyof typeof ECC_LEVELS_MAP];
  if (!Number.isInteger(eccLevel) || eccLevel < 0 || eccLevel > 3)
    throw 'QRCode: Invalid ECC level';
  return eccLevel;
}

function resolveVersion(
  requestedVersion: QRCodeMatrixOptions['version'],
  dataLength: number,
  mode: QRCodeSupportedModeIndicator,
  eccLevel: QRCodeErrorCorrectionLevelValue,
): QRCodeVersion {
  if (requestedVersion !== undefined) {
    if (requestedVersion < 1 || requestedVersion > 40) throw 'QRCode: Invalid version';
    return requestedVersion;
  }

  for (let version = 1; version <= 40; version++) {
    const qrVersion = version as QRCodeVersion;
    if (dataLength <= getMaxDataLength(qrVersion, mode, eccLevel)) return qrVersion;
  }

  throw 'QRCode: Data to large';
}

function resolveMask(mask: QRCodeMatrixOptions['mask']): QRCodeMask | undefined {
  if (mask === undefined) return undefined;
  if (!QR_CODE_MASKS.includes(mask)) throw 'QRCode: Invalid mask';
  return mask;
}

/**
 * Returns the fully encoded QR code matrix which contains the given data.
 * It also chooses the best mask automatically when the mask is omitted.
 *
 * @param {QRCodeEncodedData} data - The data to be encoded.
 * @param {QRCodeVersion} version - The QR code version.
 * @param {QRCodeSupportedModeIndicator} mode - The encoding mode.
 * @param {QRCodeErrorCorrectionLevelValue} eccLevel - The error correction level.
 * @param {QRCodeMask} mask - The mask to be applied (omitted for automatic selection).
 * @returns {QRCodeMatrix} The fully encoded QR code matrix.
 */
function generate(
  data: QRCodeEncodedData,
  version: QRCodeVersion,
  mode: QRCodeSupportedModeIndicator,
  eccLevel: QRCodeErrorCorrectionLevelValue,
  mask?: QRCodeMask,
): QRCodeMatrix {
  const v = VERSIONS[version] ?? [[-100]];
  let buffer = encode(version, mode, data, getNumberOfAvailableBitsForData(version, eccLevel) >> 3);
  buffer = augmentECCs(buffer, v[1][eccLevel], GF256_GEN_POLY[v[0][eccLevel]]);

  const result = createBaseMatrix(version),
    matrix = result.matrix,
    reserved = result.reserved;

  const filledMatrix = fillDataInMatrix(matrix, reserved, buffer);

  let selectedMask = mask;

  if (selectedMask === undefined) {
    // find the best mask
    maskMatrixData(filledMatrix, reserved, 0);
    fillFormatInformationInMatrix(filledMatrix, eccLevel, 0);

    let bestMask: QRCodeMask = 0,
      bestScore = evaluateMatrix(filledMatrix);

    maskMatrixData(filledMatrix, reserved, 0);

    for (const candidateMask of AUTO_MASK_CANDIDATES) {
      maskMatrixData(filledMatrix, reserved, candidateMask);
      fillFormatInformationInMatrix(filledMatrix, eccLevel, candidateMask);
      const score = evaluateMatrix(filledMatrix);
      if (bestScore > score) {
        bestScore = score;
        bestMask = candidateMask;
      }
      maskMatrixData(filledMatrix, reserved, candidateMask);
    }
    selectedMask = bestMask;
  }

  maskMatrixData(filledMatrix, reserved, selectedMask);
  fillFormatInformationInMatrix(filledMatrix, eccLevel, selectedMask);
  return filledMatrix;
}
