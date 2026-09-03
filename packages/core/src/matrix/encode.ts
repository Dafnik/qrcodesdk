import {QRCodeError} from '../error';
import type {QRCodeCodewords, QRCodeEncodedSegment, QRCodeVersion} from '../types';
import {
  ECI_UTF8_ASSIGNMENT,
  MODE_ECI,
  MODE_OCTET,
  MODE_TERMINATOR,
  getModeDefinition,
} from './mode';

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
  const buffer: QRCodeCodewords = [];
  const capacity = maxBufferLength * 8;
  let bits = 0,
    remaining = 8;

  // this function is intentionally no-op when n=0.
  const pack = function (x: number, n: number): void {
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
      pack(MODE_ECI, 4);
      pack(ECI_UTF8_ASSIGNMENT, 8);
      hasWrittenUTF8ECI = true;
    }
    const definition = getModeDefinition(segment.mode);
    pack(segment.mode, 4);
    pack(segment.data.length, definition.getCharacterCountBits(version));
    definition.encodePayload(segment.data, pack);
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
  pack(MODE_TERMINATOR, 4);
  if (remaining < 8) {
    buffer.push(bits);
  }

  // the padding to fill up the remaining space. we should not add any
  // words when the overflow already occurred.
  while (buffer.length + 1 < maxBufferLength) {
    buffer.push(0xec, 0x11);
  }
  if (buffer.length < maxBufferLength) {
    buffer.push(0xec);
  }
  return buffer.slice(0, maxBufferLength);
}
