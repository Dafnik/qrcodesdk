import {calculateQRCodeRenderedSize, parseQRCodeStylingOptions} from './styling';
import type {QRCodeColorHex, QRCodeMatrix, QRCodeRenderer, QRCodeStylingOptions} from './types';

const ANSI_RESET = '\u001b[0m';

export type QRCodeTextRendererOptions = Pick<QRCodeStylingOptions, 'size' | 'margin' | 'colors'> & {
  small?: boolean;
  ansiColors?: boolean;
  onlyAnsiColors?: boolean;
};

export function QRCodeTextRenderer(options?: QRCodeTextRendererOptions): QRCodeRenderer<string> {
  return (matrix: QRCodeMatrix) => {
    const styling = parseQRCodeStylingOptions(options);
    const modSize = styling.size;
    const margin = styling.margin;

    const scaledSize = calculateQRCodeRenderedSize(matrix, styling);

    if (options?.onlyAnsiColors === true) {
      if (options.ansiColors === false) {
        throw new Error('Text QR code onlyAnsiColors requires ansiColors to be enabled');
      }

      return renderAnsiOnlyText(
        matrix,
        scaledSize,
        margin,
        modSize,
        styling.colors.colorDark,
        styling.colors.colorLight,
      );
    }

    const rows =
      (options?.small ?? true)
        ? renderSmallText(matrix, scaledSize, margin, modSize)
        : renderFullText(matrix, scaledSize, margin, modSize);

    if (options?.ansiColors !== true) return rows.join('\n');

    const ansiPrefix = createAnsiPrefix(styling.colors.colorDark, styling.colors.colorLight);
    return rows.map((row) => `${ansiPrefix}${row}${ANSI_RESET}`).join('\n');
  };
}

function renderAnsiOnlyText(
  matrix: QRCodeMatrix,
  scaledSize: number,
  margin: number,
  modSize: number,
  colorDark: QRCodeColorHex,
  colorLight: QRCodeColorHex,
): string {
  const darkBackground = createAnsiColor('48', hexColorToRGB(colorDark));
  const lightBackground = createAnsiColor('48', hexColorToRGB(colorLight));
  const rows: string[] = [];

  for (let row = 0; row < scaledSize; row++) {
    const line: string[] = [];

    for (let column = 0; column < scaledSize; column++) {
      line.push(
        isScaledModuleDark(matrix, row, column, margin, modSize) ? darkBackground : lightBackground,
        '  ',
      );
    }

    line.push(ANSI_RESET);
    rows.push(line.join(''));
  }

  return rows.join('\n');
}

function renderFullText(
  matrix: QRCodeMatrix,
  scaledSize: number,
  margin: number,
  modSize: number,
): string[] {
  const rows: string[] = [];

  for (let row = 0; row < scaledSize; row++) {
    const line: string[] = [];

    for (let column = 0; column < scaledSize; column++) {
      line.push(isScaledModuleDark(matrix, row, column, margin, modSize) ? '██' : '  ');
    }

    rows.push(line.join(''));
  }

  return rows;
}

function renderSmallText(
  matrix: QRCodeMatrix,
  scaledSize: number,
  margin: number,
  modSize: number,
): string[] {
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

  return rows;
}

function createAnsiPrefix(colorDark: QRCodeColorHex, colorLight: QRCodeColorHex): string {
  const darkForeground = createAnsiColor('38', hexColorToRGB(colorDark));
  const lightBackground = createAnsiColor('48', hexColorToRGB(colorLight));

  return `${darkForeground}${lightBackground}`;
}

function createAnsiColor(code: '38' | '48', color: [number, number, number]): string {
  return `\u001b[${code};2;${color.join(';')}m`;
}

function hexColorToRGB(color: QRCodeColorHex): [number, number, number] {
  const hexadecimal = color.slice(1);
  return [
    Number.parseInt(hexadecimal.slice(0, 2), 16),
    Number.parseInt(hexadecimal.slice(2, 4), 16),
    Number.parseInt(hexadecimal.slice(4, 6), 16),
  ];
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
