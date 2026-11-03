import type {QRCodeColor, QRCodeMatrix, QRCodeVisualStyle} from '@qrcodesdk/core';
import {QRCodeError} from '@qrcodesdk/core/error';
import {ɵcreateQRCodeStyler as createQRCodeStyler} from '@qrcodesdk/core/internal';

import {type QRCodeRasterCenterImage, centerImages} from './center-image';
import {type Color, type RGBAImage, blendPixel} from './pixels';
import {type Coverage, rasterizeShapePath} from './raster';

/** Options shared by the PNG, WebP, GIF, and JPEG renderers. */
export type QRCodeRasterRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly centerImage?: QRCodeRasterCenterImage;
};

type PackedColor = Color & {packed: number};

// 8192 x 8192 pixels. Pixels and coverage need 8 bytes per pixel, so larger output risks exhausting
// memory instead of failing with an error.
const MAX_OUTPUT_PIXELS = 67_108_864;

/** Creates a renderer that draws a QR code into RGBA pixels for the raster encoders. */
export function createRGBARenderer(
  options: QRCodeRasterRendererOptions | undefined,
): (matrix: QRCodeMatrix) => RGBAImage {
  const centerImage = centerImages.resolve(options?.centerImage);
  const draw = createQRCodeStyler(options?.style, [centerImage?.part]);
  // Shape paths repeat across renders at one module size, so each is rasterized once.
  const coverages = new Map<string, Coverage>();

  return (matrix: QRCodeMatrix) => {
    const drawing = draw(matrix);
    const {moduleSize: scale, outputSize} = drawing;
    if (outputSize * outputSize > MAX_OUTPUT_PIXELS) {
      throw new QRCodeError(
        'INVALID_OPTIONS',
        `QR code raster output must not exceed ${MAX_OUTPUT_PIXELS} pixels, received ${outputSize} x ${outputSize}`,
        {details: {field: 'dimensions', value: outputSize}},
      );
    }
    const pixels = new Uint32Array(outputSize * outputSize);
    const image: RGBAImage = {
      width: outputSize,
      height: outputSize,
      data: Buffer.from(pixels.buffer),
    };
    const background = parseColor(drawing.background);
    // The image starts transparent, so the background is copied rather than blended.
    pixels.fill(background.packed);

    let layerCoverage: Float32Array | undefined;
    for (const layer of drawing.layers) {
      const color = parseColor(layer.color);
      const {rects} = layer;
      // Fill each color layer once, including where adjacent pieces share a partially covered pixel.
      const needsCoverage =
        layer.tiles.length > 0 || rects.some((value) => !Number.isInteger(value * scale));
      let coveragePixels: Float32Array | undefined;
      if (needsCoverage) {
        if (layerCoverage) layerCoverage.fill(0);
        else layerCoverage = new Float32Array(pixels.length);
        coveragePixels = layerCoverage;
      }
      for (let index = 0; index < rects.length; index += 4) {
        fillRect(
          image,
          pixels,
          rects[index]! * scale,
          rects[index + 1]! * scale,
          rects[index + 2]! * scale,
          rects[index + 3]! * scale,
          color,
          coveragePixels,
        );
      }
      for (const [path, positions] of layer.tiles) {
        for (let index = 0; index < positions.length; index += 2) {
          const pixelX = positions[index]! * scale;
          const pixelY = positions[index + 1]! * scale;
          const originX = Math.floor(pixelX);
          const originY = Math.floor(pixelY);
          const offsetX = pixelX - originX;
          const offsetY = pixelY - originY;
          const key = `${path.data}:${offsetX},${offsetY}`;
          let coverage = coverages.get(key);
          if (!coverage)
            coverages.set(key, (coverage = rasterizeShapePath(path.data, scale, offsetX, offsetY)));
          blitCoverage(image.width, image.height, coveragePixels!, coverage, originX, originY);
        }
      }
      if (coveragePixels) {
        for (let index = 0; index < coveragePixels.length; index++) {
          const coverage = Math.min(1, coveragePixels[index]!);
          if (coverage === 0) continue;
          if (coverage === 1 && color.alpha === 255) pixels[index] = color.packed;
          else blendPixel(image, index, color, coverage);
        }
      }
    }

    centerImage?.draw(image, drawing);
    return image;
  };
}

function parseColor(color: QRCodeColor): PackedColor {
  const channel = (index: number) => Number.parseInt(color.slice(index, index + 2), 16);
  const bytes = new Uint8Array([
    channel(1),
    channel(3),
    channel(5),
    color.length === 9 ? channel(7) : 255,
  ]);
  const [red, green, blue, alpha] = bytes as unknown as [number, number, number, number];
  // Reading the bytes back as one word keeps the packed value independent of endianness.
  return {red, green, blue, alpha, packed: new Uint32Array(bytes.buffer)[0]!};
}

function fillRect(
  image: RGBAImage,
  pixels: Uint32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  color: PackedColor,
  coveragePixels: Float32Array | undefined,
): void {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(image.width, Math.ceil(x + width));
  const endY = Math.min(image.height, Math.ceil(y + height));
  if (endX <= startX || endY <= startY) return;
  const aligned = [x, y, width, height].every(Number.isInteger);
  for (let row = startY; row < endY; row++) {
    const offset = row * image.width;
    if (aligned && coveragePixels) {
      coveragePixels.fill(1, offset + startX, offset + endX);
    } else if (aligned && color.alpha === 255) {
      pixels.fill(color.packed, offset + startX, offset + endX);
    } else {
      const vertical = Math.min(row + 1, y + height) - Math.max(row, y);
      for (let column = startX; column < endX; column++) {
        const horizontal = Math.min(column + 1, x + width) - Math.max(column, x);
        if (coveragePixels) coveragePixels[offset + column]! += horizontal * vertical;
        else blendPixel(image, offset + column, color, horizontal * vertical);
      }
    }
  }
}

function blitCoverage(
  imageWidth: number,
  imageHeight: number,
  pixels: Float32Array,
  coverage: Coverage,
  originX: number,
  originY: number,
): void {
  const {width, height, samples} = coverage;
  for (let row = 0; row < height; row++) {
    const y = originY + coverage.y + row;
    if (y < 0 || y >= imageHeight) continue;
    for (let column = 0; column < width; column++) {
      const x = originX + coverage.x + column;
      const count = samples[row * width + column]!;
      if (count === 0 || x < 0 || x >= imageWidth) continue;
      pixels[y * imageWidth + x]! += count / 16;
    }
  }
}
