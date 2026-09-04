import {describe, expect, test} from 'vitest';

import {QRCodeError} from '@qrcodesdk/core';

import {QRCodeCanvasRenderer} from '../src';
import {BLACK, WHITE, expectPixel} from './helper';

describe('QRCodeCanvasRenderer', () => {
  test('renders dimensions, colors, and transparent RGBA backgrounds', () => {
    const canvas = QRCodeCanvasRenderer({
      style: {
        moduleSize: 3,
        quietZone: 1,
        foreground: '#000000',
        background: '#ffffff80',
      },
    })([
      [1, 0],
      [0, 1],
    ]);
    expect(canvas.width).toBe(12);
    expect(canvas.height).toBe(12);
    expectPixel(canvas, 0, 0, {red: 255, green: 255, blue: 255, alpha: 128});
    expectPixel(canvas, 3, 3, BLACK);
    expectPixel(canvas, 6, 3, {red: 255, green: 255, blue: 255, alpha: 128});
  });

  test('applies nested accessibility options', () => {
    const canvas = QRCodeCanvasRenderer({
      accessibility: {ariaLabel: 'Scan this', title: 'QR code'},
    })([[1]]);
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('Scan this');
    expect(canvas.title).toBe('QR code');
    expect(QRCodeCanvasRenderer()([[1]]).getAttribute('aria-hidden')).toBe('true');
  });

  test('renders curved public shapes', () => {
    const canvas = QRCodeCanvasRenderer({
      style: {
        moduleSize: 8,
        quietZone: 0,
        modules: {shape: 'circle'},
      },
    })([[1]]);
    expectPixel(canvas, 0, 0, WHITE);
    expectPixel(canvas, 4, 4, BLACK);
  });

  test('validates options at construction', () => {
    expect(() => QRCodeCanvasRenderer({style: {moduleSize: 0}})).toThrowError(QRCodeError);
    expect(() => QRCodeCanvasRenderer({size: 2} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'options.size'})}),
    );
    expect(() => QRCodeCanvasRenderer({accessibility: {ariaLabel: 1 as never}})).toThrowError(
      expect.objectContaining({
        details: expect.objectContaining({field: 'accessibility.ariaLabel'}),
      }),
    );
  });
});
