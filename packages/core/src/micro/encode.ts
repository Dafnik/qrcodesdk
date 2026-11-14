import {MODE_NUMERIC, encodePayload, getPayloadBitLength} from '../matrix/mode';
import type {
  QRCodeCodewords,
  QRCodeEncodedSegment,
  QRCodeSupportedModeIndicator,
} from '../matrix/types';
import type {QRCodeMicroVersionNumber} from './tables';

/**
 * Micro QR mode indicators are `version - 1` bits long. Their values are 0 numeric, 1 alphanumeric,
 * and 2 byte, which is the standard indicator shifted right by one.
 */
export function getMicroModeIndicator(mode: QRCodeSupportedModeIndicator): number {
  return mode >> 1;
}

/** Numeric, alphanumeric, and byte modes start at M1, M2, and M3. */
export function supportsMicroMode(
  version: QRCodeMicroVersionNumber,
  mode: QRCodeSupportedModeIndicator,
): boolean {
  return getMicroModeIndicator(mode) < version;
}

/** Character count indicator widths (ISO/IEC 18004:2015 Table 3). */
export function getMicroCharacterCountBits(
  version: QRCodeMicroVersionNumber,
  mode: QRCodeSupportedModeIndicator,
): number {
  // numeric: 3/4/5/6, alphanumeric: -/3/4/5, byte: -/-/4/5
  return version + 2 - +(mode !== MODE_NUMERIC);
}

export function getMicroSegmentBitLength(
  version: QRCodeMicroVersionNumber,
  {mode, payload}: QRCodeEncodedSegment,
): number {
  return (
    version -
    1 +
    getMicroCharacterCountBits(version, mode) +
    getPayloadBitLength(mode, payload.length)
  );
}

/**
 * Returns the data codewords of one segment that fits `dataBits`. In M1 and M3 the last codeword
 * holds 4 data bits in its high nibble, and its low nibble stays zero for error correction.
 */
export function encodeMicro(
  version: QRCodeMicroVersionNumber,
  segment: QRCodeEncodedSegment,
  dataBits: number,
): QRCodeCodewords {
  const buffer: QRCodeCodewords = [];
  let bits = 0,
    remaining = 8;

  // No-op when n=0.
  const pack = function (x: number, n: number): void {
    if (n >= remaining) {
      buffer.push(bits | (x >> (n -= remaining)));
      while (n >= 8) buffer.push((x >> (n -= 8)) & 255);
      bits = 0;
      remaining = 8;
    }
    if (n > 0) bits |= (x & ((1 << n) - 1)) << (remaining -= n);
  };

  pack(getMicroModeIndicator(segment.mode), version - 1);
  pack(segment.payload.length, getMicroCharacterCountBits(version, segment.mode));
  encodePayload(segment.mode, segment.payload, pack);

  // The terminator is 3, 5, 7, or 9 zero bits, truncated when the data is nearly full.
  pack(0, Math.min(version * 2 + 1, dataBits - buffer.length * 8 - 8 + remaining));
  if (remaining < 8) buffer.push(bits);

  // Pad codewords fill the full codewords, and a final 4-bit codeword stays zero.
  for (let pad = 0xec; buffer.length < dataBits >> 3; pad ^= 0xec ^ 0x11) buffer.push(pad);
  if (buffer.length * 8 < dataBits) buffer.push(0);
  return buffer;
}
