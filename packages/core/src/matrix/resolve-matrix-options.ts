import {QRCodeError} from '../error';
import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodePayload,
  QRCodeResolvedMatrixOptions,
  QRCodeVersion,
} from '../types';
import {ECC_LEVELS_MAP} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {QR_CODE_MASKS} from './mask';
import {resolveMode} from './mode';
import {createSingleSegment, getSegmentsBitLength, optimizeSegments} from './segments';

export function resolveQRCodeMatrixOptions(
  payload: QRCodePayload,
  options: QRCodeMatrixOptions = {},
): QRCodeResolvedMatrixOptions {
  validatePayload(payload);
  const eci = resolveECI(options.eci);

  const forcedMode = options.mode === undefined ? undefined : resolveMode(payload, options.mode);
  const forcedSegment =
    forcedMode === undefined ? undefined : createSingleSegment(forcedMode, payload);
  if (forcedMode !== undefined && forcedSegment === undefined) {
    throw new QRCodeError('INVALID_PAYLOAD', 'QRCode: Invalid payload format', {
      details: {payload, mode: options.mode},
    });
  }

  const errorCorrectionLevel = resolveErrorCorrectionLevel(options.errorCorrectionLevel);
  const {version, segments} = resolveVersionAndSegments(
    options.version,
    payload,
    forcedSegment === undefined ? undefined : [forcedSegment],
    errorCorrectionLevel,
    eci,
  );
  const mask = resolveMask(options.mask);

  return {segments, errorCorrectionLevel, version, mask, eci};
}

function validatePayload(payload: QRCodePayload): void {
  if (typeof payload === 'number' && (!Number.isSafeInteger(payload) || payload < 0)) {
    throw new QRCodeError('INVALID_PAYLOAD', 'QRCode: Invalid payload format', {
      details: {payload},
    });
  }
}

function resolveErrorCorrectionLevel(
  errorCorrectionLevel: QRCodeMatrixOptions['errorCorrectionLevel'],
): QRCodeErrorCorrectionLevelValue {
  const eccLevel = ECC_LEVELS_MAP[(errorCorrectionLevel ?? 'M') as keyof typeof ECC_LEVELS_MAP];
  if (!Number.isInteger(eccLevel) || eccLevel < 0 || eccLevel > 3) {
    throw new QRCodeError('INVALID_OPTIONS', 'QRCode: Invalid ECC level', {
      details: {field: 'errorCorrectionLevel', value: errorCorrectionLevel},
    });
  }
  return eccLevel;
}

function resolveVersionAndSegments(
  requestedVersion: QRCodeMatrixOptions['version'],
  payload: QRCodePayload,
  forcedSegments: QRCodeResolvedMatrixOptions['segments'] | undefined,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  eci: boolean,
): Pick<QRCodeResolvedMatrixOptions, 'segments' | 'version'> {
  if (requestedVersion !== undefined) {
    validateVersion(requestedVersion);
    const segments = forcedSegments ?? optimizeSegments(payload, requestedVersion, eci);
    if (!segmentsFitVersion(segments, requestedVersion, errorCorrectionLevel, eci)) {
      throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large', {
        details: {version: requestedVersion},
      });
    }
    return {segments, version: requestedVersion};
  }

  for (const [start, end] of [
    [1, 9],
    [10, 26],
    [27, 40],
  ] as const) {
    const segments = forcedSegments ?? optimizeSegments(payload, start, eci);
    for (let version = start; version <= end; version++) {
      const qrVersion = version as QRCodeVersion;
      if (segmentsFitVersion(segments, qrVersion, errorCorrectionLevel, eci)) {
        return {segments, version: qrVersion};
      }
    }
  }

  throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large');
}

function validateVersion(version: number): asserts version is QRCodeVersion {
  if (!Number.isInteger(version) || version < 1 || version > 40) {
    throw new QRCodeError('INVALID_OPTIONS', 'QRCode: Invalid version', {
      details: {field: 'version', value: version},
    });
  }
}

export function segmentsFitVersion(
  segments: QRCodeResolvedMatrixOptions['segments'],
  version: QRCodeVersion,
  errorCorrectionLevel: QRCodeErrorCorrectionLevelValue,
  eci: boolean,
): boolean {
  return (
    getSegmentsBitLength(version, segments, eci) <=
    getNumberOfAvailableBitsForData(version, errorCorrectionLevel)
  );
}

function resolveECI(eci: QRCodeMatrixOptions['eci']): boolean {
  if (eci === undefined) return false;
  if (typeof eci !== 'boolean') {
    throw new QRCodeError('INVALID_OPTIONS', 'QRCode: Invalid ECI setting', {
      details: {field: 'eci', value: eci},
    });
  }
  return eci;
}

function resolveMask(mask: QRCodeMatrixOptions['mask']): QRCodeMask | undefined {
  if (mask === undefined) return undefined;
  if (!QR_CODE_MASKS.includes(mask)) {
    throw new QRCodeError('INVALID_OPTIONS', 'QRCode: Invalid mask', {
      details: {field: 'mask', value: mask},
    });
  }
  return mask;
}
