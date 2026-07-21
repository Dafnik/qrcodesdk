import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeInputData,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeResolvedMatrixOptions,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';
import {ECC_LEVELS_MAP} from './error-correction';
import {getMaxDataLength} from './get-max-data-length';
import {QR_CODE_MASKS} from './mask';
import {resolveMode, validateData} from './mode';

export function resolveQRCodeMatrixOptions(
  data: QRCodeInputData,
  options: QRCodeMatrixOptions = {},
): QRCodeResolvedMatrixOptions {
  const mode = resolveMode(data, options.mode);
  const encodedData = validateData(mode, data);
  if (encodedData === undefined) throw new Error('QRCode: Invalid data format');

  const errorCorrectionLevel = resolveErrorCorrectionLevel(options.errorCorrectionLevel);
  const version = resolveVersion(options.version, encodedData.length, mode, errorCorrectionLevel);
  const mask = resolveMask(options.mask);

  return {data: encodedData, mode, errorCorrectionLevel, version, mask};
}

function resolveErrorCorrectionLevel(
  errorCorrectionLevel: QRCodeMatrixOptions['errorCorrectionLevel'],
): QRCodeErrorCorrectionLevelValue {
  const eccLevel = ECC_LEVELS_MAP[(errorCorrectionLevel ?? 'M') as keyof typeof ECC_LEVELS_MAP];
  if (!Number.isInteger(eccLevel) || eccLevel < 0 || eccLevel > 3)
    throw new Error('QRCode: Invalid ECC level');
  return eccLevel;
}

function resolveVersion(
  requestedVersion: QRCodeMatrixOptions['version'],
  dataLength: number,
  mode: QRCodeSupportedModeIndicator,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): QRCodeVersion {
  if (requestedVersion !== undefined) {
    if (requestedVersion < 1 || requestedVersion > 40) throw new Error('QRCode: Invalid version');
    if (dataLength > getMaxDataLength(requestedVersion, mode, errorCorrectionLevel)) {
      throw new Error('QRCode: Data too large');
    }
    return requestedVersion;
  }

  for (let version = 1; version <= 40; version++) {
    const qrVersion = version as QRCodeVersion;
    if (dataLength <= getMaxDataLength(qrVersion, mode, errorCorrectionLevel)) return qrVersion;
  }

  throw new Error('QRCode: Data too large');
}

function resolveMask(mask: QRCodeMatrixOptions['mask']): QRCodeMask | undefined {
  if (mask === undefined) return undefined;
  if (!QR_CODE_MASKS.includes(mask)) throw new Error('QRCode: Invalid mask');
  return mask;
}
