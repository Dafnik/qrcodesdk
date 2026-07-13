import {type QRCodeTestFixture, QR_CODE_TEST_FIXTURES, renderFixture} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {QRCodeImageRenderer, type QRCodeImageRendererOptions} from '../src';
import {decodeCanvasQRCode, getCanvasContext} from './helper';

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(), {once: true});
    image.addEventListener('error', () => reject(new Error('Expected QR code image to load')), {
      once: true,
    });
  });
}

function renderFixtureImage(
  fixture: QRCodeTestFixture,
  options: QRCodeImageRendererOptions = {size: 8, margin: 4},
): HTMLImageElement {
  return renderFixture(fixture, QRCodeImageRenderer(options));
}

async function imageToCanvas(image: HTMLImageElement): Promise<HTMLCanvasElement> {
  await waitForImage(image);

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  getCanvasContext(canvas).drawImage(image, 0, 0);

  return canvas;
}

async function decodeImageQRCode(image: HTMLImageElement): Promise<string> {
  return decodeCanvasQRCode(await imageToCanvas(image));
}

describe('QRCodeImageRenderer', () => {
  test.each(QR_CODE_TEST_FIXTURES)('decodes $name image output', async (fixture) => {
    await expect(decodeImageQRCode(renderFixtureImage(fixture))).resolves.toBe(fixture.data);
  });

  test('decodes custom high-contrast color image output', async () => {
    const image = renderFixtureImage(QR_CODE_TEST_FIXTURES[1], {
      size: 8,
      margin: 4,
      colors: {
        colorLight: '#fefefe',
        colorDark: '#101010',
      },
    });

    await expect(decodeImageQRCode(image)).resolves.toBe(QR_CODE_TEST_FIXTURES[1].data);
  });
});
