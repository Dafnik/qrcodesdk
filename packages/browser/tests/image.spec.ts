import {type QRCodeTestFixture, QR_CODE_TEST_FIXTURES, renderFixture} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {ImageQRCodeRenderer, type QRCodeImageRendererOptions} from '../src';
import {BLACK, WHITE, decodeCanvasQRCode, expectPixel, getCanvasContext} from './helper';

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
  return renderFixture(fixture, ImageQRCodeRenderer(options));
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

describe('ImageQRCodeRenderer', () => {
  test('renders a PNG data URL image with real rasterized pixels', async () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const image = ImageQRCodeRenderer({
      alt: 'QR alt',
      ariaLabel: 'QR aria',
      title: 'QR title',
    })(matrix);

    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(image.src).toMatch(/^data:image\/png;base64,/);
    expect(image.width).toBe(50);
    expect(image.height).toBe(50);
    expect(image.alt).toBe('QR alt');
    expect(image.getAttribute('aria-label')).toBe('QR aria');
    expect(image.title).toBe('QR title');

    const canvas = await imageToCanvas(image);

    expectPixel(canvas, 20, 20, BLACK);
    expectPixel(canvas, 25, 20, WHITE);
    expectPixel(canvas, 25, 25, BLACK);
  });

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
