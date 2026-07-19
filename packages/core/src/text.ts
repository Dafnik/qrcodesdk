import {parseQRCodeStylingOptions} from './styling';
import type {QRCodeMatrix, QRCodeRenderer, QRCodeStylingOptions} from './types';

const ANSI_BLACK_BACKGROUND = '\u001b[48;2;0;0;0m';
const ANSI_WHITE_BACKGROUND = '\u001b[48;2;255;255;255m';
const ANSI_RESET = '\u001b[0m';

export type QRCodeTextRendererOptions = Pick<QRCodeStylingOptions, 'size' | 'margin'> & {
  small?: boolean;
};

export function QRCodeTextRenderer(options?: QRCodeTextRendererOptions): QRCodeRenderer<string> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const modSize = styling.size;
    const margin = styling.margin;

    validateTextGeometry(modSize, margin);

    const moduleCount = matrix.length + 2 * margin;
    const scaledSize = moduleCount * modSize;

    if (options?.small === true) {
      return renderSmallText(matrix, scaledSize, margin, modSize);
    }

    return renderText(matrix, scaledSize, margin, modSize);
  };
}

function renderText(
  matrix: QRCodeMatrix,
  scaledSize: number,
  margin: number,
  modSize: number,
): string {
  const rows: string[] = [];

  for (let row = 0; row < scaledSize; row++) {
    const line: string[] = [];

    for (let column = 0; column < scaledSize; column++) {
      const background = isScaledModuleDark(matrix, row, column, margin, modSize)
        ? ANSI_BLACK_BACKGROUND
        : ANSI_WHITE_BACKGROUND;

      line.push(background, '  ');
    }

    line.push(ANSI_RESET);
    rows.push(line.join(''));
  }

  return rows.join('\n');
}

function renderSmallText(
  matrix: QRCodeMatrix,
  scaledSize: number,
  margin: number,
  modSize: number,
): string {
  const rows: string[] = [];

  for (let row = 0; row < scaledSize; row += 2) {
    const line: string[] = [];

    for (let column = 0; column < scaledSize; column++) {
      line.push(
        compactModuleCharacter(
          isScaledModuleDark(matrix, row, column, margin, modSize),
          isScaledModuleDark(matrix, row + 1, column, margin, modSize),
        ),
      );
    }

    rows.push(line.join(''));
  }

  return rows.join('\n');
}

function isScaledModuleDark(
  matrix: QRCodeMatrix,
  scaledRow: number,
  scaledColumn: number,
  margin: number,
  modSize: number,
): boolean {
  const matrixRow = Math.floor(scaledRow / modSize) - margin;
  const matrixColumn = Math.floor(scaledColumn / modSize) - margin;

  return (
    matrixRow >= 0 &&
    matrixRow < matrix.length &&
    matrixColumn >= 0 &&
    matrixColumn < matrix.length &&
    matrix[matrixRow]![matrixColumn] === 1
  );
}

function compactModuleCharacter(upperDark: boolean, lowerDark: boolean): string {
  if (upperDark && lowerDark) return '█';
  if (upperDark) return '▀';
  if (lowerDark) return '▄';
  return ' ';
}

function validateTextGeometry(modSize: number, margin: number): void {
  if (!Number.isInteger(modSize) || modSize <= 0) {
    throw new Error(`Text QR code size must be a positive integer, received ${modSize}`);
  }

  if (!Number.isInteger(margin) || margin < 0) {
    throw new Error(`Text QR code margin must be a non-negative integer, received ${margin}`);
  }
}
