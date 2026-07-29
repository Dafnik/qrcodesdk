import assert from 'node:assert/strict';
import {afterEach, describe, test} from 'node:test';

import type {QRCodeDataImageURL} from '@qrcodesdk/core';

import {
  type PlaygroundPreparedImage,
  clearPlaygroundImage,
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  defaultPlaygroundConfig,
  playgroundImageStatus,
  playgroundPreparedImage,
  preparePlaygroundImage,
  resetQrConfig,
  updatePlaygroundImage,
} from './playground-config.ts';

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
    const svgOptions = createPlaygroundSVGOptions(defaultPlaygroundConfig, preparedImage);
    const imageOptions = createPlaygroundImageOptions(defaultPlaygroundConfig, preparedImage);
    const canvasOptions = createPlaygroundCanvasOptions(defaultPlaygroundConfig, preparedImage);

    assert.equal(svgOptions.image?.source, preparedImage.dataUrl);
    assert.equal(imageOptions.image?.source, preparedImage.element);
    assert.equal(canvasOptions.image?.source, preparedImage.element);
    assert.deepEqual(svgOptions.image, {
      source: preparedImage.dataUrl,
      size: 0.3,
      padding: 0.5,
      clearBackground: false,
    });
  });

  test('updates settings without replacing prepared sources', () => {
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

    resetQrConfig();

    assert.equal(playgroundPreparedImage.get(), undefined);
    assert.deepEqual(playgroundImageStatus.get(), {state: 'idle'});
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
});
