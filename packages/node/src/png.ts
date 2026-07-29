import {PNG} from 'pngjs';

import {
  type QRCodeColorHex,
  type QRCodeImageOverlayOptions,
  type QRCodeMatrix,
  type QRCodeRenderer,
  type QRCodeStylePrimitive,
  type QRCodeStylingOptions,
  ɵcreateQRCodeStylePlan,
  ɵparseQRCodeStylingOptions,
  ɵresolveQRCodeImageOverlay,
} from '@qrcodesdk/core';

export type QRCodePNGImageOptions = QRCodeImageOverlayOptions<Buffer>;
export type QRCodePNGRendererOptions = QRCodeStylingOptions & {
  image?: QRCodePNGImageOptions;
};

type RGBColor = {
  red: number;
  green: number;
  blue: number;
};

export function QRCodePNGRenderer(options?: QRCodePNGRendererOptions): QRCodeRenderer<Buffer> {
  return (matrix: QRCodeMatrix) => {
    const styling = ɵparseQRCodeStylingOptions(options);
    const plan = ɵcreateQRCodeStylePlan(matrix, styling);
    const image = ɵresolveQRCodeImageOverlay(plan.moduleCount, styling.margin, options?.image);
    const scale = plan.renderedSize / plan.viewSize;
    const png = new PNG({width: plan.renderedSize, height: plan.renderedSize});
    fillRect(png, 0, 0, plan.renderedSize, plan.renderedSize, hexColorToRGB(plan.backgroundColor));

    for (let index = 0; index < plan.primitives.length; index++) {
      rasterizePrimitive(png, plan.primitives[index]!, scale);
    }

    if (image) {
      const source = decodeImageSource(image.source);
      if (image.clearBackground) {
        const startX = Math.max(0, Math.floor(image.clearX * scale));
        const startY = Math.max(0, Math.floor(image.clearY * scale));
        const endX = Math.min(png.width, Math.ceil((image.clearX + image.clearSize) * scale));
        const endY = Math.min(png.height, Math.ceil((image.clearY + image.clearSize) * scale));
        fillRect(
          png,
          startX,
          startY,
          endX - startX,
          endY - startY,
          hexColorToRGB(plan.backgroundColor),
        );
      }
      compositeImage(
        png,
        source,
        image.imageX * scale,
        image.imageY * scale,
        image.imageSize * scale,
      );
    }

    return PNG.sync.write(png);
  };
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

  for (let targetY = 0; targetY < height; targetY++) {
    const outputY = startY + targetY;
    if (outputY < 0 || outputY >= target.height) continue;

    const sourceY = ((targetY + 0.5) * source.height) / height - 0.5;
    const sourceY0 = Math.floor(sourceY);
    const y0 = clamp(sourceY0, 0, source.height - 1);
    const y1 = clamp(sourceY0 + 1, 0, source.height - 1);
    const yWeight = sourceY - sourceY0;

    for (let targetX = 0; targetX < width; targetX++) {
      const outputX = startX + targetX;
      if (outputX < 0 || outputX >= target.width) continue;

      const sourceX = ((targetX + 0.5) * source.width) / width - 0.5;
      const sourceX0 = Math.floor(sourceX);
      const x0 = clamp(sourceX0, 0, source.width - 1);
      const x1 = clamp(sourceX0 + 1, 0, source.width - 1);
      const xWeight = sourceX - sourceX0;
      const topLeftWeight = (1 - xWeight) * (1 - yWeight);
      const topRightWeight = xWeight * (1 - yWeight);
      const bottomLeftWeight = (1 - xWeight) * yWeight;
      const bottomRightWeight = xWeight * yWeight;
      const samples = [
        {x: x0, y: y0, weight: topLeftWeight},
        {x: x1, y: y0, weight: topRightWeight},
        {x: x0, y: y1, weight: bottomLeftWeight},
        {x: x1, y: y1, weight: bottomRightWeight},
      ] as const;

      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      for (const sample of samples) {
        const sourceIndex = (source.width * sample.y + sample.x) << 2;
        const sampleAlpha = source.data[sourceIndex + 3]! / 0xff;
        const weightedAlpha = sampleAlpha * sample.weight;
        alpha += weightedAlpha;
        red += source.data[sourceIndex]! * weightedAlpha;
        green += source.data[sourceIndex + 1]! * weightedAlpha;
        blue += source.data[sourceIndex + 2]! * weightedAlpha;
      }

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

function rasterizePrimitive(png: PNG, primitive: QRCodeStylePrimitive, scale: number): void {
  const color = hexColorToRGB(primitive.color);
  const startX = primitive.x * scale;
  const startY = primitive.y * scale;
  const pixelSize = primitive.size * scale;

  if (primitive.shape === 'square') {
    if (primitive.kind === 'finder-ring') {
      fillRect(png, startX, startY, pixelSize, scale, color);
      fillRect(png, startX, startY + pixelSize - scale, pixelSize, scale, color);
      fillRect(png, startX, startY + scale, scale, pixelSize - 2 * scale, color);
      fillRect(
        png,
        startX + pixelSize - scale,
        startY + scale,
        scale,
        pixelSize - 2 * scale,
        color,
      );
    } else {
      fillRect(png, startX, startY, pixelSize, pixelSize, color);
    }
    return;
  }

  for (let row = startY; row < startY + pixelSize; row++) {
    for (let column = startX; column < startX + pixelSize; column++) {
      let coveredSamples = 0;
      for (let sampleRow = 0; sampleRow < 4; sampleRow++) {
        for (let sampleColumn = 0; sampleColumn < 4; sampleColumn++) {
          const localX = (column - startX + (sampleColumn + 0.5) / 4) / scale;
          const localY = (row - startY + (sampleRow + 0.5) / 4) / scale;
          const point = inverseRotatePoint(localX, localY, primitive.size, primitive.rotation);
          if (containsPrimitive(primitive, point.x, point.y)) coveredSamples++;
        }
      }

      if (coveredSamples > 0) blendPixel(png, column, row, color, coveredSamples / 16);
    }
  }
}

function containsPrimitive(primitive: QRCodeStylePrimitive, x: number, y: number): boolean {
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

function inverseRotatePoint(
  x: number,
  y: number,
  size: number,
  rotation: QRCodeStylePrimitive['rotation'],
): {x: number; y: number} {
  switch (rotation) {
    case 90:
      return {x: y, y: size - x};
    case 180:
      return {x: size - x, y: size - y};
    case 270:
      return {x: size - y, y: x};
    default:
      return {x, y};
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

function fillRect(
  png: PNG,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGBColor,
): void {
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      const index = (png.width * row + column) << 2;
      png.data[index] = color.red;
      png.data[index + 1] = color.green;
      png.data[index + 2] = color.blue;
      png.data[index + 3] = 0xff;
    }
  }
}

function hexColorToRGB(value: QRCodeColorHex): RGBColor {
  const hex = value.slice(1);

  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
}
