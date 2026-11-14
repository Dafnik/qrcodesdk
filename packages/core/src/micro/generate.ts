import {QRCodeError} from '../error';
import {applyMaskToMatrix} from '../matrix/apply-mask-to-matrix';
import {calculateECC} from '../matrix/calculate-ecc';
import {getGF256GeneratorPolynomial} from '../matrix/error-correction';
import {generateQRCodeMatrix} from '../matrix/generate-qrcode-matrix';
import {resolveKanjiLookup, throwMissingKanji} from '../matrix/kanji';
import {resolveMode} from '../matrix/mode';
import {toPublicArray} from '../matrix/public-array';
import {createSingleSegment} from '../matrix/segments';
import type {QRCodeEncodedSegment} from '../matrix/types';
import {throwInvalid} from '../options';
import type {QRCodeMask, QRCodeMatrix, QRCodeMatrixOptions, QRCodePayload} from '../types';
import {encodeMicro, getMicroSegmentBitLength, supportsMicroMode} from './encode';
import {
  createMicroBaseMatrix,
  evaluateMicroMatrix,
  fillMicroData,
  fillMicroFormatInformation,
} from './matrix';
import {
  type QRCodeMicroLevel,
  type QRCodeMicroVersionNumber,
  getMicroDataBits,
  getMicroErrorCorrectionCodewords,
  getMicroSymbolNumber,
} from './tables';

// Micro QR masks 0-3 are the standard QR masks 1, 4, 6, and 7 (ISO/IEC 18004:2015 Table 10).
const STANDARD_MASKS = [1, 4, 6, 7] as const satisfies readonly QRCodeMask[];
const VERSIONS = [1, 2, 3, 4] as const satisfies readonly QRCodeMicroVersionNumber[];

/**
 * Generates the smallest Micro QR code that holds the payload, or the requested version. Falls back
 * to a standard QR code when allowed and no Micro QR code can hold the payload at the level.
 */
export function generateMicroQRCodeMatrix(
  payload: QRCodePayload,
  options: QRCodeMatrixOptions,
  requestedVersion: QRCodeMicroVersionNumber | undefined,
  requestedMask: number | undefined,
  fallback: boolean,
): QRCodeMatrix {
  if (options.segmenter !== undefined) throwStandardOnly('segmenter', options.segmenter);
  if (options.version !== undefined) throwStandardOnly('version', options.version);
  if (options.mask !== undefined) throwStandardOnly('mask', options.mask);
  if (options.eci) throwStandardOnly('eci', options.eci);

  const {mode, errorCorrectionLevel = 'M', kanji} = options;
  const level = ['L', 'M', 'Q', 'H'].indexOf(errorCorrectionLevel) as QRCodeMicroLevel;
  if (level < 0) throwInvalid('errorCorrectionLevel', 'L, M, Q, or H', errorCorrectionLevel);

  // Kanji mode needs the Shift JIS table, as for standard QR codes. M3 and M4 support it.
  const kanjiLookup = resolveKanjiLookup(kanji);
  if (mode === 'kanji' && !kanjiLookup) throwMissingKanji();
  const segment = createSingleSegment(
    resolveMode(payload, mode, kanjiLookup),
    payload,
    kanjiLookup,
  );
  if (!segment) {
    throw new QRCodeError('INVALID_PAYLOAD', 'QRCode: Invalid payload format', {
      details: {payload, mode},
    });
  }

  let supportsLevel = false;
  for (const version of requestedVersion ? [requestedVersion] : VERSIONS) {
    const symbolNumber = getMicroSymbolNumber(version, level, requestedVersion !== undefined);
    if (symbolNumber < 0) continue;
    supportsLevel = true;
    const dataBits = getMicroDataBits(version, symbolNumber);
    if (
      supportsMicroMode(version, segment.mode) &&
      getMicroSegmentBitLength(version, segment) <= dataBits
    ) {
      return assembleMicroQRCodeMatrix(version, symbolNumber, segment, dataBits, requestedMask);
    }
  }

  if (fallback) return generateQRCodeMatrix(payload, {mode, errorCorrectionLevel, kanji});
  if (!supportsLevel) {
    throwInvalid(
      'errorCorrectionLevel',
      requestedVersion
        ? `a level supported by Micro QR version M${String(requestedVersion)}`
        : 'L, M, or Q for Micro QR codes',
      errorCorrectionLevel,
    );
  }
  throw new QRCodeError(
    'PAYLOAD_TOO_LARGE',
    'QRCode: Payload too large',
    requestedVersion ? {details: {version: `M${String(requestedVersion)}`}} : {},
  );
}

function assembleMicroQRCodeMatrix(
  version: QRCodeMicroVersionNumber,
  symbolNumber: number,
  segment: QRCodeEncodedSegment,
  dataBits: number,
  requestedMask: number | undefined,
): QRCodeMatrix {
  const dataCodewords = encodeMicro(version, segment, dataBits);
  const codewords = dataCodewords.concat(
    calculateECC(
      dataCodewords,
      getGF256GeneratorPolynomial(getMicroErrorCorrectionCodewords(symbolNumber)),
    ),
  );

  const {size, modules: base, roles, publicRoles} = createMicroBaseMatrix(version);
  const unmasked = fillMicroData(base.slice(), roles, size, codewords, dataBits);
  let bestModules = unmasked;
  let bestMask = requestedMask ?? 0;
  if (requestedMask !== undefined) {
    applyMaskToMatrix(bestModules, roles, size, STANDARD_MASKS[requestedMask]!);
  } else {
    let bestScore = -1;
    for (let mask = 0; mask < 4; mask++) {
      const candidate = applyMaskToMatrix(unmasked.slice(), roles, size, STANDARD_MASKS[mask]!);
      const score = evaluateMicroMatrix(candidate, size);
      if (score > bestScore) {
        bestScore = score;
        bestModules = candidate;
        bestMask = mask;
      }
    }
  }
  fillMicroFormatInformation(bestModules, size, symbolNumber, bestMask);

  return {size, modules: toPublicArray(bestModules), roles: publicRoles};
}

function throwStandardOnly(field: string, value: unknown): never {
  throwInvalid(field, 'unset for Micro QR codes', value);
}
