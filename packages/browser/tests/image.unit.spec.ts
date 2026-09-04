import {describe, expect, test} from 'vitest';

import {QRCodeImageRenderer} from '../src';

describe('QRCodeImageRenderer', () => {
  test('wraps Canvas output and defaults alt to an empty string', () => {
    const image = QRCodeImageRenderer({style: {moduleSize: 2, quietZone: 0}})([[1]]);
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
    expect(image.alt).toBe('');
    expect(image.src).toMatch(/^data:image\/png;base64,/);
  });

  test('uses Image-specific nested accessibility', () => {
    const image = QRCodeImageRenderer({
      accessibility: {alt: 'QR destination', ariaLabel: 'Scan destination', title: 'Code'},
    })([[1]]);
    expect(image.alt).toBe('QR destination');
    expect(image.getAttribute('aria-label')).toBe('Scan destination');
    expect(image.title).toBe('Code');
  });

  test('rejects unsupported fields instead of ignoring them', () => {
    expect(() => QRCodeImageRenderer({alt: 'legacy' as never} as never)).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'options.alt'})}),
    );
    expect(() => QRCodeImageRenderer({accessibility: {alt: 1 as never}})).toThrowError(
      expect.objectContaining({details: expect.objectContaining({field: 'accessibility.alt'})}),
    );
  });
});
