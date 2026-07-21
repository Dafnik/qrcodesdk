import {calculateQRCodeRenderedSize, parseQRCodeStylingOptions} from './styling';
import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrix,
  QRCodeOptions,
  QRCodeRenderer,
  QRCodeStylingOptions,
} from './types';

export type QRCodeSVGRendererOptions = QRCodeStylingOptions & QRCodeAccessibilityOptions;
export type QRCodeSVGOptions = QRCodeOptions<QRCodeSVGRendererOptions>;

export function QRCodeSVGRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const margin = styling.margin;
    const colorLight = styling.colors.colorLight;
    const colorDark = styling.colors.colorDark;
    const n = matrix.length;
    const qrSize = n + 2 * margin;
    const size = calculateQRCodeRenderedSize(matrix, styling);
    const darkPath = matrixToPath(matrix, margin);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${qrSize} ${qrSize}" shape-rendering="crispEdges"`;

    if (options?.alt) svg += ` alt="${escapeAttributeValue(options.alt)}"`;
    if (options?.ariaLabel) svg += ` aria-label="${escapeAttributeValue(options.ariaLabel)}"`;
    if (options?.title) svg += ` title="${escapeAttributeValue(options.title)}"`;

    svg += `><path fill="${escapeAttributeValue(colorLight)}" d="M0 0h${qrSize}v${qrSize}H0z"/>`;
    if (darkPath) {
      svg += `<path stroke="${escapeAttributeValue(colorDark)}" d="${darkPath}"/>`;
    }

    return `${svg}</svg>`;
  };
}

function escapeAttributeValue(value: string): string {
  return value.replace(/[&"<>]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case '<':
        return '&lt;';
      default:
        return '&gt;';
    }
  });
}

function matrixToPath(matrix: QRCodeMatrix, margin: number): string {
  let path = '';
  const matrixSize = matrix.length;

  for (let row = 0; row < matrixSize; row++) {
    let lastRunEnd: number | undefined;
    const matrixRow = matrix[row]!;
    const rowSize = matrixRow.length;

    for (let column = 0; column < rowSize; column++) {
      if (!matrixRow[column]) continue;

      const start = column;
      while (column + 1 < rowSize && matrixRow[column + 1]) {
        column++;
      }

      const runLength = column - start + 1;
      if (lastRunEnd === undefined) {
        path += `M${margin + start} ${margin + row + 0.5}`;
      } else {
        path += `m${start - lastRunEnd} 0`;
      }
      path += `h${runLength}`;
      lastRunEnd = column + 1;
    }
  }

  return path;
}
