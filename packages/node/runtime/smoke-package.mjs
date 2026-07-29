import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

const png = qrcode('Runtime ✅ 你好')
  .mode('octet')
  .errorCorrection('H')
  .mask(3)
  .render(QRCodePNGRenderer({size: 1, margin: 1}));

assert.equal(Buffer.isBuffer(png), true);
assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.equal(png.readUInt32BE(16), 31);
assert.equal(png.readUInt32BE(20), 31);
