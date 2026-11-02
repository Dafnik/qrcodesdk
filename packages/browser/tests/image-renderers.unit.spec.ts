import {matrixFromRows} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {QRCodeGIFImageRenderer, QRCodePNGImageRenderer, QRCodeWebPImageRenderer} from '../src';
import {getCanvasContext, imageToCanvas} from './helper';

const IMAGE_RENDERERS = [
  {format: 'PNG', mimeType: 'image/png', createRenderer: QRCodePNGImageRenderer},
  {format: 'WebP', mimeType: 'image/webp', createRenderer: QRCodeWebPImageRenderer},
  {format: 'GIF', mimeType: 'image/gif', createRenderer: QRCodeGIFImageRenderer},
] as const;

describe.each(IMAGE_RENDERERS)('$format image renderer', ({mimeType, createRenderer}) => {
  test('wraps Canvas output and defaults alt to an empty string', () => {
    const image = createRenderer({style: {moduleSize: 2, quietZone: 0}})(matrixFromRows([[1]]));
    expect(image).toBeInstanceOf(HTMLImageElement);
    expect(image.width).toBe(2);
    expect(image.height).toBe(2);
    expect(image.alt).toBe('');
    expect(image.src.startsWith(`data:${mimeType};base64,`)).toBe(true);
  });

  test('decodes to the Canvas pixels', async () => {
    const image = createRenderer({
      style: {moduleSize: 3, quietZone: 1, foreground: '#123456', background: '#fedcba'},
    })(
      matrixFromRows([
        [1, 0],
        [0, 1],
      ]),
    );
    const pixels = getCanvasContext(await imageToCanvas(image)).getImageData(0, 0, 12, 12).data;
    expect([...pixels.subarray(0, 4)]).toEqual([254, 220, 186, 255]);
    expect([...pixels.subarray((3 * 12 + 3) * 4, (3 * 12 + 3) * 4 + 4)]).toEqual([
      0x12, 0x34, 0x56, 255,
    ]);
  });

  test('uses Image-specific nested accessibility', () => {
    const image = createRenderer({
      accessibility: {alt: 'QR destination', ariaLabel: 'Scan destination', title: 'Code'},
    })(matrixFromRows([[1]]));
    expect(image.alt).toBe('QR destination');
    expect(image.getAttribute('aria-label')).toBe('Scan destination');
    expect(image.title).toBe('Code');
  });

  test('wraps canvas encoding failures in QRCodeError', () => {
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    const getImageData = CanvasRenderingContext2D.prototype.getImageData;
    const fail = () => {
      throw new DOMException('The canvas is not origin-clean', 'SecurityError');
    };
    HTMLCanvasElement.prototype.toDataURL = fail;
    CanvasRenderingContext2D.prototype.getImageData = fail;

    try {
      expect(() => createRenderer()(matrixFromRows([[1]]))).toThrow(
        expect.objectContaining({code: 'RENDER_FAILED'}),
      );
    } finally {
      HTMLCanvasElement.prototype.toDataURL = toDataURL;
      CanvasRenderingContext2D.prototype.getImageData = getImageData;
    }
  });
});

describe('QRCodeGIFImageRenderer', () => {
  test('makes pixels below the transparency threshold transparent', async () => {
    const style = {moduleSize: 2, quietZone: 1, background: '#ffffff00'} as const;
    const transparent = QRCodeGIFImageRenderer({style})(matrixFromRows([[1]]));
    const opaque = QRCodeGIFImageRenderer({style, transparency: {threshold: 0}})(
      matrixFromRows([[1]]),
    );
    const alpha = async (image: HTMLImageElement) =>
      getCanvasContext(await imageToCanvas(image)).getImageData(0, 0, 1, 1).data[3];
    await expect(alpha(transparent)).resolves.toBe(0);
    await expect(alpha(opaque)).resolves.toBe(255);
  });

  test('rejects invalid transparency thresholds when created', () => {
    expect(() => QRCodeGIFImageRenderer({transparency: {threshold: 300}})).toThrow(
      expect.objectContaining({code: 'INVALID_OPTIONS'}),
    );
  });
});
