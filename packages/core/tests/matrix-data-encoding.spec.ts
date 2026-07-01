import {describe, expect, test} from 'vitest';

import {
  ALPHANUMERIC_MAP,
  MODE_ALPHANUMERIC,
  MODE_KANJI,
  MODE_NUMERIC,
  MODE_OCTET,
} from '../src/matrix/const';
import {encode} from '../src/matrix/encode';
import {validateData} from '../src/matrix/validate-data';
import {bitsToBytes} from './helpers';

describe('data validation and encoding', () => {
  test('validates numeric, alphanumeric, and octet data', () => {
    expect(validateData(MODE_NUMERIC, 12345)).toBe('12345');
    expect(validateData(MODE_NUMERIC, '00123')).toBe('00123');
    expect(validateData(MODE_NUMERIC, '12A')).toBeUndefined();

    expect(validateData(MODE_ALPHANUMERIC, 'HELLO WORLD:')).toBe('HELLO WORLD:');
    expect(validateData(MODE_ALPHANUMERIC, 'hello')).toBeUndefined();

    expect(validateData(MODE_OCTET, 'Aé')).toEqual(Array.from(new TextEncoder().encode('Aé')));
    expect(validateData(MODE_KANJI, '漢')).toBeUndefined();
  });

  test('encodes numeric mode with terminator and pad bytes', () => {
    const expectedBits = ['0001', '0000000001', '0001', '0000'].join('');

    expect(encode(1, MODE_NUMERIC, '1', 6)).toEqual(bitsToBytes(expectedBits, 6));
  });

  test('encodes alphanumeric pairs and odd trailing characters', () => {
    const pairValue = ALPHANUMERIC_MAP.A * 45 + ALPHANUMERIC_MAP.B;
    const expectedBits = [
      '0010',
      '000000011',
      pairValue.toString(2).padStart(11, '0'),
      ALPHANUMERIC_MAP.C.toString(2).padStart(6, '0'),
      '0000',
    ].join('');

    expect(encode(1, MODE_ALPHANUMERIC, 'ABC', 7)).toEqual(bitsToBytes(expectedBits, 7));
  });

  test('encodes octet data bytes directly', () => {
    const expectedBits = ['0100', '00000010', '01000001', '11111111', '0000'].join('');

    expect(encode(1, MODE_OCTET, [0x41, 0xff], 7)).toEqual(bitsToBytes(expectedBits, 7));
  });
});
