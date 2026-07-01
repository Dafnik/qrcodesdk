import type {QRCodeMask, QRCodeMatrixOptions} from '../types';
import {augmentECCs} from './augment-eccs';
import {
  ALPHANUMERIC_REGEXP,
  ECC_LEVELS_MAP,
  GF256_GEN_POLY,
  MODES_MAP,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
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

type EncodedData = string | number[];
type QRMode = typeof MODE_NUMERIC | typeof MODE_ALPHANUMERIC | typeof MODE_OCTET;

const QR_CODE_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const AUTO_MASK_CANDIDATES = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * Generates a QR code matrix for the given data and options.
 *
 * @param {string | number} data - The data to be encoded.
 * @param {QRCodeMatrixOptions} options - The options for generating the QR code matrix.
 * @returns {number[][]} The QR code matrix.
 * @throws {string} Throws an error if:
 *
 *                   - The mode or data format is invalid.
 *                   - The ECC level is invalid.
 *                   - The data is too large for the specified version and ECC level.
 *                   - The version is invalid.
 *                   - The mask is invalid.
 */
export function buildQRCodeMatrix(
  data: string | number,
  options: QRCodeMatrixOptions = {},
): number[][] {
  const mode = resolveMode(data, options.mode);
  const newData = validateData(mode, data);
  if (newData === undefined) throw 'QRCode: Invalid data format';

  const eccLevel = resolveEccLevel(options.errorCorrectionLevel);
  const version = resolveVersion(options.version, newData.length, mode, eccLevel);
  const mask = resolveMask(options.mask);

  return generate(newData, version, mode, eccLevel, mask);
}

function resolveMode(data: string | number, requestedMode: QRCodeMatrixOptions['mode']): QRMode {
  if (requestedMode !== undefined) {
    const mode = MODES_MAP[requestedMode];
    if (!isQRMode(mode)) throw 'QRCode: Invalid mode';
    return mode;
  }

  if (typeof data === 'number' || data.match(NUMERIC_REGEXP)) return MODE_NUMERIC;

  if (data.match(ALPHANUMERIC_REGEXP)) return MODE_ALPHANUMERIC;

  return MODE_OCTET;
}

function isQRMode(mode: number | undefined): mode is QRMode {
  return mode === MODE_NUMERIC || mode === MODE_ALPHANUMERIC || mode === MODE_OCTET;
}

function resolveEccLevel(
  errorCorrectionLevel: QRCodeMatrixOptions['errorCorrectionLevel'],
): number {
  const eccLevel = ECC_LEVELS_MAP[errorCorrectionLevel ?? 'L'];
  if (!Number.isInteger(eccLevel) || eccLevel < 0 || eccLevel > 3)
    throw 'QRCode: Invalid ECC level';
  return eccLevel;
}

function resolveVersion(
  requestedVersion: QRCodeMatrixOptions['version'],
  dataLength: number,
  mode: QRMode,
  eccLevel: number,
): number {
  if (requestedVersion !== undefined) {
    if (requestedVersion < 1 || requestedVersion > 40) throw 'QRCode: Invalid version';
    return requestedVersion;
  }

  for (let version = 1; version <= 40; version++) {
    if (dataLength <= getMaxDataLength(version, mode, eccLevel)) return version;
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
 * @param {string | number[]} data - The data to be encoded.
 * @param {number} version - The QR code version.
 * @param {number} mode - The encoding mode (numeric, alphanumeric, octet).
 * @param {number} eccLevel - The error correction level.
 * @param {number} mask - The mask to be applied (omitted for automatic selection).
 * @returns {number[][]} The fully encoded QR code matrix.
 */
function generate(
  data: EncodedData,
  version: number,
  mode: QRMode,
  eccLevel: number,
  mask?: QRCodeMask,
): number[][] {
  const v = VERSIONS[version] ?? [[-100]];
  let buffer = encode(version, mode, data, getNumberOfAvailableBitsForData(version, eccLevel) >> 3);
  buffer = augmentECCs(buffer, v[1][eccLevel], GF256_GEN_POLY[v[0][eccLevel]]);

  const result = createBaseMatrix(version),
    matrix = result.matrix,
    reserved = result.reserved;

  fillDataInMatrix(matrix, reserved, buffer);

  let selectedMask = mask;

  if (selectedMask === undefined) {
    // find the best mask
    maskMatrixData(matrix, reserved, 0);
    fillFormatInformationInMatrix(matrix, eccLevel, 0);

    let bestMask: QRCodeMask = 0,
      bestScore = evaluateMatrix(matrix);

    maskMatrixData(matrix, reserved, 0);

    for (const candidateMask of AUTO_MASK_CANDIDATES) {
      maskMatrixData(matrix, reserved, candidateMask);
      fillFormatInformationInMatrix(matrix, eccLevel, candidateMask);
      const score = evaluateMatrix(matrix);
      if (bestScore > score) {
        bestScore = score;
        bestMask = candidateMask;
      }
      maskMatrixData(matrix, reserved, candidateMask);
    }
    selectedMask = bestMask;
  }

  maskMatrixData(matrix, reserved, selectedMask);
  fillFormatInformationInMatrix(matrix, eccLevel, selectedMask);
  return matrix;
}
