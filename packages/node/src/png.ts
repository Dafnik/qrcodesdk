import {PNG} from 'pngjs';

import {
  type QRCodeColorHex,
  type QRCodeMatrix,
  type QRCodeRenderer,
  type QRCodeStylingOptions,
  calculateQRCodeRenderedSize,
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
    const modSize = styling.size;
    const margin = styling.margin;

    const lightColor = hexColorToRGB(styling.colors.colorLight);
    const darkColor = hexColorToRGB(styling.colors.colorDark);
    const n = matrix.length;
    const imageSize = calculateQRCodeRenderedSize(matrix, styling);

    const png = new PNG({width: imageSize, height: imageSize});
    fillRect(png, 0, 0, imageSize, imageSize, lightColor);

    for (let row = 0; row < n; row++) {
      const matrixRow = matrix[row]!;
      for (let column = 0; column < n; column++) {
        if (matrixRow[column]) {
          fillRect(
            png,
            modSize * (margin + column),
            modSize * (margin + row),
            modSize,
            modSize,
            darkColor,
          );
        }
      }
    }

    return PNG.sync.write(png);
  };
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
