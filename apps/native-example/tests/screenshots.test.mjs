import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import sharp from 'sharp';

import {qrcode} from '@qrcodesdk/core';
import {QRCodePNGRenderer, rasterCenterImage} from '@qrcodesdk/node';

import {createFlow, fixtures, screenshotCases} from '../scripts/fixtures.mjs';
import {verifyScreenshot, verifyScreenshots} from '../scripts/verify-screenshots.mjs';

test('decodes a QR code inside a screenshot and rejects stale or missing rendering', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-native-'));
  context.after(() => rm(directory, {recursive: true, force: true}));
  const payload = fixtures[0].payload;
  const qr = qrcode(payload).render(QRCodePNGRenderer({style: {moduleSize: 5}}));
  const screenshot = path.join(directory, 'screen.png');
  await sharp({create: {width: 400, height: 800, channels: 4, background: '#ffffff'}})
    .composite([{input: qr, top: 200, left: 80}])
    .png()
    .toFile(screenshot);
  await verifyScreenshot(screenshot, payload);
  await assert.rejects(verifyScreenshot(screenshot, payload, {logo: true}), /logo is missing/);
  await assert.rejects(verifyScreenshot(screenshot, payload + '?updated=1'), /Wrong QR payload/);
  const blank = path.join(directory, 'blank.png');
  await sharp({create: {width: 400, height: 800, channels: 4, background: '#ffffff'}})
    .png()
    .toFile(blank);
  await assert.rejects(verifyScreenshot(blank, payload), /Unable to decode/);
});

test('the branded screenshot must contain a readable code and the QRCodeSDK logo', async () => {
  const logo = await readFile(new URL('../assets/qrcodesdk-logo.png', import.meta.url));
  const payload = fixtures.find((fixture) => fixture.id === 'center').payload;
  const png = qrcode(payload)
    .errorCorrection('H')
    .render(
      QRCodePNGRenderer({
        style: {moduleSize: 5},
        centerImage: rasterCenterImage(logo, {size: 0.25}),
      }),
    );
  await verifyScreenshot(png, payload, {logo: true});
});

test('finds the expected payload when the image contains another QR code', async () => {
  const expected = fixtures[0].payload;
  const other = 'https://qrcodesdk.dev';
  const first = qrcode(expected).render(QRCodePNGRenderer({style: {moduleSize: 5}}));
  const second = qrcode(other).render(QRCodePNGRenderer({style: {moduleSize: 3}}));
  const screenshot = await sharp({
    create: {width: 600, height: 800, channels: 4, background: '#ffffff'},
  })
    .composite([
      {input: first, top: 250, left: 80},
      {input: second, top: 80, left: 350},
    ])
    .png()
    .toBuffer();
  await verifyScreenshot(screenshot, expected);
  await verifyScreenshot(screenshot, other);
});

test('requires every screenshot and refuses ambiguous artifacts', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'qrcodesdk-native-'));
  context.after(() => rm(directory, {recursive: true, force: true}));
  const cases = [{screenshot: 'svg', payload: fixtures[0].payload}];
  await assert.rejects(verifyScreenshots(directory, cases), /found 0/);
  await mkdir(path.join(directory, 'nested'));
  await writeFile(
    path.join(directory, 'svg.png'),
    qrcode(cases[0].payload).render(QRCodePNGRenderer()),
  );
  await verifyScreenshots(directory, cases);
  await writeFile(path.join(directory, 'nested/svg.png'), new Uint8Array());
  await assert.rejects(verifyScreenshots(directory, cases), /found 2/);
});

test('the flow captures every fixture and an updated payload', () => {
  const flow = createFlow();
  assert.deepEqual(
    [...flow.matchAll(/^- takeScreenshot: (.+)$/gm)].map((match) => match[1]),
    screenshotCases.map((fixture) => fixture.screenshot),
  );
  assert.equal(new Set(fixtures.map((fixture) => fixture.id)).size, fixtures.length);
  assert.match(flow, /clearState: true/);
  assert.match(flow, /tapOn: \{id: update-payload\}/);
});
