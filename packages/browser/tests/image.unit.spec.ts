import {describe, expect, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodeImageRenderer} from '../src';
import {BLACK, WHITE, expectPixel, imageToCanvas} from './helper';

describe('QRCodeImageRenderer', () => {
  test('renders an explicit empty alt attribute by default', () => {
    const image = QRCodeImageRenderer()([[1]]);

    expect(image.hasAttribute('alt')).toBe(true);
    expect(image.alt).toBe('');
  });

  test('renders a PNG data URL image with real rasterized pixels', async () => {
    const matrix: QRCodeMatrix = [
      [1, 0],
      [0, 1],
    ];
    const image = QRCodeImageRenderer({
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

  test('includes a prepared image overlay in PNG-backed image output', async () => {
    const logo = document.createElement('canvas');
    logo.width = 2;
    logo.height = 1;
    const logoContext = logo.getContext('2d')!;
    logoContext.fillStyle = '#ff0000';
    logoContext.fillRect(0, 0, 2, 1);

    const image = QRCodeImageRenderer({
      size: 10,
      margin: 0,
      image: {source: logo, size: 0.5, padding: 0},
    })([
      [1, 1],
      [1, 1],
    ]);
    const canvas = await imageToCanvas(image);

    expectPixel(canvas, 5, 5, WHITE);
    expectPixel(canvas, 10, 7, WHITE);
    expectPixel(canvas, 10, 8, {red: 255, green: 0, blue: 0, alpha: 255});
  });

  test('snapshots native accessibility options on first use', () => {
    const options = {alt: 'First alt', ariaLabel: 'First aria', title: 'First title'};
    const renderer = QRCodeImageRenderer(options);

    renderer([[1]]);
    options.alt = 'Second alt';
    options.ariaLabel = 'Second aria';
    options.title = 'Second title';
    const image = renderer([[1]]);

    expect(image.alt).toBe('First alt');
    expect(image.getAttribute('aria-label')).toBe('First aria');
    expect(image.title).toBe('First title');
  });
});
