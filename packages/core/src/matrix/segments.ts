import type {QRCodePayload, QRCodeVersion} from '../types';
import {
  ECI_UTF8_BIT_LENGTH,
  MODE_OCTET,
  getCharacterCountBits,
  getPayloadBitLength,
  validatePayload,
} from './mode';
import type {QRCodeEncodedSegment, QRCodeSupportedModeIndicator} from './types';

export function createSingleSegment(
  mode: QRCodeSupportedModeIndicator,
  payload: QRCodePayload,
): QRCodeEncodedSegment | undefined {
  const encoded = validatePayload(mode, payload);
  return encoded === undefined ? undefined : {mode, payload: encoded};
}

export function getSegmentsBitLength(
  version: QRCodeVersion,
  segments: readonly QRCodeEncodedSegment[],
  eci: boolean,
): number {
  let bitLength = eci && segments.some(({mode}) => mode === MODE_OCTET) ? ECI_UTF8_BIT_LENGTH : 0;
  for (const {mode, payload} of segments) {
    bitLength +=
      4 + getCharacterCountBits(mode, version) + getPayloadBitLength(mode, payload.length);
  }
  return bitLength;
}
