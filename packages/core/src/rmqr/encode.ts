import {createBitBuffer, encodePayload, getPayloadBitLength} from '../matrix/mode';
import type {
  QRCodeCodewords,
  QRCodeEncodedSegment,
  QRCodeSupportedModeIndicator,
} from '../matrix/types';
import {type QRCodeRMQRVersionIndex, getRMQRCharacterCountBits} from './tables';

/**
 * rMQR mode indicators are 3 bits long: 1 numeric, 2 alphanumeric, 3 byte, and 4 Kanji
 * (ISO/IEC 23941:2022 Table 2), one more than the bit position of the standard indicators.
 */
export function getRMQRModeIndicator(mode: QRCodeSupportedModeIndicator): number {
  return 32 - Math.clz32(mode);
}

/** Whether the character count fits the character count indicator of the version. */
export function fitsRMQRCharacterCount(
  version: QRCodeRMQRVersionIndex,
  {mode, payload}: QRCodeEncodedSegment,
): boolean {
  return payload.length < 2 ** getRMQRCharacterCountBits(version, mode);
}

export function getRMQRSegmentBitLength(
  version: QRCodeRMQRVersionIndex,
  {mode, payload}: QRCodeEncodedSegment,
): number {
  return 3 + getRMQRCharacterCountBits(version, mode) + getPayloadBitLength(mode, payload.length);
}

/**
 * Returns the data codewords of one segment that fits `dataCodewords`: the segment, a 3-bit
 * terminator that is truncated when the data is nearly full, zero bits up to a whole codeword,
 * and alternating pad codewords.
 */
export function encodeRMQR(
  version: QRCodeRMQRVersionIndex,
  segment: QRCodeEncodedSegment,
  dataCodewords: number,
): QRCodeCodewords {
  const [buffer, pack, bitLength] = createBitBuffer();

  pack(getRMQRModeIndicator(segment.mode), 3);
  pack(segment.payload.length, getRMQRCharacterCountBits(version, segment.mode));
  encodePayload(segment.mode, segment.payload, pack);

  pack(0, Math.min(3, dataCodewords * 8 - bitLength()));

  for (let pad = 0xec; buffer.length < dataCodewords; pad ^= 0xec ^ 0x11) buffer.push(pad);
  return buffer;
}
