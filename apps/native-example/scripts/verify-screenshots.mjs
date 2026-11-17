import '@repo/core-testing/decoder/node';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {readBarcodes} from 'zxing-wasm/reader';

import {screenshotCases} from './fixtures.mjs';

/** Decode the actual native screenshot, including the app chrome and platform status bar. */
export async function verifyScreenshot(file, expectedPayload, {logo = false} = {}) {
  const {data, info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  // The logo contains its own QR code. Scan multiple symbols so its payload cannot hide
  // the surrounding code, then require the exact expected payload to be among them.
  const scans = (
    await readBarcodes(
      {
        data: new Uint8ClampedArray(data),
        width: info.width,
        height: info.height,
        colorSpace: 'srgb',
      },
      {
        formats: ['QRCodeModel2'],
        tryHarder: true,
        tryInvert: false,
        maxNumberOfSymbols: 16,
        textMode: 'Plain',
      },
    )
  ).filter((scan) => scan.isValid);
  assert.ok(scans.length, `Unable to decode a QR code in ${file}`);
  const result = scans.find((scan) => scan.text === expectedPayload);
  assert.ok(
    result,
    `Wrong QR payload in ${file}: expected ${expectedPayload}, decoded ${scans.map((scan) => scan.text).join(', ')}`,
  );
  if (logo) {
    // The logo is the only yellow area in this example. Check it loaded even when the
    // surrounding QR code would remain readable without the image.
    let yellowPixels = 0;
    for (let offset = 0; offset < data.length; offset += 4) {
      if (
        data[offset] > 220 &&
        data[offset + 1] > 180 &&
        data[offset + 1] < 245 &&
        data[offset + 2] < 100
      )
        yellowPixels++;
    }
    assert.ok(yellowPixels > 300, `QRCodeSDK logo is missing from ${file}`);
  }
  const {text, format, version, ecLevel, isMirrored} = result;
  return {text, format, version, ecLevel, isMirrored};
}

export async function verifyScreenshots(directory, cases = screenshotCases) {
  const files = await readdir(directory, {recursive: true});
  const results = [];
  for (const fixture of cases) {
    const matches = files.filter((file) => path.basename(file) === `${fixture.screenshot}.png`);
    assert.equal(
      matches.length,
      1,
      `Expected exactly one screenshot for ${fixture.screenshot}, found ${matches.length}`,
    );
    const result = await verifyScreenshot(
      path.join(directory, matches[0]),
      fixture.payload,
      fixture,
    );
    results.push({screenshot: matches[0], ...result});
  }
  return results;
}
