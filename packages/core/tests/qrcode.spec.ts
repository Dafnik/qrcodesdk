import {describe, expect, test} from 'vitest';

import {buildQRCodeMatrix} from '../src/matrix';
import {qrcode} from '../src/qrcode-builder';
import {SVGQRCodeRenderer} from '../src/svg';

export const s_stripWhitespace = (text: string): string => text.trim().replace(/\s/g, '') ?? '';

describe('QRCode', () => {
  test('generate correct Numeric qrcode svg', () => {
    const test = qrcode('123456798').mode('numeric').renderer(SVGQRCodeRenderer()).render();
    expect(s_stripWhitespace(test)).toEqual(
      s_stripWhitespace(`<svg xmlns="http://www.w3.org/2000/svg"
    width="145" height="145"   >
    <rect width="145" height="145" fill="#ffffff" />
    <rect x="20" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="25" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="20" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="25" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="30" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="35" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="40" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="45" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="45" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="45" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="45" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="45" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="45" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="25" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="50" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="55" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="55" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="55" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="55" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="25" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="85" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="60" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="65" width="5.3" height="5.3" fill="#000000" />
    <rect x="25" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="70" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="55" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="75" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="80" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="85" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="85" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="25" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="85" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="90" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="85" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="95" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="70" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="75" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="85" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="95" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="100" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="105" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="110" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="65" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="80" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="100" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="115" width="5.3" height="5.3" fill="#000000" />
    <rect x="20" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="25" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="30" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="35" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="40" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="45" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="50" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="60" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="90" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="105" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="110" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="115" y="120" width="5.3" height="5.3" fill="#000000" />
    <rect x="120" y="120" width="5.3" height="5.3" fill="#000000" />
    </svg>`),
    );
  });
  test('generate correct Numeric qrcode matrix', () => {
    expect(qrcode('123456789').mode('numeric').matrix()).toStrictEqual([
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
      [0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1],
    ]);
  });
  test('generate correct alpha numeric qrcode matrix', () => {
    expect(qrcode('AT123456798').mode('alphanumeric')).toStrictEqual([
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1],
    ]);
  });
  test('generate correct byte qrcode matrix', () => {
    expect(buildQRCodeMatrix('AT123456798!!ww:', {mode: 'octet', mask: 1})).toStrictEqual([
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    ]);
  });
  test('generate correct auto detected Numeric qrcode matrix', () => {
    expect(buildQRCodeMatrix('123456798', {mask: 1})).toStrictEqual([
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
      [0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1],
    ]);
  });
  test('generate correct auto detected alpha numeric qrcode matrix', () => {
    expect(buildQRCodeMatrix('AT123456798', {mask: 1})).toStrictEqual([
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1],
    ]);
  });
  test('generate correct auto detected byte qrcode matrix', () => {
    expect(buildQRCodeMatrix('AT123456798!!ww:', {mask: 1})).toStrictEqual([
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1],
      [0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    ]);
  });

  test('auto selects mask when omitted', () => {
    expect(buildQRCodeMatrix('123456798')).toHaveLength(21);
  });

  test('accepts mask values from 0 through 7', () => {
    for (const mask of [0, 1, 2, 3, 4, 5, 6, 7] as const) {
      expect(buildQRCodeMatrix('123456798', {mask})).toHaveLength(21);
    }
  });

  test('rejects invalid mask values from plain JavaScript callers', () => {
    expect(() => buildQRCodeMatrix('123456798', {mask: -1} as never)).toThrow(
      'QRCode: Invalid mask',
    );
    expect(() => buildQRCodeMatrix('123456798', {mask: 8} as never)).toThrow(
      'QRCode: Invalid mask',
    );
  });

  test('auto selects version when omitted', () => {
    expect(buildQRCodeMatrix('123456798', {mask: 1})).toHaveLength(21);
  });

  test('accepts version values from 1 through 40', () => {
    expect(buildQRCodeMatrix('123456798', {version: 1, mask: 1})).toHaveLength(21);
    expect(buildQRCodeMatrix('123456798', {version: 40, mask: 1})).toHaveLength(177);
  });

  test('rejects invalid version values from plain JavaScript callers', () => {
    expect(() => buildQRCodeMatrix('123456798', {version: -1} as never)).toThrow(
      'QRCode: Invalid version',
    );
    expect(() => buildQRCodeMatrix('123456798', {version: 0} as never)).toThrow(
      'QRCode: Invalid version',
    );
  });
});
