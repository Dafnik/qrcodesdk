import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

function logSuccess(message) {
  globalThis.console.log(`  ✓ ${message}`);
}

globalThis.console.log('Testing the installed @qrcodesdk/node package');

const png = qrcode('Runtime ✅ 你好')
  .mode('octet')
  .errorCorrection('H')
  .mask(3)
  .render(QRCodePNGRenderer({size: 1, margin: 1}));

assert.equal(Buffer.isBuffer(png), true);
logSuccess('PNG renderer returns a Node.js Buffer');

assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
logSuccess('rendered output has a valid PNG signature');

assert.equal(png.readUInt32BE(16), 31);
assert.equal(png.readUInt32BE(20), 31);
logSuccess('rendered PNG has the expected 31×31 dimensions');

globalThis.console.log('@qrcodesdk/node installed-package smoke test passed');
