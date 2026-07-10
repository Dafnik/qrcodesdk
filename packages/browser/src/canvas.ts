import {
  type QRCodeMatrix,
  type QRCodeRenderer,
  type QRCodeStylingOptions,
  parseQRCodeStylingOptions,
} from '@qrcodesdk/core';

import {getRenderedSize, validatePixelGeometry} from './geometry';

export type QRCodeCanvasRendererOptions = QRCodeStylingOptions;

export function QRCodeCanvasRenderer(
  options?: QRCodeCanvasRendererOptions,
): QRCodeRenderer<HTMLCanvasElement> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const modSize = styling.size;
    const margin = styling.margin;
    validatePixelGeometry('Canvas', modSize, margin);

    const imageSize = getRenderedSize(matrix, modSize, margin);
    const canvas = document.createElement('canvas');
    canvas.width = imageSize;
    canvas.height = imageSize;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas QR code renderer requires a 2D canvas context');
    }

    context.fillStyle = styling.colors.colorLight;
    context.fillRect(0, 0, imageSize, imageSize);

    context.fillStyle = styling.colors.colorDark;
    for (let row = 0; row < matrix.length; row++) {
      const matrixRow = matrix[row]!;
      for (let column = 0; column < matrixRow.length; column++) {
        if (matrixRow[column]) {
          context.fillRect(modSize * (margin + column), modSize * (margin + row), modSize, modSize);
        }
      }
    }

    return canvas;
  };
}
