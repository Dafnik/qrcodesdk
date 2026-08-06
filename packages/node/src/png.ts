import {PNG} from 'pngjs';

import {
  type QRCodeColorHex,
  type QRCodeImageOverlayOptions,
  type QRCodeMatrix,
  type QRCodeRenderer,
  type QRCodeStylingOptions,
  type ɵQRCodeStylePrimitive,
  ɵcreateQRCodeStylePlan,
  ɵparseQRCodeStylingOptions,
  ɵresolveQRCodeImageOverlay,
} from '@qrcodesdk/core';

export type QRCodePNGImageOptions = QRCodeImageOverlayOptions<Buffer>;
export type QRCodePNGRendererOptions = QRCodeStylingOptions & {
  image?: QRCodePNGImageOptions;
  compressionLevel?: number;
};

type RGBColor = {
  red: number;
  green: number;
  blue: number;
  rgba: Buffer;
};

type CoverageMask = {
  width: number;
  height: number;
  coverage: Uint8Array;
};

export function QRCodePNGRenderer(options?: QRCodePNGRendererOptions): QRCodeRenderer<Buffer> {
  let resolvedStyling: ReturnType<typeof ɵparseQRCodeStylingOptions> | undefined;
  let resolvedCompressionLevel: number | undefined;
  let decodedImage: PNG | undefined;
  const coverageMasks = new Map<string, CoverageMask>();
  const colors = new Map<QRCodeColorHex, RGBColor>();

  return (matrix: QRCodeMatrix) => {
    const styling = (resolvedStyling ??= ɵparseQRCodeStylingOptions(options));
    const compressionLevel = (resolvedCompressionLevel ??= resolveCompressionLevel(
      options?.compressionLevel,
    ));
    const plan = ɵcreateQRCodeStylePlan(matrix, styling);
    const image = ɵresolveQRCodeImageOverlay(plan.moduleCount, styling.margin, options?.image);
    const scale = plan.renderedSize / plan.viewSize;
    const png = new PNG({width: plan.renderedSize, height: plan.renderedSize});
    const backgroundColor = hexColorToRGB(plan.backgroundColor, colors);
    fillRect(png, 0, 0, plan.renderedSize, plan.renderedSize, backgroundColor);

    for (let layerIndex = 0; layerIndex < plan.layers.length; layerIndex++) {
      const layer = plan.layers[layerIndex]!;
      const color = hexColorToRGB(layer.color, colors);
      for (let rectangleIndex = 0; rectangleIndex < layer.rectangles.length; rectangleIndex++) {
        const rectangle = layer.rectangles[rectangleIndex]!;
        fillRect(
          png,
          rectangle.x * scale,
          rectangle.y * scale,
          rectangle.width * scale,
          rectangle.height * scale,
          color,
        );
      }
      for (
        let primitiveIndex = 0;
        primitiveIndex < layer.curvedPrimitives.length;
        primitiveIndex++
      ) {
        rasterizePrimitive(
          png,
          layer.curvedPrimitives[primitiveIndex]!,
          scale,
          color,
          coverageMasks,
        );
      }
    }

    if (image) {
      const source = (decodedImage ??= decodeImageSource(image.source));
      if (image.clearBackground) {
        const startX = Math.max(0, Math.floor(image.clearX * scale));
        const startY = Math.max(0, Math.floor(image.clearY * scale));
        const endX = Math.min(png.width, Math.ceil((image.clearX + image.clearSize) * scale));
        const endY = Math.min(png.height, Math.ceil((image.clearY + image.clearSize) * scale));
        fillRect(png, startX, startY, endX - startX, endY - startY, backgroundColor);
      }
      compositeImage(
        png,
        source,
        image.imageX * scale,
        image.imageY * scale,
        image.imageSize * scale,
      );
    }

    return PNG.sync.write(png, {deflateLevel: compressionLevel});
  };
}

function resolveCompressionLevel(value: number | undefined): number {
  const compressionLevel = value ?? 9;
  if (!Number.isSafeInteger(compressionLevel) || compressionLevel < 0 || compressionLevel > 9) {
    throw new Error(
      `QR code PNG compressionLevel must be an integer from 0 to 9, received ${String(compressionLevel)}`,
    );
  }
  return compressionLevel;
}

function decodeImageSource(source: Buffer): PNG {
  if (!Buffer.isBuffer(source)) {
    throw new Error('QR code PNG image source must be a Buffer containing PNG bytes');
  }

  try {
    return PNG.sync.read(source);
  } catch (error) {
    throw new Error('QR code PNG image source must contain valid PNG bytes', {cause: error});
  }
}

