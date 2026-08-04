import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeInputData,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeResolvedMatrixOptions,
  QRCodeVersion,
} from '../types';
import {ECC_LEVELS_MAP} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {QR_CODE_MASKS} from './mask';
import {resolveMode} from './mode';
import {createSingleSegment, getSegmentsBitLength, optimizeSegments} from './segments';

export function resolveQRCodeMatrixOptions(
  data: QRCodeInputData,
  options: QRCodeMatrixOptions = {},
): QRCodeResolvedMatrixOptions {
  validateInputData(data);

  const forcedMode = options.mode === undefined ? undefined : resolveMode(data, options.mode);
  const forcedSegment =
    forcedMode === undefined ? undefined : createSingleSegment(forcedMode, data);
  if (forcedMode !== undefined && forcedSegment === undefined) {
    throw new Error('QRCode: Invalid data format');
  }

  const errorCorrectionLevel = resolveErrorCorrectionLevel(options.errorCorrectionLevel);
  const {version, segments} = resolveVersionAndSegments(
    options.version,
    data,
    forcedSegment === undefined ? undefined : [forcedSegment],
    errorCorrectionLevel,
  );
  const mask = resolveMask(options.mask);

  return {segments, errorCorrectionLevel, version, mask};
}

function validateInputData(data: QRCodeInputData): void {
  if (typeof data === 'number' && (!Number.isSafeInteger(data) || data < 0)) {
    throw new Error('QRCode: Invalid data format');
  }
}

function resolveErrorCorrectionLevel(
  errorCorrectionLevel: QRCodeMatrixOptions['errorCorrectionLevel'],
): QRCodeErrorCorrectionLevelValue {
  const eccLevel = ECC_LEVELS_MAP[(errorCorrectionLevel ?? 'M') as keyof typeof ECC_LEVELS_MAP];
  if (!Number.isInteger(eccLevel) || eccLevel < 0 || eccLevel > 3)
    throw new Error('QRCode: Invalid ECC level');
  return eccLevel;
}

function resolveVersionAndSegments(
  requestedVersion: QRCodeMatrixOptions['version'],
  data: QRCodeInputData,
  forcedSegments: QRCodeResolvedMatrixOptions['segments'] | undefined,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): Pick<QRCodeResolvedMatrixOptions, 'segments' | 'version'> {
  if (requestedVersion !== undefined) {
    validateVersion(requestedVersion);
    const segments = forcedSegments ?? optimizeSegments(data, requestedVersion);
    if (!segmentsFitVersion(segments, requestedVersion, errorCorrectionLevel)) {
      throw new Error('QRCode: Data too large');
    }
    return {segments, version: requestedVersion};
  }

  for (const [start, end] of [
    [1, 9],
    [10, 26],
    [27, 40],
  ] as const) {
    const segments = forcedSegments ?? optimizeSegments(data, start);
    for (let version = start; version <= end; version++) {
      const qrVersion = version as QRCodeVersion;
      if (segmentsFitVersion(segments, qrVersion, errorCorrectionLevel)) {
        return {segments, version: qrVersion};
      }
    }
  }

  throw new Error('QRCode: Data too large');
}

function validateVersion(version: number): asserts version is QRCodeVersion {
  if (!Number.isInteger(version) || version < 1 || version > 40) {
    throw new Error('QRCode: Invalid version');
  }
}

function segmentsFitVersion(
  segments: QRCodeResolvedMatrixOptions['segments'],
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
): boolean {
  return (
    getSegmentsBitLength(version, segments) <=
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel)
  );
}

function resolveMask(mask: QRCodeMatrixOptions['mask']): QRCodeMask | undefined {
  if (mask === undefined) return undefined;
  if (!QR_CODE_MASKS.includes(mask)) throw new Error('QRCode: Invalid mask');
  return mask;
}
