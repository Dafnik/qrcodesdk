import type {QRCodeVersion} from '../types';

/**
 * Checks if the QR code needs the version embedded.
 *
 * @param {number} version - The version number of the QR code.
 * @returns {boolean} True when the version information has to be embedded.
 */
export function needsVersionInfo(version: QRCodeVersion): boolean {
  return version > 6;
}
