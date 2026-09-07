import assert from 'node:assert/strict';
import {afterEach, describe, test} from 'node:test';

import type {QRCodeDataImageURL} from '@qrcodesdk/core';

import {
  type PlaygroundPreparedImage,
  clearPlaygroundImage,
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  playgroundImageStatus,
  playgroundOptions,
  playgroundPreparedImage,
  preparePlaygroundImage,
  preparePlaygroundLogo,
  resetQrOptions,
  updatePlaygroundImage,
  updateQrOptions,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

const preparedImage: PlaygroundPreparedImage = {
  dataUrl: 'data:image/png;base64,cHJlcGFyZWQ=' as QRCodeDataImageURL,
  element: {width: 4, height: 2} as HTMLImageElement,
  fileName: 'logo.png',
  size: 0.3,
  padding: 0.5,
  clearBackground: false,
};

describe('playground prepared image options', () => {
  afterEach(() => {
    clearPlaygroundImage();
  });

  test('maps the embedded URL to SVG and the loaded element to browser renderers', () => {
    const svgOptions = createPlaygroundSVGOptions(defaultPlaygroundOptions, preparedImage);
    const imageOptions = createPlaygroundImageOptions(defaultPlaygroundOptions, preparedImage);
    const canvasOptions = createPlaygroundCanvasOptions(defaultPlaygroundOptions, preparedImage);

    assert.equal(svgOptions.centerImage?.source, preparedImage.dataUrl);
    assert.equal(imageOptions.centerImage?.source, preparedImage.element);
    assert.equal(canvasOptions.centerImage?.source, preparedImage.element);
    assert.equal(svgOptions.matrix?.eci, false);
    assert.equal(imageOptions.matrix?.eci, false);
    assert.equal(canvasOptions.matrix?.eci, false);
    assert.deepEqual(svgOptions.centerImage, {
      source: preparedImage.dataUrl,
      size: 0.3,
      padding: 0.5,
      clearBackground: false,
    });
  });

  test('forwards enabled ECI through every renderer and error-checking path', () => {
    const options = {...defaultPlaygroundOptions, eci: true};

    assert.equal(createPlaygroundSVGOptions(options, preparedImage).matrix?.eci, true);
    assert.equal(createPlaygroundImageOptions(options, preparedImage).matrix?.eci, true);
    assert.equal(createPlaygroundCanvasOptions(options, preparedImage).matrix?.eci, true);
    assert.equal(hasQRCodeError(options, undefined), undefined);
    assert.match(
      String(hasQRCodeError({...options, eci: 'true' as never}, undefined)),
      /Invalid ECI setting/,
    );
  });

  test('updates options without replacing prepared sources', () => {
    playgroundPreparedImage.set(preparedImage);

    updatePlaygroundImage({size: 0.6, padding: 2, clearBackground: true});

    assert.deepEqual(playgroundPreparedImage.get(), {
      ...preparedImage,
      size: 0.6,
      padding: 2,
      clearBackground: true,
    });
  });

  test('reset removes session-only image and status state', () => {
    playgroundPreparedImage.set(preparedImage);
    playgroundImageStatus.set({state: 'ready'});
    updateQrOptions({eci: true});

    resetQrOptions();

    assert.equal(playgroundPreparedImage.get(), undefined);
    assert.deepEqual(playgroundImageStatus.get(), {state: 'idle'});
    assert.equal(playgroundOptions.get().eci, false);
  });

  test('reports image preparation failures and removes a previous image', async () => {
    playgroundPreparedImage.set(preparedImage);

    await preparePlaygroundImage(new File(['not an image'], 'notes.txt', {type: 'text/plain'}));

    assert.equal(playgroundPreparedImage.get(), undefined);
    assert.deepEqual(playgroundImageStatus.get(), {
      state: 'error',
      message: 'Choose an image file.',
    });
  });

  test('reports a stable error when the bundled logo cannot be loaded', async () => {
    playgroundPreparedImage.set(preparedImage);

    await preparePlaygroundLogo(async () => new Response(null, {status: 404}));

    assert.equal(playgroundPreparedImage.get(), undefined);
    assert.deepEqual(playgroundImageStatus.get(), {
      state: 'error',
      message: 'The QRCodeSDK logo could not be loaded.',
    });
  });
});
