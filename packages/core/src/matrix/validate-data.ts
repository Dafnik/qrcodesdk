import {
  ALPHANUMERIC_REGEXP,
  MODE_ALPHANUMERIC,
  MODE_NUMERIC,
  MODE_OCTET,
  NUMERIC_REGEXP,
} from './const';

/**
 * Checks if the given data can be encoded in the given mode and returns
 * the converted data for further processing if possible. Otherwise, returns null.
 *
 * This function does not check the length of data; it is the duty of
 * the encode function (as it depends on the version and ECC level too).
 *
 * @param {number} mode - The encoding mode (numeric, alphanumeric, octet).
 * @param {string | number} data - The data to be validated and converted.
 * @returns {string | number[] | undefined} The validated and converted data, or undefined if not valid.
 */
export function validateData(mode: number, data: string | number): string | number[] | undefined {
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
      return [...new TextEncoder().encode(String(data))];
    }
  }
  return undefined;
}
