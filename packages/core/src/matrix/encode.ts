import {QRCodeError} from '../error';
import type {QRCodeCodewords, QRCodeEncodedSegment, QRCodeVersion} from '../types';
import type {QRCodeEncodedBitMetadata, QRCodeMatrixMetadataRole} from './metadata';
import {
  ECI_UTF8_ASSIGNMENT,
  MODE_ECI,
  MODE_OCTET,
  MODE_TERMINATOR,
  getModeDefinition,
} from './mode';

type QRCodeDataBitRole = Extract<
  QRCodeMatrixMetadataRole,
  'eci' | 'mode' | 'character-count' | 'payload' | 'terminator' | 'padding'
>;

type QRCodeEncodedDataWithMetadata = {
  readonly codewords: QRCodeCodewords;
  readonly bitMetadata: readonly QRCodeEncodedBitMetadata[];
};

/**
 * Returns the code words (sans ECC bits) for given data and configurations.
 * Requires data to be preprocessed by `validateData`. No length check is
 * performed, and everything has to be checked before calling this function.
 *
 * @param {QRCodeVersion} version - The version number of the QR code.
 * @param {readonly QRCodeEncodedSegment[]} segments - The data segments to encode.
 * @param {number} maxBufferLength - The maximum buffer length.
 * @returns {QRCodeCodewords} The code words for the given data.
 */
export function encode(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
  maxBufferLength: number,
  eci: boolean,
): QRCodeCodewords {
  return encodeData(version, segments, maxBufferLength, eci).codewords;
}

export function encodeWithMetadata(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
  maxBufferLength: number,
  eci: boolean,
): QRCodeEncodedDataWithMetadata {
  const roles: QRCodeDataBitRole[] = [];
  const {codewords} = encodeData(version, segments, maxBufferLength, eci, roles);
  const roleCounts = countRoles(roles);
  const roleOffsets = new Map<QRCodeDataBitRole, number>();
  const bitMetadata = roles.map((role) => {
    const bitIndex = roleOffsets.get(role) ?? 0;
    roleOffsets.set(role, bitIndex + 1);
    return {
      role,
      bitIndex,
      bitCount: roleCounts.get(role)!,
    } satisfies QRCodeEncodedBitMetadata;
  });

  return {codewords, bitMetadata};
}

function encodeData(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
  maxBufferLength: number,
  eci: boolean,
  roles?: QRCodeDataBitRole[],
): {readonly codewords: QRCodeCodewords} {
  const buffer: QRCodeCodewords = [];
  const capacity = maxBufferLength * 8;
  let bits = 0,
    remaining = 8;

  const record = function (role: QRCodeDataBitRole, bitCount: number): void {
    if (roles === undefined || bitCount <= 0 || roles.length >= capacity) return;
    const writableBitCount = Math.min(bitCount, capacity - roles.length);
    for (let index = 0; index < writableBitCount; index++) roles.push(role);
  };

  // this function is intentionally no-op when n=0.
  const pack = function (x: number, n: number, role: QRCodeDataBitRole): void {
    record(role, n);
    if (n >= remaining) {
      buffer.push(bits | (x >> (n -= remaining)));
      while (n >= 8) buffer.push((x >> (n -= 8)) & 255);
      bits = 0;
      remaining = 8;
    }
    if (n > 0) bits |= (x & ((1 << n) - 1)) << (remaining -= n);
  };

  let hasWrittenUTF8ECI = false;
  for (const segment of segments) {
    if (eci && segment.mode === MODE_OCTET && !hasWrittenUTF8ECI) {
      pack(MODE_ECI, 4, 'eci');
      pack(ECI_UTF8_ASSIGNMENT, 8, 'eci');
      hasWrittenUTF8ECI = true;
    }
    const definition = getModeDefinition(segment.mode);
    pack(segment.mode, 4, 'mode');
    pack(segment.data.length, definition.getCharacterCountBits(version), 'character-count');
    definition.encodePayload(segment.data, (value, bitCount) => pack(value, bitCount, 'payload'));
  }

  const encodedDataBitLength = buffer.length * 8 + (8 - remaining);
  if (encodedDataBitLength > capacity) {
    throw new QRCodeError('DATA_TOO_LARGE', 'QRCode: Data too large', {
      details: {encodedDataBitLength, capacity},
    });
  }

  // final bits. it is possible that adding terminator causes the buffer
  // to overflow, but then the buffer truncated to the maximum size will
  // be valid as the truncated terminator mode bits and padding is
  // identical in appearance (cf. JIS X 0510:2004 sec 8.4.8).
  pack(MODE_TERMINATOR, 4, 'terminator');
  if (remaining < 8) {
    record('padding', remaining);
    buffer.push(bits);
  }

  // the padding to fill up the remaining space. we should not add any
  // words when the overflow already occurred.
  while (buffer.length + 1 < maxBufferLength) {
    record('padding', 16);
    buffer.push(0xec, 0x11);
  }
  if (buffer.length < maxBufferLength) {
    record('padding', 8);
    buffer.push(0xec);
  }
  return {codewords: buffer.slice(0, maxBufferLength)};
}

function countRoles(roles: readonly QRCodeDataBitRole[]): ReadonlyMap<QRCodeDataBitRole, number> {
  const counts = new Map<QRCodeDataBitRole, number>();
  for (const role of roles) counts.set(role, (counts.get(role) ?? 0) + 1);
  return counts;
}
