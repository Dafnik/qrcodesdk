import {QR_CODE_TEST_FIXTURES, fixtureMatrixOptions, matrixFromRows} from '@repo/core-testing';
import {describe, expect, test} from 'vitest';

import {type QRCodeColor, qrcode} from '@qrcodesdk/core';

import {
  QRCodeGIFImageRenderer,
  QRCodeJPEGImageRenderer,
  QRCodePNGImageRenderer,
  QRCodeWebPImageRenderer,
} from '../src';
import {getCanvasContext, imageToCanvas} from './helper';

// Lossless formats decode to the exact Canvas pixels. JPEG at full quality rounds each channel
// slightly.
const IMAGE_RENDERERS = [
  {format: 'PNG', mimeType: 'image/png', createRenderer: QRCodePNGImageRenderer, tolerance: 0},
  {format: 'WebP', mimeType: 'image/webp', createRenderer: QRCodeWebPImageRenderer, tolerance: 0},
  {format: 'GIF', mimeType: 'image/gif', createRenderer: QRCodeGIFImageRenderer, tolerance: 0},
  {
    format: 'JPEG',
    mimeType: 'image/jpeg',
    createRenderer: QRCodeJPEGImageRenderer,
    tolerance: 2,
    options: {quality: 100},
  },
] as const;

function expectPixelNear(actual: ArrayLike<number>, expected: number[], tolerance: number): void {
  expected.forEach((value, index) =>
    expect(Math.abs(actual[index]! - value)).toBeLessThanOrEqual(tolerance),
  );
}

function dataURLBytes(url: string): Uint8Array {
  return Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (character) =>
    character.charCodeAt(0),
  );
}

describe.each(IMAGE_RENDERERS)('$format image renderer', (renderer) => {
  const {mimeType, createRenderer, tolerance} = renderer;
  const options = 'options' in renderer ? renderer.options : {};

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
      ...options,
      style: {moduleSize: 3, quietZone: 1, foreground: '#123456', background: '#fedcba'},
    })(
      matrixFromRows([
        [1, 0],
        [0, 1],
      ]),
    );
    const pixels = getCanvasContext(await imageToCanvas(image)).getImageData(0, 0, 12, 12).data;
    expectPixelNear(pixels.subarray(0, 4), [254, 220, 186, 255], tolerance);
    expectPixelNear(
      pixels.subarray((3 * 12 + 3) * 4, (3 * 12 + 3) * 4 + 4),
      [0x12, 0x34, 0x56, 255],
      tolerance,
    );
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

describe('QRCodeJPEGImageRenderer', () => {
  const firstPixel = async (image: HTMLImageElement) => [
    ...getCanvasContext(await imageToCanvas(image)).getImageData(0, 0, 1, 1).data,
  ];
  const style = {moduleSize: 8, quietZone: 1, background: '#ffffff00'} as const;

  test('blends a transparent background onto white instead of black', async () => {
    const image = QRCodeJPEGImageRenderer({style})(matrixFromRows([[1]]));
    await expect(firstPixel(image)).resolves.toEqual([255, 255, 255, 255]);
  });

  test('blends a transparent background onto the matte color', async () => {
    const image = QRCodeJPEGImageRenderer({style, transparency: {matte: '#336699'}})(
      matrixFromRows([[1]]),
    );
    expectPixelNear(await firstPixel(image), [0x33, 0x66, 0x99, 255], 1);
  });

  test('rejects invalid quality and matte options when created', () => {
    expect(() => QRCodeJPEGImageRenderer({quality: 0})).toThrow(
      expect.objectContaining({code: 'INVALID_OPTIONS'}),
    );
    expect(() =>
      QRCodeJPEGImageRenderer({transparency: {matte: '#ffffff80' as QRCodeColor}}),
    ).toThrow(expect.objectContaining({code: 'INVALID_OPTIONS'}));
  });

  test.each(QR_CODE_TEST_FIXTURES.slice(0, 4))(
    'writes the same bytes as the Node.js renderer for $name',
    async (fixture) => {
      const image = qrcode(fixture.payload)
        .options(fixtureMatrixOptions(fixture))
        .render(QRCodeJPEGImageRenderer({style: {moduleSize: 8, quietZone: 4}}));
      // Square modules on whole pixels give Canvas and the Node.js rasterizer equal pixels.
      const snapshot = await fetch(
        new URL(`../../node/tests/__snapshots__/jpeg/${fixture.name}.jpeg`, import.meta.url),
      );
      expect(snapshot.ok).toBe(true);
      expect(dataURLBytes(image.src)).toEqual(new Uint8Array(await snapshot.arrayBuffer()));
    },
  );
});
