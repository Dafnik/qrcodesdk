import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeInputData,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
  ResolvedQRCodeMatrixOptions,
} from '../types';
import {ALPHANUMERIC_REGEXP, ECC_LEVELS_MAP, MODES_MAP, MODE_OCTET, NUMERIC_REGEXP} from './const';
import {getMaxDataLength} from './get-max-data-length';
import {validateData} from './validate-data';

const QR_CODE_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export function resolveQRCodeMatrixOptions(
  data: QRCodeInputData,
  options: QRCodeMatrixOptions = {},
): ResolvedQRCodeMatrixOptions {
  const mode = resolveMode(data, options.mode);
  const encodedData = validateData(mode, data);
  if (encodedData === undefined) throw 'QRCode: Invalid data format';

  const errorCorrectionLevel = resolveErrorCorrectionLevel(options.errorCorrectionLevel);
  const version = resolveVersion(options.version, encodedData.length, mode, errorCorrectionLevel);
  const mask = resolveMask(options.mask);

  return {data: encodedData, mode, errorCorrectionLevel, version, mask};
}

function resolveMode(
  data: QRCodeInputData,
  requestedMode: QRCodeMatrixOptions['mode'],
): QRCodeSupportedModeIndicator {
  if (requestedMode !== undefined) {
    const mode = MODES_MAP[requestedMode];
    if (!isSupportedMode(mode)) throw 'QRCode: Invalid mode';
    return mode;
  }

  if (typeof data === 'number' || data.match(NUMERIC_REGEXP)) return MODES_MAP.numeric;
  if (data.match(ALPHANUMERIC_REGEXP)) return MODES_MAP.alphanumeric;
  return MODE_OCTET;
}

function isSupportedMode(mode: number | undefined): mode is QRCodeSupportedModeIndicator {
  return mode === MODES_MAP.numeric || mode === MODES_MAP.alphanumeric || mode === MODE_OCTET;
}

function resolveErrorCorrectionLevel(
  errorCorrectionLevel: QRCodeMatrixOptions['errorCorrectionLevel'],
): QRCodeErrorCorrectionLevelValue {
  const eccLevel = ECC_LEVELS_MAP[(errorCorrectionLevel ?? 'M') as keyof typeof ECC_LEVELS_MAP];
  if (!Number.isInteger(eccLevel) || eccLevel < 0 || eccLevel > 3)
    throw 'QRCode: Invalid ECC level';
  return eccLevel;
}

function resolveVersion(
  requestedVersion: QRCodeMatrixOptions['version'],
  dataLength: number,
  mode: QRCodeSupportedModeIndicator,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): QRCodeVersion {
  if (requestedVersion !== undefined) {
    if (requestedVersion < 1 || requestedVersion > 40) throw 'QRCode: Invalid version';
    return requestedVersion;
  }

  for (let version = 1; version <= 40; version++) {
    const qrVersion = version as QRCodeVersion;
    if (dataLength <= getMaxDataLength(qrVersion, mode, errorCorrectionLevel)) return qrVersion;
  }

  throw 'QRCode: Data to large';
}

function resolveMask(mask: QRCodeMatrixOptions['mask']): QRCodeMask | undefined {
  if (mask === undefined) return undefined;
  if (!QR_CODE_MASKS.includes(mask)) throw 'QRCode: Invalid mask';
  return mask;
}
