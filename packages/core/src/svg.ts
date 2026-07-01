import {parseQRCodeStylingOptions} from './styling';
import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrix,
  QRCodeRenderer,
  QRCodeStylingOptions,
} from './types';

export type QRCodeSVGRendererOptions = QRCodeStylingOptions & QRCodeAccessibilityOptions;

export function SVGQRCodeRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const modSize = styling.size;
    const margin = styling.margin;
    const colorLight = styling.colors.colorLight;
    const colorDark = styling.colors.colorDark;
    const n = matrix.length;
    const qrSize = n + 2 * margin;
    const size = modSize * qrSize;
    const darkPath = matrixToPath(matrix, margin);
    const attrs = [
      'xmlns="http://www.w3.org/2000/svg"',
      `width="${size}"`,
      `height="${size}"`,
      `viewBox="0 0 ${qrSize} ${qrSize}"`,
      'shape-rendering="crispEdges"',
      options?.alt ? `alt="${options.alt}"` : undefined,
      options?.ariaLabel ? `aria-label="${options.ariaLabel}"` : undefined,
      options?.title ? `title="${options.title}"` : undefined,
    ].filter((attr) => attr !== undefined);

    return [
      `<svg ${attrs.join(' ')}>`,
      `<path fill="${colorLight}" d="M0 0h${qrSize}v${qrSize}H0z"/>`,
      darkPath ? `<path stroke="${colorDark}" d="${darkPath}"/>` : '',
      '</svg>',
    ].join('');
  };
}

function matrixToPath(matrix: QRCodeMatrix, margin: number): string {
  const path: string[] = [];

  for (let row = 0; row < matrix.length; row++) {
    let lastRunEnd: number | undefined;

    for (let column = 0; column < matrix[row].length; column++) {
      if (!matrix[row][column]) continue;

      const start = column;
      while (column + 1 < matrix[row].length && matrix[row][column + 1]) {
        column++;
      }

      const runLength = column - start + 1;
      if (lastRunEnd === undefined) {
        path.push(`M${margin + start} ${margin + row + 0.5}`);
      } else {
        path.push(`m${start - lastRunEnd} 0`);
      }
      path.push(`h${runLength}`);
      lastRunEnd = column + 1;
    }
  }

  return path.join('');
}
