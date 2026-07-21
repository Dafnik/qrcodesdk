import type {
  QRCodeCodewords,
  QRCodeEncodedData,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';
import {MODE_TERMINATOR, getModeDefinition} from './mode';

/**
 * Returns the code words (sans ECC bits) for given data and configurations.
 * Requires data to be preprocessed by `validateData`. No length check is
 * performed, and everything has to be checked before calling this function.
 *
 * @param {QRCodeVersion} version - The version number of the QR code.
 * @param {QRCodeSupportedModeIndicator} mode - The mode of encoding.
 * @param {QRCodeEncodedData} data - The data to encode.
 * @param {number} maxBufferLength - The maximum buffer length.
 * @returns {QRCodeCodewords} The code words for the given data.
 */
export function encode(
  version: QRCodeVersion,
  mode: QRCodeSupportedModeIndicator,
  data: QRCodeEncodedData,
  maxBufferLength: number,
): QRCodeCodewords {
  const definition = getModeDefinition(mode);
  const buffer: QRCodeCodewords = [];
  let bits = 0,
    remaining = 8;
  const dataLength = data.length;

  // this function is intentionally no-op when n=0.
  const pack = function (x: number, n: number) {
    if (n >= remaining) {
      buffer.push(bits | (x >> (n -= remaining)));
      while (n >= 8) buffer.push((x >> (n -= 8)) & 255);
      bits = 0;
      remaining = 8;
    }
    if (n > 0) bits |= (x & ((1 << n) - 1)) << (remaining -= n);
  };

  const dataNumberOfBits = definition.getCharacterCountBits(version);
  pack(mode, 4);
  pack(dataLength, dataNumberOfBits);
  definition.encodePayload(data, pack);

  const encodedDataBitLength = buffer.length * 8 + (8 - remaining);
  if (encodedDataBitLength > maxBufferLength * 8) throw new Error('QRCode: Data too large');

  // final bits. it is possible that adding terminator causes the buffer
  // to overflow, but then the buffer truncated to the maximum size will
  // be valid as the truncated terminator mode bits and padding is
  // identical in appearance (cf. JIS X 0510:2004 sec 8.4.8).
  pack(MODE_TERMINATOR, 4);
  if (remaining < 8) buffer.push(bits);

  // the padding to fill up the remaining space. we should not add any
  // words when the overflow already occurred.
  while (buffer.length + 1 < maxBufferLength) buffer.push(0xec, 0x11);
  if (buffer.length < maxBufferLength) buffer.push(0xec);
  return buffer.slice(0, maxBufferLength);
}
