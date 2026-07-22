import {PNG} from 'pngjs';

import {
  type QRCodeColorHex,
  type QRCodeMatrix,
  type QRCodeRenderer,
  type QRCodeStylePrimitive,
  type QRCodeStylingOptions,
  createQRCodeStylePlan,
  parseQRCodeStylingOptions,
} from '@qrcodesdk/core';

export type QRCodePNGRendererOptions = QRCodeStylingOptions;

type RGBColor = {
  red: number;
  green: number;
  blue: number;
};

export function QRCodePNGRenderer(options?: QRCodePNGRendererOptions): QRCodeRenderer<Buffer> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const plan = createQRCodeStylePlan(matrix, styling);
    const scale = plan.renderedSize / plan.viewSize;
    const png = new PNG({width: plan.renderedSize, height: plan.renderedSize});
    fillRect(png, 0, 0, plan.renderedSize, plan.renderedSize, hexColorToRGB(plan.backgroundColor));

    for (const primitive of plan.primitives) rasterizePrimitive(png, primitive, scale);

    return PNG.sync.write(png);
  };
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
