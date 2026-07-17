import {describe, expect, test} from 'vitest';

import type {QRCodeMatrix} from '@qrcodesdk/core';

import {QRCodeImageRenderer} from '../src';
import {BLACK, WHITE, expectPixel, imageToCanvas} from './helper';

describe('QRCodeImageRenderer', () => {
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
});
