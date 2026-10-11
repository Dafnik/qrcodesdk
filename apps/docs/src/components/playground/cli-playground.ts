import {atom, computed} from 'nanostores';

import {
  type QRCodeColor,
  type QRCodeMatrixOptions,
  type QRCodeSVGOptions,
  QRCodeSVGRenderer,
  QRCodeTextRenderer,
  type QRCodeTextRendererOptions,
  qrcode,
} from '@qrcodesdk/core';

import {createPackageManagerCommands} from '../../utils/package-manager-commands.mjs';
import {playgroundOptions} from './playground-options.ts';

export type CliLauncher = 'npm' | 'installed' | 'pnpm' | 'viteplus' | 'bun' | 'yarn';
export interface CliPlaygroundOptions extends QRCodeMatrixOptions {
  payload: string;
  launcher: CliLauncher;
  format: 'text' | 'svg';
  outputPath: string;
  moduleSize: number;
  quietZone: number;
  layout: 'compact' | 'full';
  ansi: 'off' | 'blocks' | 'background';
  foreground?: QRCodeColor;
  background?: QRCodeColor;
  ariaLabel?: string;
  title?: string;
}

export const defaultCliOptions: CliPlaygroundOptions = {
  payload: 'https://qrcodesdk.dev',
  launcher: 'npm',
  format: 'text',
  outputPath: 'qrcode.svg',
  moduleSize: 1,
  quietZone: 2,
  layout: 'compact',
  ansi: 'blocks',
  eci: false,
};
export const cliPlaygroundOptions = atom<CliPlaygroundOptions>({...defaultCliOptions});
export function updateCliOptions(patch: Partial<CliPlaygroundOptions>): void {
  cliPlaygroundOptions.set({...cliPlaygroundOptions.get(), ...patch});
}
export function resetCliOptions(): void {
  cliPlaygroundOptions.set({...defaultCliOptions});
}

export interface TerminalRun {
  text: string;
  foreground?: string;
  background?: string;
}

/** Split terminal output into fixed rows and cells without depending on font glyph metrics. */
export function createTerminalRows(runs: readonly TerminalRun[]): TerminalRun[][] {
  const rows: TerminalRun[][] = [[]];
  for (const run of runs) {
    for (const character of run.text) {
      if (character === '\n') rows.push([]);
      else {
        const row = rows[rows.length - 1]!;
        const previous = row.at(-1);
        if (
          previous?.text[0] === character &&
          previous.foreground === run.foreground &&
          previous.background === run.background
        ) {
          previous.text += character;
        } else row.push({...run, text: character});
      }
    }
  }
  // The CLI's final newline moves the cursor below the QR code; it is not another QR row.
  if (rows[rows.length - 1]!.length === 0) rows.pop();
  return rows;
}

