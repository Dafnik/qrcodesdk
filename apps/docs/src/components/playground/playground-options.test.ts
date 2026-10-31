import assert from 'node:assert/strict';
import {afterEach, describe, test} from 'node:test';

import {type QRCodeDataImageURL, QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import {
  type PlaygroundPreparedImage,
  clearPlaygroundImage,
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  defaultPlaygroundOptions,
  playgroundCenterImageLayout,
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

  test('creates center image factories from the embedded URL and the loaded element', () => {
    const svgOptions = createPlaygroundSVGOptions(defaultPlaygroundOptions, preparedImage);
    const imageOptions = createPlaygroundImageOptions(defaultPlaygroundOptions, preparedImage);
    const canvasOptions = createPlaygroundCanvasOptions(defaultPlaygroundOptions, preparedImage);

    assert.deepEqual(playgroundCenterImageLayout(preparedImage), {
      size: 0.3,
      padding: 0.5,
      clearBackground: false,
    });
    assert.equal(typeof svgOptions.centerImage?.part, 'function');
    assert.equal(typeof imageOptions.centerImage?.draw, 'function');
    assert.equal(typeof canvasOptions.centerImage?.draw, 'function');
    assert.equal(svgOptions.matrix?.eci, false);
    assert.equal(imageOptions.matrix?.eci, false);
    assert.equal(canvasOptions.matrix?.eci, false);

    const {matrix, ...rendererOptions} = svgOptions;
    const builder = qrcode(defaultPlaygroundOptions.payload).options(matrix);
    const width = builder.matrix().size * 0.3;
    const svg = builder.render(QRCodeSVGRenderer(rendererOptions));
    assert.match(svg, new RegExp(`<image href="${preparedImage.dataUrl}"[^>]* width="${width}"`));
  });

  test('draws the loaded image element on Canvas and Image output', () => {
    const {centerImage} = createPlaygroundCanvasOptions(defaultPlaygroundOptions, preparedImage);
    const drawn: unknown[][] = [];
    const context = {
      drawImage: (...args: unknown[]) => drawn.push(args),
    } as unknown as CanvasRenderingContext2D;

    centerImage?.draw(context, {moduleCount: 21, quietZone: 4} as never);

    assert.equal(drawn.length, 1);
    assert.equal(drawn[0]?.[0], preparedImage.element);
  });

  test('reports an invalid center image layout as a QR code error', () => {
    const invalid = {...preparedImage, size: 2};

    assert.throws(() => createPlaygroundSVGOptions(defaultPlaygroundOptions, invalid));
    assert.match(String(hasQRCodeError(defaultPlaygroundOptions, invalid)), /centerImage\.size/);
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
