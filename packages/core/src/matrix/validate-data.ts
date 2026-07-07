import type {QRCodeEncodedData, QRCodeInputData, QRCodeSupportedModeIndicator} from '../types';
import {
  ALPHANUMERIC_REGEXP,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  NUMERIC_REGEXP,
} from './const';

type TextEncoderConstructor = new () => {
  encode(input?: string): Uint8Array;
};

/**
 * Checks if the given data can be encoded in the given mode and returns
 * the converted data for further processing if possible. Otherwise, returns null.
 *
 * This function does not check the length of data; it is the duty of
 * the encode function (as it depends on the version and ECC level too).
 *
 * @param {QRCodeSupportedModeIndicator} mode - The encoding mode.
 * @param {QRCodeInputData} data - The data to be validated and converted.
 * @returns {QRCodeEncodedData | undefined} The validated and converted data, or undefined if not valid.
 */
export function validateData(
  mode: QRCodeSupportedModeIndicator,
  data: QRCodeInputData,
): QRCodeEncodedData | undefined {
  const stringData = data as string;
  switch (mode) {
    case MODE_NUMERIC:
      if (typeof data === 'number') return data.toString();
      if (!data.match(NUMERIC_REGEXP)) return undefined;
      return data;

    case MODE_ALPHANUMERIC:
      if (!stringData.match(ALPHANUMERIC_REGEXP)) return undefined;
      return stringData.toUpperCase();

    case MODE_OCTET: {
      const textEncoder = new (
        globalThis as unknown as {TextEncoder: TextEncoderConstructor}
      ).TextEncoder();
      return [...textEncoder.encode(String(data))];
    }
  }
  return undefined;
}