/** Only interpret the true-color and reset SGR sequences emitted by the core renderer. */
export function parseTerminalRuns(text: string): TerminalRun[] {
  const runs: TerminalRun[] = [];
  // eslint-disable-next-line no-control-regex -- ANSI output contains the ESC control character.
  const sequence = /\u001b\[(0|(?:38|48);2;\d+;\d+;\d+)m/g;
  let foreground: string | undefined;
  let background: string | undefined;
  let offset = 0;
  for (const match of text.matchAll(sequence)) {
    if (match.index > offset)
      runs.push({text: text.slice(offset, match.index), foreground, background});
    if (match[1] === '0') {
      foreground = undefined;
      background = undefined;
    } else {
      const [kind, , red, green, blue] = match[1]!.split(';');
      const color = `rgb(${red}, ${green}, ${blue})`;
      if (kind === '38') foreground = color;
      else background = color;
    }
    offset = match.index + match[0].length;
  }
  if (offset < text.length) runs.push({text: text.slice(offset), foreground, background});
  return runs;
}

export function quoteShellArgument(value: string): string {
  if (value.includes('\0')) throw new Error('Command values cannot contain NUL characters.');
  return "'" + value.replaceAll("'", "'\"'\"'") + "'";
}

export function createCliSVGOptions(options: CliPlaygroundOptions): QRCodeSVGOptions {
  return {
    matrix: {
      mode: options.mode,
      errorCorrectionLevel: options.errorCorrectionLevel,
      version: options.version,
      mask: options.mask,
      eci: options.eci ?? false,
    },
    style: {
      moduleSize: options.moduleSize,
      quietZone: options.quietZone,
      foreground: options.foreground,
      background: options.background,
    },
    accessibility: {ariaLabel: options.ariaLabel, title: options.title},
  };
}

export function createCliTextOptions(options: CliPlaygroundOptions): QRCodeTextRendererOptions {
  const style = {moduleSize: options.moduleSize, quietZone: options.quietZone};
  if (options.ansi === 'background') {
    return {
      style,
      ansi: {mode: 'background', foreground: options.foreground, background: options.background},
    };
  }
  return {
    style,
    layout: options.layout,
    ansi:
      options.ansi === 'off'
        ? false
        : {
            mode: 'blocks',
            foreground: options.foreground,
            background: options.background,
          },
  };
}

export function generateCliCommand(options: CliPlaygroundOptions): string {
  const args = ['--payload', quoteShellArgument(options.payload)];
  if (options.format === 'svg')
    args.push('--format', 'svg', '--output', quoteShellArgument(options.outputPath));
  if (options.mode !== undefined) args.push('--mode', options.mode);
  if (options.errorCorrectionLevel !== undefined && options.errorCorrectionLevel !== 'M')
    args.push('--error-correction', options.errorCorrectionLevel);
  if (options.version !== undefined) args.push('--version', String(options.version));
  if (options.mask !== undefined) args.push('--mask', String(options.mask));
  if (options.eci) args.push('--eci');
  if (options.moduleSize !== defaultCliOptions.moduleSize)
    args.push('--module-size', String(options.moduleSize));
  if (options.quietZone !== defaultCliOptions.quietZone)
    args.push('--quiet-zone', String(options.quietZone));
  if (options.format === 'text') {
    if (options.ansi !== 'background' && options.layout !== defaultCliOptions.layout)
      args.push('--layout', options.layout);
    // Omitted block styling follows the CLI's terminal and NO_COLOR detection.
    if (options.ansi !== defaultCliOptions.ansi) args.push('--ansi', options.ansi);
  }
  if (options.format === 'svg' || options.ansi !== 'off') {
    if (
      options.foreground !== undefined &&
      !['#000000', '#000000ff'].includes(options.foreground.toLowerCase())
    )
      args.push('--foreground', quoteShellArgument(options.foreground));
    if (
      options.background !== undefined &&
      !['#ffffff', '#ffffffff'].includes(options.background.toLowerCase())
    )
      args.push('--background', quoteShellArgument(options.background));
  }
  if (options.format === 'svg') {
    if (options.ariaLabel) args.push('--aria-label', quoteShellArgument(options.ariaLabel));
    if (options.title) args.push('--title', quoteShellArgument(options.title));
  }
  if (options.launcher === 'installed') return ['qrc', ...args].join(' ');
  const launcher = createPackageManagerCommands({
    packages: ['@qrcodesdk/cli'],
    mode: 'dlx',
    command: 'qrc',
    args,
  }).find(({id}) => id === options.launcher);
  if (!launcher) throw new Error('Choose a supported command launcher.');
  return launcher.command;
}

export type CliPreview =
  | {
      state: 'ready';
      command: string;
      svgOptions: QRCodeSVGOptions;
      text?: string;
      runs: TerminalRun[];
    }
  | {state: 'error'; message: string};

export function createCliPreview(options: CliPlaygroundOptions): CliPreview {
  try {
    if (!['text', 'svg'].includes(options.format)) throw new Error('Choose text or SVG output.');
    if (!['off', 'blocks', 'background'].includes(options.ansi))
      throw new Error('Choose a supported ANSI mode.');
    if (!Number.isSafeInteger(options.moduleSize) || options.moduleSize < 1)
      throw new Error('Module size must be a positive integer.');
    if (!Number.isSafeInteger(options.quietZone) || options.quietZone < 0)
      throw new Error('Quiet zone must be a non-negative integer.');
    for (const color of [options.foreground, options.background]) {
      if (color !== undefined && !/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(color))
        throw new Error('Colors must be RGB or RGBA hex values.');
    }
    if (options.format === 'svg' && !options.outputPath.trim())
      throw new Error('Enter an SVG output path.');
    const command = generateCliCommand(options);
    const svgOptions = createCliSVGOptions(options);
    const builder = qrcode(options.payload).options(svgOptions.matrix);
    // Bound allocation in the browser without restricting the real CLI's capabilities.
    const matrix = builder.matrix();
    const size = (matrix.length + options.quietZone * 2) * options.moduleSize;
    if (size > 512)
      throw new Error(
        'This QR code exceeds the browser preview limit of 512 modules per side. Reduce module size or quiet zone.',
      );
    if (options.format === 'svg') {
      builder.render(
        QRCodeSVGRenderer({style: svgOptions.style, accessibility: svgOptions.accessibility}),
      );
      return {state: 'ready', command, svgOptions, runs: []};
    }
    const text = `${builder.render(QRCodeTextRenderer(createCliTextOptions(options)))}\n`;
    return {state: 'ready', command, svgOptions, text, runs: parseTerminalRuns(text)};
  } catch (error) {
    return {state: 'error', message: error instanceof Error ? error.message : String(error)};
  }
}

export const cliPreview = computed(
  [cliPlaygroundOptions, playgroundOptions],
  (options, framework) => (framework.packageName === 'cli' ? createCliPreview(options) : undefined),
);
