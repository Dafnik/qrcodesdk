import {QRCodeError} from './error';
import {
  assertKnownKeys,
  calculateQRCodeOutputSize,
  parseQRCodeColor,
  resolveQRCodeTextStyle,
  resolveQRCodeVisualStyle,
} from './styling';
import type {QRCodeColor, QRCodeMatrix, QRCodeRenderer, QRCodeTextStyle} from './types';

const ANSI_RESET = '\u001b[0m';

export type QRCodeTextANSIOptions = {
  readonly mode?: 'blocks';
  readonly foreground?: QRCodeColor;
  readonly background?: QRCodeColor;
};

export type QRCodeTextANSIBackgroundOptions = {
  readonly mode: 'background';
  readonly foreground?: QRCodeColor;
  readonly background?: QRCodeColor;
};

export type QRCodeTextRendererOptions =
  | {
      readonly style?: QRCodeTextStyle;
      readonly layout?: 'compact' | 'full';
      readonly ansi?: boolean | QRCodeTextANSIOptions;
    }
  | {
      readonly style?: QRCodeTextStyle;
      readonly layout?: never;
      readonly ansi: QRCodeTextANSIBackgroundOptions;
    };

export function QRCodeTextRenderer(options?: QRCodeTextRendererOptions): QRCodeRenderer<string> {
  assertKnownKeys(options, 'options', ['style', 'layout', 'ansi']);
  const style = resolveQRCodeTextStyle(options?.style);
  const layout = options?.layout ?? 'compact';
  if (layout !== 'compact' && layout !== 'full') {
    throwInvalid('layout', 'compact or full', layout);
  }

  const ansi = resolveANSI(options?.ansi);
  if (
    ansi.mode === 'background' &&
    options &&
    'layout' in options &&
    options.layout !== undefined
  ) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      'QR code text layout is not supported when ANSI background mode is enabled',
      {details: {field: 'layout', value: options.layout}},
    );
  }

  return (matrix: QRCodeMatrix) => {
    const outputSize = calculateQRCodeOutputSize(matrix, style);
    if (ansi.mode === 'background') {
      return renderBackgroundANSI(matrix, outputSize, style.quietZone, style.moduleSize, ansi);
    }

    const rows =
      layout === 'compact'
        ? renderCompact(matrix, outputSize, style.quietZone, style.moduleSize)
        : renderFull(matrix, outputSize, style.quietZone, style.moduleSize);
    if (ansi.mode === 'none') return rows.join('\n');

    const prefix = `${ansiColor('38', ansi.foreground)}${ansiColor('48', ansi.background)}`;
    return rows.map((row) => `${prefix}${row}${ANSI_RESET}`).join('\n');
  };
}

type ResolvedANSI =
  | {mode: 'none'}
  | {mode: 'blocks'; foreground: ANSIColor; background: ANSIColor}
  | {mode: 'background'; foreground: ANSIColor; background: ANSIColor};

type ANSIColor = readonly [red: number, green: number, blue: number];

function resolveANSI(ansi: QRCodeTextRendererOptions['ansi'] | undefined): ResolvedANSI {
  if (ansi === undefined || ansi === false) return {mode: 'none'};
  if (ansi !== true && (typeof ansi !== 'object' || ansi === null)) {
    throwInvalid('ansi', 'a boolean or ANSI options object', ansi);
  }
  if (ansi !== true) assertKnownKeys(ansi, 'ansi', ['mode', 'foreground', 'background']);
  const mode = ansi === true ? 'blocks' : (ansi.mode ?? 'blocks');
  if (mode !== 'blocks' && mode !== 'background') {
    throwInvalid('ansi.mode', 'blocks or background', mode);
  }
  const colors = resolveQRCodeVisualStyle({
    foreground: ansi === true ? undefined : ansi.foreground,
    background: ansi === true ? undefined : ansi.background,
  });
  const background = compositeANSIColor(parseQRCodeColor(colors.background), [255, 255, 255]);
  const foreground = compositeANSIColor(parseQRCodeColor(colors.foreground), background);
  return {mode, foreground, background};
}

function renderBackgroundANSI(
  matrix: QRCodeMatrix,
  outputSize: number,
  quietZone: number,
  moduleSize: number,
  ansi: Extract<ResolvedANSI, {mode: 'background'}>,
): string {
  const dark = ansiColor('48', ansi.foreground);
  const light = ansiColor('48', ansi.background);
  const rows: string[] = [];
  for (let row = 0; row < outputSize; row++) {
    const line: string[] = [];
    for (let column = 0; column < outputSize; column++) {
      line.push(isDark(matrix, row, column, quietZone, moduleSize) ? dark : light, '  ');
    }
    line.push(ANSI_RESET);
    rows.push(line.join(''));
  }
  return rows.join('\n');
}

function renderFull(
  matrix: QRCodeMatrix,
  outputSize: number,
  quietZone: number,
  moduleSize: number,
): string[] {
  const rows: string[] = [];
  for (let row = 0; row < outputSize; row++) {
    let line = '';
    for (let column = 0; column < outputSize; column++) {
      line += isDark(matrix, row, column, quietZone, moduleSize) ? '██' : '  ';
    }
    rows.push(line);
  }
  return rows;
}

function renderCompact(
  matrix: QRCodeMatrix,
  outputSize: number,
  quietZone: number,
  moduleSize: number,
): string[] {
  const rows: string[] = [];
  for (let row = 0; row < outputSize; row += 2) {
    let line = '';
    for (let column = 0; column < outputSize; column++) {
      line += compactCharacter(
        isDark(matrix, row, column, quietZone, moduleSize),
        isDark(matrix, row + 1, column, quietZone, moduleSize),
      );
    }
    rows.push(line);
  }
  return rows;
}

function ansiColor(code: '38' | '48', color: ANSIColor): string {
  const [red, green, blue] = color;
  return `\u001b[${code};2;${red};${green};${blue}m`;
}

function compositeANSIColor(
  [red, green, blue, alpha]: readonly [number, number, number, number],
  background: ANSIColor,
): ANSIColor {
  const opacity = alpha / 255;
  return [
    Math.round(red * opacity + background[0] * (1 - opacity)),
    Math.round(green * opacity + background[1] * (1 - opacity)),
    Math.round(blue * opacity + background[2] * (1 - opacity)),
  ];
}

function isDark(
  matrix: QRCodeMatrix,
  scaledRow: number,
  scaledColumn: number,
  quietZone: number,
  moduleSize: number,
): boolean {
  const row = Math.floor(scaledRow / moduleSize) - quietZone;
  const column = Math.floor(scaledColumn / moduleSize) - quietZone;
  return row >= 0 && row < matrix.length && column >= 0 && matrix[row]?.[column] === 1;
}

function compactCharacter(upperDark: boolean, lowerDark: boolean): string {
  if (upperDark && lowerDark) return '█';
  if (upperDark) return '▀';
  if (lowerDark) return '▄';
  return ' ';
}

function throwInvalid(field: string, expected: string, value: unknown): never {
  throw new QRCodeError(
    'INVALID_OPTIONS',
    `QR code ${field} must be ${expected}, received ${String(value)}`,
    {details: {field, value}},
  );
}
