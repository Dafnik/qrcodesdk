import {QRCodeError} from '../error';
import type {QRCodeVersion} from '../types';
import {
  ECI_UTF8_ASSIGNMENT,
  MODE_ECI,
  MODE_OCTET,
  createBitBuffer,
  encodePayload,
  getCharacterCountBits,
} from './mode';
import type {QRCodeCodewords, QRCodeEncodedSegment} from './types';

/**
 * Returns the code words (sans ECC bits) for given payload segments and options.
 * Requires the payload to be preprocessed by `validatePayload`. No length check is
 * performed, and everything has to be checked before calling this function.
 *
 * @param {QRCodeVersion} version - The version number of the QR code.
 * @param {readonly QRCodeEncodedSegment[]} segments - The payload segments to encode.
 * @param {number} maxBufferLength - The maximum buffer length.
 * @returns {QRCodeCodewords} The code words for the given payload segments.
 */
export function encode(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
  maxBufferLength: number,
  eci: boolean,
): QRCodeCodewords {
  const [buffer, pack, bitLength] = createBitBuffer();
  const capacity = maxBufferLength * 8;

  let hasWrittenUTF8ECI = false;
  for (const segment of segments) {
    if (eci && segment.mode === MODE_OCTET && !hasWrittenUTF8ECI) {
      pack(MODE_ECI, 4);
      pack(ECI_UTF8_ASSIGNMENT, 8);
      hasWrittenUTF8ECI = true;
    }
    pack(segment.mode, 4);
    pack(segment.payload.length, getCharacterCountBits(segment.mode, version));
    encodePayload(segment.mode, segment.payload, pack);
  }

  const encodedDataBitLength = bitLength();
  if (encodedDataBitLength > capacity) {
    throw new QRCodeError('PAYLOAD_TOO_LARGE', 'QRCode: Payload too large', {
      details: {encodedDataBitLength, capacity},
    });
  }

  // final bits. it is possible that adding terminator causes the buffer
  // to overflow, but then the buffer truncated to the maximum size will
  // be valid as the truncated terminator mode bits and padding is
  // identical in appearance (cf. JIS X 0510:2004 sec 8.4.8).
  pack(0, 4);

  // the padding to fill up the remaining space. we should not add any
  // words when the overflow already occurred.
  for (let pad = 0xec; buffer.length < maxBufferLength; pad ^= 0xec ^ 0x11) buffer.push(pad);
  return buffer.slice(0, maxBufferLength);
}
