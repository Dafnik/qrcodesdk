import {QRCodeError} from './error';
import {assertKnownKeys, throwInvalid} from './options';
import {
  calculateQRCodeOutputSize,
  parseQRCodeColor,
  resolveQRCodeTextStyle,
  validateColor,
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
  const {moduleSize, quietZone} = resolveQRCodeTextStyle(options?.style);
  const layout = options?.layout ?? 'compact';
  if (layout !== 'compact' && layout !== 'full') {
    throwInvalid('layout', 'compact or full', layout);
  }

  const ansi = options?.ansi === undefined ? false : options.ansi;
  if (typeof ansi !== 'boolean' && (typeof ansi !== 'object' || ansi === null)) {
    throwInvalid('ansi', 'a boolean or ANSI options object', ansi);
  }
  const ansiOptions = typeof ansi === 'object' ? ansi : {};
  assertKnownKeys(ansiOptions, 'ansi', ['mode', 'foreground', 'background']);
  const mode = ansiOptions.mode ?? 'blocks';
  if (mode !== 'blocks' && mode !== 'background') {
    throwInvalid('ansi.mode', 'blocks or background', mode);
  }
  const foregroundColor = ansiOptions.foreground ?? '#000000';
  const backgroundColor = ansiOptions.background ?? '#ffffff';
  validateColor('style.foreground', foregroundColor);
  validateColor('style.background', backgroundColor);
  const background = compositeANSIColor(parseQRCodeColor(backgroundColor), [255, 255, 255]);
  const foreground = compositeANSIColor(parseQRCodeColor(foregroundColor), background);
  const backgroundOnly = ansi !== false && mode === 'background';
  if (backgroundOnly && options?.layout !== undefined) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      'QR code text layout is not supported when ANSI background mode is enabled',
      {details: {field: 'layout', value: options.layout}},
    );
  }

  const compact = !backgroundOnly && layout === 'compact';
  const dark = backgroundOnly ? `${ansiColor('48', foreground)}  ` : '██';
  const light = backgroundOnly ? `${ansiColor('48', background)}  ` : '  ';
  const prefix =
    ansi !== false && !backgroundOnly
      ? `${ansiColor('38', foreground)}${ansiColor('48', background)}`
      : '';
  const suffix = ansi === false ? '' : ANSI_RESET;

  return (matrix: QRCodeMatrix) => {
    const outputSize = calculateQRCodeOutputSize(matrix, {moduleSize, quietZone});
    const darkModules = (scaledRow: number): Uint8Array => {
      const modules = new Uint8Array(outputSize);
      const row = Math.floor(scaledRow / moduleSize) - quietZone;
      const matrixRow = row >= 0 ? matrix[row] : undefined;
      for (let column = 0; matrixRow && column < outputSize; column++) {
        const matrixColumn = Math.floor(column / moduleSize) - quietZone;
        modules[column] = +(matrixColumn >= 0 && matrixRow[matrixColumn] === 1);
      }
      return modules;
    };
    const rows: string[] = [];
    for (let row = 0; row < outputSize; row += compact ? 2 : 1) {
      const upper = darkModules(row);
      const lower = compact ? darkModules(row + 1) : upper;
      let line = prefix;
      for (let column = 0; column < outputSize; column++) {
        line += compact
          ? ' ▀▄█'[upper[column]! | (lower[column]! << 1)]
          : upper[column]
            ? dark
            : light;
      }
      rows.push(line + suffix);
    }
    return rows.join('\n');
  };
}

type ANSIColor = readonly [red: number, green: number, blue: number];

function ansiColor(code: '38' | '48', [red, green, blue]: ANSIColor): string {
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
