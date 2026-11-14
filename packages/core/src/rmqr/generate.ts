import {QRCodeError} from '../error';
import {augmentECCs} from '../matrix/augment-eccs';
import {getGF256GeneratorPolynomial} from '../matrix/error-correction';
import {resolveKanjiLookup, throwMissingKanji} from '../matrix/kanji';
import {resolveMode} from '../matrix/mode';
import {toPublicArray} from '../matrix/public-array';
import {createSingleSegment} from '../matrix/segments';
import type {QRCodeEncodedSegment} from '../matrix/types';
import {throwInvalid} from '../options';
import type {QRCodeMatrix, QRCodeMatrixOptions, QRCodePayload} from '../types';
import {encodeRMQR, fitsRMQRCharacterCount, getRMQRSegmentBitLength} from './encode';
import {
  applyRMQRMask,
  createRMQRBaseMatrix,
  fillRMQRData,
  fillRMQRFormatInformation,
} from './matrix';
import {
  type QRCodeRMQRLevel,
  type QRCodeRMQRVersionIndex,
  getRMQRBlockCount,
  getRMQRDataCodewords,
  getRMQRTotalCodewords,
} from './tables';

/**
 * Generates an rMQR code in the first of the candidate versions that holds the payload. The
 * candidates are in preference order; `requested` names them in `PAYLOAD_TOO_LARGE` errors.
 */
export function generateRMQRMatrix(
  payload: QRCodePayload,
  options: QRCodeMatrixOptions,
  candidates: readonly QRCodeRMQRVersionIndex[],
  requested: string | undefined,
): QRCodeMatrix {
  if (options.segmenter !== undefined) throwStandardOnly('segmenter', options.segmenter);
  if (options.version !== undefined) throwStandardOnly('version', options.version);
  if (options.mask !== undefined) throwStandardOnly('mask', options.mask);
  if (options.eci) throwStandardOnly('eci', options.eci);

  const {mode, errorCorrectionLevel = 'M', kanji} = options;
  const levelIndex = ['M', 'H'].indexOf(errorCorrectionLevel);
  if (levelIndex < 0) {
    throwInvalid('errorCorrectionLevel', 'M or H for rMQR codes', errorCorrectionLevel);
  }
  const level = levelIndex as QRCodeRMQRLevel;

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

  for (const version of candidates) {
    const dataCodewords = getRMQRDataCodewords(version, level);
    if (
      fitsRMQRCharacterCount(version, segment) &&
      getRMQRSegmentBitLength(version, segment) <= dataCodewords * 8
    ) {
      return assembleRMQRMatrix(version, level, segment, dataCodewords);
    }
  }
  throw new QRCodeError(
    'PAYLOAD_TOO_LARGE',
    'QRCode: Payload too large',
    requested ? {details: {version: requested}} : {},
  );
}

function assembleRMQRMatrix(
  version: QRCodeRMQRVersionIndex,
  level: QRCodeRMQRLevel,
  segment: QRCodeEncodedSegment,
  dataCodewords: number,
): QRCodeMatrix {
  const blocks = getRMQRBlockCount(version, level);
  const errorCorrectionCodewords = (getRMQRTotalCodewords(version) - dataCodewords) / blocks;
  const codewords = augmentECCs(
    encodeRMQR(version, segment, dataCodewords),
    blocks,
    getGF256GeneratorPolynomial(errorCorrectionCodewords),
  );

  const {width, height, modules: base, roles, publicRoles} = createRMQRBaseMatrix(version);
  const modules = fillRMQRData(base.slice(), roles, width, height, codewords);
  applyRMQRMask(modules, roles, width, height);
  fillRMQRFormatInformation(modules, width, height, version, level);

  return {width, height, modules: toPublicArray(modules), roles: publicRoles};
}

function throwStandardOnly(field: string, value: unknown): never {
  throwInvalid(field, 'unset for rMQR codes', value);
}
