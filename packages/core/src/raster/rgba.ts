import {createQRCodeStyler} from '../drawing/styler';
import {QRCodeError} from '../error';
import type {QRCodeColor, QRCodeMatrix, QRCodeVisualStyle} from '../types';
import {type Color, blendPixel} from './blend';
import type {RasterCenterImageRenderer} from './center-image';
import {type Coverage, rasterizeShapePath} from './shape';
import type {RGBAImage} from './types';

/** RGBA pixels drawn by a raster renderer, backed by a writable byte array. */
export type RenderedRGBAImage = RGBAImage & {readonly data: Uint8Array};

type PackedColor = Color & {packed: number};

// 8192 x 8192 pixels. Pixels and coverage need 8 bytes per pixel, so larger output risks exhausting
// memory instead of failing with an error.
const MAX_OUTPUT_PIXELS = 67_108_864;

/** Creates a renderer that draws a QR code into RGBA pixels for the raster encoders. */
export function createRGBARenderer(
  style: QRCodeVisualStyle | undefined,
  centerImage: RasterCenterImageRenderer | undefined,
): (matrix: QRCodeMatrix) => RenderedRGBAImage {
  const draw = createQRCodeStyler(style, [centerImage?.part]);
  // Shape paths repeat across renders at one module size, so each is rasterized once.
  const coverages = new Map<string, Coverage>();

  return (matrix: QRCodeMatrix) => {
    const drawing = draw(matrix);
    const {moduleSize: scale, outputWidth: width, outputHeight: height} = drawing;
    if (width * height > MAX_OUTPUT_PIXELS) {
      throw new QRCodeError(
        'INVALID_OPTIONS',
        `QR code raster output must not exceed ${MAX_OUTPUT_PIXELS} pixels, received ${width} x ${height}`,
        {details: {field: 'dimensions', value: [width, height]}},
      );
    }
    const pixels = new Int32Array(width * height);
    const image: RenderedRGBAImage = {width, height, data: new Uint8Array(pixels.buffer)};
    // The image starts transparent, so the background is copied rather than blended.
    pixels.fill(parseColor(drawing.background).packed);

    // Coverage from 0 upward, which the composite step clears again.
    let coverage: Float32Array | undefined;
    for (const layer of drawing.layers) {
      const color = parseColor(layer.color);
      const blend = createBlender(color);
      const opaque = color.alpha === 255;
      const {packed} = color;
      const {rects, tiles} = layer;
      // Fill each color layer once, including where adjacent pieces share a partially covered pixel.
      if (tiles.length === 0 && rects.every((value) => Number.isInteger(value * scale))) {
        for (let index = 0; index < rects.length; index += 4) {
          const x = rects[index]! * scale;
          const y = rects[index + 1]! * scale;
          const startX = Math.max(0, x);
          const endX = Math.min(width, x + rects[index + 2]! * scale);
          const endY = Math.min(height, y + rects[index + 3]! * scale);
          for (let row = Math.max(0, y); row < endY; row++) {
            for (let pixel = row * width + startX, end = row * width + endX; pixel < end; pixel++) {
              pixels[pixel] = opaque ? packed : blend(pixels[pixel]!, 1);
            }
          }
        }
        continue;
      }
      coverage ??= new Float32Array(pixels.length);
      // Rows that the layer covers, to composite.
      let top = height;
      let bottom = 0;
      for (let index = 0; index < rects.length; index += 4) {
        const y = rects[index + 1]! * scale;
        const rectHeight = rects[index + 3]! * scale;
        top = Math.min(top, Math.max(0, Math.floor(y)));
        bottom = Math.max(bottom, Math.min(height, Math.ceil(y + rectHeight)));
        coverRect(
          coverage,
          width,
          height,
          rects[index]! * scale,
          y,
          rects[index + 2]! * scale,
          rectHeight,
        );
      }
      for (const [path, positions] of tiles) {
        let tile: Coverage | undefined;
        let lastX = Number.NaN;
        let lastY = Number.NaN;
        for (let index = 0; index < positions.length; index += 2) {
          const pixelX = positions[index]! * scale;
          const pixelY = positions[index + 1]! * scale;
          const originX = Math.floor(pixelX);
          const originY = Math.floor(pixelY);
          const offsetX = pixelX - originX;
          const offsetY = pixelY - originY;
          if (offsetX !== lastX || offsetY !== lastY) {
            lastX = offsetX;
            lastY = offsetY;
            const key = `${path.data}:${offsetX},${offsetY}`;
            tile = coverages.get(key);
            if (!tile)
              coverages.set(key, (tile = rasterizeShapePath(path.data, scale, offsetX, offsetY)));
          }
          top = Math.min(top, Math.max(0, originY + tile!.y));
          bottom = Math.max(bottom, Math.min(height, originY + tile!.y + tile!.height));
          blitCoverage(width, height, coverage, tile!, originX, originY);
        }
      }
      for (let index = top * width; index < bottom * width; index++) {
        const value = coverage[index]!;
        if (value === 0) continue;
        coverage[index] = 0;
        if (value >= 1 && opaque) pixels[index] = packed;
        else pixels[index] = blend(pixels[index]!, Math.min(1, value));
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
  return {red, green, blue, alpha, packed: new Int32Array(bytes.buffer)[0]!};
}

/**
 * Returns a function that blends the color over one packed pixel. Most pixels share few
 * destination colors, so the result for the last destination is kept for each multiple of 1/16.
 */
function createBlender(color: Color): (destination: number, coverage: number) => number {
  const pixel = new Int32Array(1);
  const image: RenderedRGBAImage = {width: 1, height: 1, data: new Uint8Array(pixel.buffer)};
  const destinations = new Float64Array(17).fill(Number.NaN);
  const results = new Int32Array(17);
  return (destination, coverage) => {
    const sixteenths = coverage * 16;
    const cached = Number.isInteger(sixteenths);
    if (cached && destinations[sixteenths] === destination) return results[sixteenths]!;
    pixel[0] = destination;
    blendPixel(image, 0, color, coverage);
    if (cached) {
      destinations[sixteenths] = destination;
      results[sixteenths] = pixel[0]!;
    }
    return pixel[0]!;
  };
}

/** Adds the area of a rectangle in each pixel to the coverage. */
function coverRect(
  coverage: Float32Array,
  imageWidth: number,
  imageHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(imageWidth, Math.ceil(x + width));
  const endY = Math.min(imageHeight, Math.ceil(y + height));
  const aligned =
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    Number.isInteger(width) &&
    Number.isInteger(height);
  for (let row = startY; row < endY; row++) {
    const offset = row * imageWidth;
    const vertical = Math.min(row + 1, y + height) - Math.max(row, y);
    for (let column = startX; column < endX; column++) {
      // Whole pixels are covered once, even where adjacent pieces add up to more.
      if (aligned) coverage[offset + column] = 1;
      else
        coverage[offset + column]! +=
          (Math.min(column + 1, x + width) - Math.max(column, x)) * vertical;
    }
  }
}

function blitCoverage(
  imageWidth: number,
  imageHeight: number,
  target: Float32Array,
  {x, y, width, height, samples}: Coverage,
  originX: number,
  originY: number,
): void {
  const left = originX + x;
  const top = originY + y;
  const startColumn = Math.max(0, -left);
  const endColumn = Math.min(width, imageWidth - left);
  for (let row = Math.max(0, -top); row < Math.min(height, imageHeight - top); row++) {
    const offset = (top + row) * imageWidth + left;
    for (let column = startColumn, source = row * width; column < endColumn; column++) {
      const count = samples[source + column]!;
      if (count !== 0) target[offset + column]! += count / 16;
    }
  }
}