function compositeImage(
  target: PNG,
  source: PNG,
  boxX: number,
  boxY: number,
  boxSize: number,
): void {
  const scale = Math.min(boxSize / source.width, boxSize / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const startX = Math.round(boxX + (boxSize - width) / 2);
  const startY = Math.round(boxY + (boxSize - height) / 2);
  const sourceX0s = new Int32Array(width);
  const sourceX1s = new Int32Array(width);
  const sourceXWeights = new Float64Array(width);
  for (let targetX = 0; targetX < width; targetX++) {
    const sourceX = ((targetX + 0.5) * source.width) / width - 0.5;
    const sourceX0 = Math.floor(sourceX);
    sourceX0s[targetX] = clamp(sourceX0, 0, source.width - 1) << 2;
    sourceX1s[targetX] = clamp(sourceX0 + 1, 0, source.width - 1) << 2;
    sourceXWeights[targetX] = sourceX - sourceX0;
  }

  for (let targetY = 0; targetY < height; targetY++) {
    const outputY = startY + targetY;
    if (outputY < 0 || outputY >= target.height) continue;

    const sourceY = ((targetY + 0.5) * source.height) / height - 0.5;
    const sourceY0 = Math.floor(sourceY);
    const y0 = clamp(sourceY0, 0, source.height - 1);
    const y1 = clamp(sourceY0 + 1, 0, source.height - 1);
    const yWeight = sourceY - sourceY0;
    const inverseYWeight = 1 - yWeight;
    const y0Offset = source.width * y0 * 4;
    const y1Offset = source.width * y1 * 4;

    for (let targetX = 0; targetX < width; targetX++) {
      const outputX = startX + targetX;
      if (outputX < 0 || outputX >= target.width) continue;

      const xWeight = sourceXWeights[targetX]!;
      const inverseXWeight = 1 - xWeight;
      const topLeftWeight = inverseXWeight * inverseYWeight;
      const topRightWeight = xWeight * inverseYWeight;
      const bottomLeftWeight = inverseXWeight * yWeight;
      const bottomRightWeight = xWeight * yWeight;
      const topLeftIndex = y0Offset + sourceX0s[targetX]!;
      const topRightIndex = y0Offset + sourceX1s[targetX]!;
      const bottomLeftIndex = y1Offset + sourceX0s[targetX]!;
      const bottomRightIndex = y1Offset + sourceX1s[targetX]!;
      const topLeftAlpha = (source.data[topLeftIndex + 3]! / 0xff) * topLeftWeight;
      const topRightAlpha = (source.data[topRightIndex + 3]! / 0xff) * topRightWeight;
      const bottomLeftAlpha = (source.data[bottomLeftIndex + 3]! / 0xff) * bottomLeftWeight;
      const bottomRightAlpha = (source.data[bottomRightIndex + 3]! / 0xff) * bottomRightWeight;
      const alpha = topLeftAlpha + topRightAlpha + bottomLeftAlpha + bottomRightAlpha;
      const red =
        source.data[topLeftIndex]! * topLeftAlpha +
        source.data[topRightIndex]! * topRightAlpha +
        source.data[bottomLeftIndex]! * bottomLeftAlpha +
        source.data[bottomRightIndex]! * bottomRightAlpha;
      const green =
        source.data[topLeftIndex + 1]! * topLeftAlpha +
        source.data[topRightIndex + 1]! * topRightAlpha +
        source.data[bottomLeftIndex + 1]! * bottomLeftAlpha +
        source.data[bottomRightIndex + 1]! * bottomRightAlpha;
      const blue =
        source.data[topLeftIndex + 2]! * topLeftAlpha +
        source.data[topRightIndex + 2]! * topRightAlpha +
        source.data[bottomLeftIndex + 2]! * bottomLeftAlpha +
        source.data[bottomRightIndex + 2]! * bottomRightAlpha;

      const targetIndex = (target.width * outputY + outputX) << 2;
      const backgroundAlpha = 1 - alpha;
      target.data[targetIndex] = Math.round(red + target.data[targetIndex]! * backgroundAlpha);
      target.data[targetIndex + 1] = Math.round(
        green + target.data[targetIndex + 1]! * backgroundAlpha,
      );
      target.data[targetIndex + 2] = Math.round(
        blue + target.data[targetIndex + 2]! * backgroundAlpha,
      );
      target.data[targetIndex + 3] = 0xff;
    }
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function rasterizePrimitive(
  png: PNG,
  primitive: ɵQRCodeStylePrimitive,
  scale: number,
  color: RGBColor,
  coverageMasks: Map<string, CoverageMask>,
): void {
  const startX = primitive.x * scale;
  const startY = primitive.y * scale;
  const mask = getCoverageMask(primitive, scale, coverageMasks);

  for (let row = 0; row < mask.height; row++) {
    for (let column = 0; column < mask.width; column++) {
      const coveredSamples = mask.coverage[row * mask.width + column]!;
      if (coveredSamples === 16) {
        setPixel(png, startX + column, startY + row, color);
      } else if (coveredSamples > 0) {
        blendPixel(png, startX + column, startY + row, color, coveredSamples / 16);
      }
    }
  }
}

function getCoverageMask(
  primitive: ɵQRCodeStylePrimitive,
  scale: number,
  cache: Map<string, CoverageMask>,
): CoverageMask {
  const key = `${primitive.kind}:${primitive.shape}:${primitive.rotation}:${primitive.size}:${scale}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const width = primitive.size * scale;
  const height = width;
  const coverage = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      let coveredSamples = 0;
      for (let sampleRow = 0; sampleRow < 4; sampleRow++) {
        for (let sampleColumn = 0; sampleColumn < 4; sampleColumn++) {
          const localX = (column + (sampleColumn + 0.5) / 4) / scale;
          const localY = (row + (sampleRow + 0.5) / 4) / scale;
          let x: number;
          let y: number;
          switch (primitive.rotation) {
            case 90:
              x = localY;
              y = primitive.size - localX;
              break;
            case 180:
              x = primitive.size - localX;
              y = primitive.size - localY;
              break;
            case 270:
              x = primitive.size - localY;
              y = localX;
              break;
            default:
              x = localX;
              y = localY;
          }
          if (containsPrimitive(primitive, x, y)) coveredSamples++;
        }
      }
      coverage[row * width + column] = coveredSamples;
    }
  }

  const mask = {width, height, coverage};
  cache.set(key, mask);
  return mask;
}

function containsPrimitive(primitive: ɵQRCodeStylePrimitive, x: number, y: number): boolean {
  if (primitive.kind === 'finder-ring') {
    if (primitive.shape === 'dot') {
      const outer = insideCircle(x, y, primitive.size / 2, primitive.size / 2, primitive.size / 2);
      const inner = insideCircle(
        x,
        y,
        primitive.size / 2,
        primitive.size / 2,
        primitive.size / 2 - 1,
      );
      return outer && !inner;
    }

    const outerRadius = primitive.shape === 'extra-rounded' ? 2.5 : 0;
    const innerRadius = primitive.shape === 'extra-rounded' ? 1.5 : 0;
    return (
      insideRoundedSquare(x, y, 0, 0, primitive.size, outerRadius) &&
      !insideRoundedSquare(x, y, 1, 1, primitive.size - 2, innerRadius)
    );
  }

  if (primitive.kind === 'finder-center') {
    return primitive.shape === 'dot'
      ? insideCircle(x, y, primitive.size / 2, primitive.size / 2, primitive.size / 2)
      : insideRoundedSquare(x, y, 0, 0, primitive.size, 0);
  }

  switch (primitive.shape) {
    case 'dot':
      return insideCircle(x, y, 0.5, 0.5, 0.5);
    case 'side-rounded':
      return x <= 0.5 || insideCircle(x, y, 0.5, 0.5, 0.5);
    case 'corner-rounded':
      return x <= 0.5 || y >= 0.5 || insideCircle(x, y, 0.5, 0.5, 0.5);
    case 'corner-extra-rounded':
      return insideCircle(x, y, 0, 1, 1);
    case 'opposite-corners-rounded':
      if ((x < 0.5 && y > 0.5) || (x > 0.5 && y < 0.5)) {
        return insideCircle(x, y, 0.5, 0.5, 0.5);
      }
      return true;
    default:
      return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  }
}

function insideCircle(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radius: number,
): boolean {
  return (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2;
}

function insideRoundedSquare(
  x: number,
  y: number,
  originX: number,
  originY: number,
  size: number,
  radius: number,
): boolean {
  if (x < originX || x > originX + size || y < originY || y > originY + size) return false;
  if (radius === 0) return true;

  const nearestX = Math.max(originX + radius, Math.min(x, originX + size - radius));
  const nearestY = Math.max(originY + radius, Math.min(y, originY + size - radius));
  return insideCircle(x, y, nearestX, nearestY, radius);
}

function blendPixel(png: PNG, x: number, y: number, color: RGBColor, coverage: number): void {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;

  const index = (png.width * y + x) << 2;
  const backgroundCoverage = 1 - coverage;
  png.data[index] = Math.round(color.red * coverage + png.data[index]! * backgroundCoverage);
  png.data[index + 1] = Math.round(
    color.green * coverage + png.data[index + 1]! * backgroundCoverage,
  );
  png.data[index + 2] = Math.round(
    color.blue * coverage + png.data[index + 2]! * backgroundCoverage,
  );
  png.data[index + 3] = 0xff;
}

function setPixel(png: PNG, x: number, y: number, color: RGBColor): void {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;

  const index = (png.width * y + x) << 2;
  png.data[index] = color.red;
  png.data[index + 1] = color.green;
  png.data[index + 2] = color.blue;
  png.data[index + 3] = 0xff;
}

function fillRect(
  png: PNG,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGBColor,
): void {
  const startX = Math.max(0, x);
  const startY = Math.max(0, y);
  const endX = Math.min(png.width, x + width);
  const endY = Math.min(png.height, y + height);
  if (startX >= endX || startY >= endY) return;

  for (let row = startY; row < endY; row++) {
    const start = (png.width * row + startX) << 2;
    png.data.fill(color.rgba, start, start + (endX - startX) * 4);
  }
}

function hexColorToRGB(value: QRCodeColorHex, cache: Map<QRCodeColorHex, RGBColor>): RGBColor {
  const cached = cache.get(value);
  if (cached) return cached;

  const hex = value.slice(1);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const color = {red, green, blue, rgba: Buffer.from([red, green, blue, 0xff])};
  cache.set(value, color);
  return color;
}
