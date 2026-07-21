import type {
  QRCodeErrorCorrectionLevelValue,
  QRCodeSupportedModeIndicator,
  QRCodeVersion,
} from '../types';
import {getNumberOfAvailableBitsForData} from './get-number-of-available-bits-for-data';
import {getModeDefinition} from './mode';

/**
 * Returns the maximum length of data possible in a given configuration.
 *
 * @param {number} ver - The version number of the QR code.
 * @param {number} mode - The encoding mode (numeric, alphanumeric, octet, kanji).
 * @param {number} eccLevel - The error correction level.
 * @returns {number} The maximum length of data possible.
 */
export function getMaxDataLength(
  ver: QRCodeVersion,
  mode: QRCodeSupportedModeIndicator,
  eccLevel: QRCodeErrorCorrectionLevelValue,
): number {
  const definition = getModeDefinition(mode);
  const numberOfBits =
    getNumberOfAvailableBitsForData(ver, eccLevel) - 4 - definition.getCharacterCountBits(ver); // 4 for mode bits
  return definition.getMaxDataLength(numberOfBits);
}
