import {QRCodeError} from '../error';
import type {QRCodeMatrixOptions, QRCodePayload, QRCodeVersion} from '../types';
import {ECC_LEVELS_MAP} from './error-correction';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {resolveMode} from './mode';
import {createSingleSegment, getSegmentsBitLength, optimizeSegments} from './segments';
import type {QRCodeErrorCorrectionLevelValue, QRCodeResolvedMatrixOptions} from './types';

export function resolveQRCodeMatrixOptions(
  payload: QRCodePayload,
  options: QRCodeMatrixOptions = {},
): QRCodeResolvedMatrixOptions {
  if (typeof payload === 'number' && (!Number.isSafeInteger(payload) || payload < 0)) {
    throw invalidPayload({payload});
  }
  const {eci = false, mask, version: requestedVersion} = options;

  let forcedSegments: QRCodeResolvedMatrixOptions['segments'] | undefined;
  if (options.mode !== undefined) {
    const segment = createSingleSegment(resolveMode(payload, options.mode), payload);
    if (!segment) throw invalidPayload({payload, mode: options.mode});
    forcedSegments = [segment];
  }

  const errorCorrectionLevel =
    ECC_LEVELS_MAP[(options.errorCorrectionLevel ?? 'M') as keyof typeof ECC_LEVELS_MAP];

  let resolved: Pick<QRCodeResolvedMatrixOptions, 'segments' | 'version'> | undefined;
  if (requestedVersion !== undefined) {
    const segments = forcedSegments ?? optimizeSegments(payload, requestedVersion, eci);
    if (!segmentsFitVersion(segments, requestedVersion, errorCorrectionLevel, eci)) {
      throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large', {
        details: {version: requestedVersion},
      });
    }
    resolved = {segments, version: requestedVersion};
  } else {
    // Character count indicator widths change at versions 10 and 27.
    search: for (const [start, end] of [
      [1, 9],
      [10, 26],
      [27, 40],
    ] as const) {
      const segments = forcedSegments ?? optimizeSegments(payload, start, eci);
      for (let version = start; version <= end; version++) {
        if (segmentsFitVersion(segments, version as QRCodeVersion, errorCorrectionLevel, eci)) {
          resolved = {segments, version: version as QRCodeVersion};
          break search;
        }
      }
    }
    if (!resolved) throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large');
  }

  return {...resolved, errorCorrectionLevel, mask, eci};
}

function invalidPayload(details: Record<string, unknown>): QRCodeError {
  return new QRCodeError('INVALID_PAYLOAD', 'QRCode: Invalid payload format', {details});
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
