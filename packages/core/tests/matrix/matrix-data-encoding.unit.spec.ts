import {describe, expect, test} from 'vitest';

import {encode} from '../../src/matrix/encode';
import {MODE_ALPHANUMERIC, MODE_NUMERIC, MODE_OCTET, validateData} from '../../src/matrix/mode';
import {bitsToBytes} from './helpers';

describe('data validation and encoding', () => {
  test('validates numeric, alphanumeric, and octet data', () => {
    expect(validateData(MODE_NUMERIC, 12345)).toBe('12345');
    expect(validateData(MODE_NUMERIC, 0)).toBe('0');
    expect(validateData(MODE_NUMERIC, Number.MAX_SAFE_INTEGER)).toBe(
      String(Number.MAX_SAFE_INTEGER),
    );
    expect(validateData(MODE_NUMERIC, '00123')).toBe('00123');
    expect(validateData(MODE_NUMERIC, '12A')).toBeUndefined();
    for (const invalidNumber of [
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(validateData(MODE_NUMERIC, invalidNumber)).toBeUndefined();
      expect(validateData(MODE_OCTET, invalidNumber)).toBeUndefined();
    }

    expect(validateData(MODE_ALPHANUMERIC, 'HELLO WORLD:')).toBe('HELLO WORLD:');
    expect(validateData(MODE_ALPHANUMERIC, 'hello')).toBeUndefined();

    expect(validateData(MODE_OCTET, 'Aé')).toEqual([0x41, 0xc3, 0xa9]);
  });

  test('encodes numeric mode with terminator and pad bytes', () => {
    const expectedBits = ['0001', '0000000001', '0001', '0000'].join('');

    expect(encode(1, MODE_NUMERIC, '1', 6)).toEqual(bitsToBytes(expectedBits, 6));
  });

  test('encodes alphanumeric pairs and odd trailing characters', () => {
    const expectedBits = ['0010', '000000011', '00111001101', '001100', '0000'].join('');

    expect(encode(1, MODE_ALPHANUMERIC, 'ABC', 7)).toEqual(bitsToBytes(expectedBits, 7));
  });

  test('encodes octet data bytes directly', () => {
    const expectedBits = ['0100', '00000010', '01000001', '11111111', '0000'].join('');

    expect(encode(1, MODE_OCTET, [0x41, 0xff], 7)).toEqual(bitsToBytes(expectedBits, 7));
  });

  test('fits maximum-capacity payloads into the available data codewords', () => {
    expect(encode(40, MODE_NUMERIC, '1'.repeat(7_089), 2_956)).toHaveLength(2_956);
    expect(encode(40, MODE_ALPHANUMERIC, 'A'.repeat(4_296), 2_956)).toHaveLength(2_956);
    expect(encode(40, MODE_OCTET, Array(2_953).fill(0x41), 2_956)).toHaveLength(2_956);
  });

  test('rejects payload bits that exceed the data codeword buffer', () => {
    expect(() => encode(1, MODE_NUMERIC, '1'.repeat(35), 16)).toThrow('QRCode: Data too large');
  });
});
