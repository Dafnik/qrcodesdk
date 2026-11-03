import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';

import {qrcode} from '@qrcodesdk/core';
import {
  QRCodeGIFRenderer,
  QRCodeJPEGRenderer,
  QRCodePNGRenderer,
  QRCodeWebPRenderer,
} from '@qrcodesdk/node';

function logSuccess(message) {
  globalThis.console.log(`  ✓ ${message}`);
}

globalThis.console.log('Testing the installed @qrcodesdk/node package');

const png = qrcode('Runtime ✅ 你好')
  .mode('octet')
  .errorCorrection('H')
  .mask(3)
  .render(QRCodePNGRenderer({style: {moduleSize: 1, quietZone: 1}}));

assert.equal(Buffer.isBuffer(png), true);
logSuccess('PNG renderer returns a Node.js Buffer');

assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
logSuccess('rendered output has a valid PNG signature');

assert.equal(png.readUInt32BE(16), 31);
assert.equal(png.readUInt32BE(20), 31);
logSuccess('rendered PNG has the expected 31×31 dimensions');

const builder = qrcode('Runtime ✅ 你好').mode('octet').errorCorrection('H').mask(3);

const webp = builder.render(QRCodeWebPRenderer({style: {moduleSize: 1, quietZone: 1}}));
assert.equal(Buffer.isBuffer(webp), true);
assert.equal(webp.toString('latin1', 0, 4), 'RIFF');
assert.equal(webp.toString('latin1', 8, 16), 'WEBPVP8L');
logSuccess('WebP renderer returns lossless WebP bytes');

const gif = builder.render(QRCodeGIFRenderer({style: {moduleSize: 1, quietZone: 1}}));
assert.equal(Buffer.isBuffer(gif), true);
assert.equal(gif.toString('latin1', 0, 6), 'GIF89a');
assert.equal(gif.readUInt16LE(6), 31);
assert.equal(gif.readUInt16LE(8), 31);
logSuccess('GIF renderer returns 31×31 GIF bytes');

const jpeg = builder.render(QRCodeJPEGRenderer({style: {moduleSize: 1, quietZone: 1}}));
assert.equal(Buffer.isBuffer(jpeg), true);
assert.deepEqual([...jpeg.subarray(0, 2)], [0xff, 0xd8]);
assert.equal(jpeg.toString('latin1', 6, 11), 'JFIF\0');
const jpegFrame = jpeg.indexOf(Buffer.from([0xff, 0xc0]));
assert.equal(jpeg.readUInt16BE(jpegFrame + 5), 31);
assert.equal(jpeg.readUInt16BE(jpegFrame + 7), 31);
logSuccess('JPEG renderer returns 31×31 JPEG bytes');

globalThis.console.log('@qrcodesdk/node installed-package smoke test passed');
