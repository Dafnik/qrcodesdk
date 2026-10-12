import {writeFile as writeFileDefault} from 'node:fs/promises';
import process from 'node:process';
import {parseArgs, styleText} from 'node:util';

import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeVersion,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';

declare const __QRCODESDK_CLI_VERSION__: string;

type OutputFormat = 'text' | 'svg' | 'png';

type RawCliOptions = {
  readonly payload?: string;
  readonly format?: string;
  readonly output?: string;
  readonly mode?: string;
  readonly errorCorrection?: string;
  readonly version?: string;
  readonly mask?: string;
  readonly eci?: boolean;
  readonly moduleSize?: string;
  readonly quietZone?: string;
  readonly layout?: string;
  readonly ansi?: string;
  readonly foreground?: string;
  readonly background?: string;
  readonly ariaLabel?: string;
  readonly title?: string;
};

type ResolvedCliOptions = Readonly<
  QRCodeMatrixOptions & {
    readonly ariaLabel?: string;
    readonly title?: string;
    readonly payload: string;
    readonly format: OutputFormat;
    readonly output?: string;
    readonly layout: 'compact' | 'full';
    readonly ansi: false | 'blocks' | 'background';
    readonly style: QRCodeVisualStyle;
  }
>;

export type WritableTarget = {
  write(chunk: string | Uint8Array): unknown;
};

type PromptChoice = {
  readonly value: OutputFormat;
  readonly label: string;
};

type PromptAdapter = {
  text(options: {message: string; placeholder?: string}): Promise<string | symbol>;
  select(options: {message: string; options: PromptChoice[]}): Promise<OutputFormat | symbol>;
  isCancel(value: unknown): boolean;
  cancel(message: string): void;
};

export type CliRuntime = {
  readonly stdout?: WritableTarget;
  readonly stderr?: WritableTarget;
  readonly stdoutIsTTY?: boolean;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly interactive?: boolean;
  readonly writeFile?: (path: string, data: string | Uint8Array) => Promise<void>;
  readonly prompts?: PromptAdapter;
};

class CliError extends Error {}

const outputFormats = ['text', 'svg', 'png'] as const;
const fileOutputFormats = ['svg', 'png'] as const;
const modes = ['numeric', 'alphanumeric', 'octet'] as const;
const errorCorrectionLevels = ['L', 'M', 'Q', 'H'] as const;
const layouts = ['compact', 'full'] as const;
const ansiModes = ['off', 'blocks', 'background'] as const;

const stringOptions = [
  ['payload', 'value', 'QR code payload, equivalent to positional [payload]'],
  ['format', 'format', 'Output format. Inferred from `.svg` or `.png` output paths'],
  ['output', 'path', 'Required output path for SVG and PNG'],
  ['mode', 'mode', 'QR code mode: numeric, alphanumeric, or octet'],
  ['error-correction', 'level', 'Error correction level: L, M, Q, or H'],
  ['version', 'version', 'Pin a QR code version from 1 to 40'],
  ['mask', 'mask', 'Pin a QR code mask from 0 to 7'],
  ['module-size', 'size', 'Module size as a positive integer'],
  ['quiet-zone', 'size', 'Quiet zone as a non-negative integer'],
  ['layout', 'layout', 'Text layout: compact or full'],
  ['ansi', 'mode', 'ANSI mode: off, blocks, or background'],
  ['foreground', 'hex', 'Foreground color as #rrggbb or #rrggbbaa'],
  ['background', 'hex', 'Background color as #rrggbb or #rrggbbaa'],
  ['aria-label', 'text', 'SVG aria-label'],
  ['title', 'text', 'SVG title'],
] as const;

export async function runCli(argv: readonly string[], runtime: CliRuntime = {}): Promise<number> {
  const stdout = runtime.stdout ?? process.stdout;
  const stderr = runtime.stderr ?? process.stderr;
  try {
    const {values, positionals, printVersion} = parseCommandLine(argv);
    if (values['help']) {
      stdout.write(helpText());
      return 0;
    }
    if (printVersion) {
      stdout.write(`${__QRCODESDK_CLI_VERSION__}\n`);
      return 0;
    }
    if (positionals.length > 1) throw new CliError('Expected at most one payload argument.');
    const rawOptions = Object.fromEntries(
      Object.entries(values).map(([name, value]) => [
        name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        value,
      ]),
    ) as RawCliOptions;
    const options = await resolveCliOptions(positionals[0], rawOptions, runtime);
    await render(options, runtime, stdout, stderr);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${styleText('red', 'Error:')} ${message}\n`);
    return 1;
  }
}

function parseCommandLine(argv: readonly string[]) {
  // parseArgs requires option-like string values to use the --option=value form.
  // Preserve dash-prefixed values accepted by the CLI, including payloads and negative numbers.
  const args: string[] = [];
  let printVersion = false;
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index]!;
    if (flag === '--') {
      args.push(...argv.slice(index));
      break;
    }
    // -V has no long form because --version pins the QR code version.
    if (flag === '-V') {
      printVersion = true;
      continue;
    }
    const value = argv[index + 1];
    if (
      (flag === '-o' || stringOptions.some(([name]) => flag === `--${name}`)) &&
      value !== undefined &&
      value.startsWith('-')
    ) {
      args.push(`${flag === '-o' ? '--output' : flag}=${value}`);
      index++;
    } else {
      args.push(flag);
    }
  }
  try {
    const parsed = parseArgs({
      args,
      allowPositionals: true,
      allowNegative: true,
      options: {
        ...Object.fromEntries(stringOptions.map(([name]) => [name, {type: 'string' as const}])),
        output: {type: 'string', short: 'o'},
        eci: {type: 'boolean'},
        help: {type: 'boolean', short: 'h'},
      },
    });
    return {...parsed, printVersion};
  } catch (error) {
    if (error instanceof Error && error.message.includes('argument missing')) {
      const option = stringOptions.find(([name]) => error.message.includes(`--${name}`));
      if (option) throw new CliError(`option '--${option[0]} <${option[1]}>' argument missing`);
    }
    throw error;
  }
}

function helpText(): string {
  const options = stringOptions.map(([name, argument, description]) => [
    `${name === 'output' ? '-o, ' : '    '}--${name} <${argument}>`,
    description,
  ]);
  options.push(
    ['    --eci', 'Emit UTF-8 ECI assignment 26 for octet segments'],
    ['    --no-eci', 'Do not emit UTF-8 ECI assignment 26'],
    ['-V', 'Print the installed CLI package version'],
    ['-h, --help', 'Show this help'],
  );
  return `Usage: qrc [payload] [options]\n\nGenerate QR codes as terminal text, SVG files, or PNG files.\n\nOptions:\n${options.map(([flag, description]) => `  ${flag!.padEnd(30)} ${description}`).join('\n')}\n`;
}

async function resolveCliOptions(
  positionalPayload: string | undefined,
  rawOptions: RawCliOptions,
  runtime: CliRuntime,
): Promise<ResolvedCliOptions> {
  const prompt = runtime.prompts;
  const interactive = runtime.interactive ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const payload = await resolvePayload(positionalPayload, rawOptions.payload, interactive, prompt);
  const format = await resolveFormat(rawOptions.format, rawOptions.output, interactive, prompt);
  const output = await resolveOutput(format, rawOptions.output, interactive, prompt);
  const style = resolveStyle(rawOptions);
  const environment = runtime.environment ?? process.env;
  const stdoutIsTTY = runtime.stdoutIsTTY ?? process.stdout.isTTY === true;
  const defaultANSI = !('NO_COLOR' in environment) && stdoutIsTTY ? 'blocks' : false;
  const ansiOption =
    rawOptions.ansi === undefined ? undefined : requiredEnum(rawOptions.ansi, ansiModes, 'ansi');
  const ansi = ansiOption === undefined ? defaultANSI : ansiOption === 'off' ? false : ansiOption;
  if (ansi === 'background' && rawOptions.layout !== undefined) {
    throw new CliError('--layout cannot be combined with --ansi background.');
  }

  return {
    payload,
    format,
    output,
    layout:
      rawOptions.layout === undefined
        ? 'compact'
        : requiredEnum(rawOptions.layout, layouts, 'layout'),
    ansi,
    mode: optionalEnum(rawOptions.mode, modes, 'mode'),
    errorCorrectionLevel: optionalErrorCorrectionLevel(rawOptions.errorCorrection),
    version: optionalIntegerInRange(rawOptions.version, 'version', 1, 40) as
      QRCodeVersion | undefined,
    mask: optionalIntegerInRange(rawOptions.mask, 'mask', 0, 7) as QRCodeMask | undefined,
    eci: rawOptions.eci ?? false,
    style,
    ariaLabel: rawOptions.ariaLabel,
    title: rawOptions.title,
  };
}

async function resolvePayload(
  positionalPayload: string | undefined,
  optionPayload: string | undefined,
  interactive: boolean,
  prompt: PromptAdapter | undefined,
): Promise<string> {
  if (
    positionalPayload !== undefined &&
    optionPayload !== undefined &&
    positionalPayload !== optionPayload
  ) {
    throw new CliError(
      'Pass QR payload either as [payload] or --payload, not both with different values.',
    );
  }

  const payload = optionPayload ?? positionalPayload;
  if (payload !== undefined) return payload;

  if (!interactive) {
    throw new CliError('Missing QR payload. Pass [payload] or --payload.');
  }

  const adapter = prompt ?? (await import('./prompts'));
  const value = await adapter.text({
    message: 'QR payload',
    placeholder: 'https://qrcodesdk.dev',
  });
  return requiredPromptText(value, adapter, 'Missing QR payload. Pass [payload] or --payload.');
}

async function resolveFormat(
  optionFormat: string | undefined,
  output: string | undefined,
  interactive: boolean,
  prompt: PromptAdapter | undefined,
): Promise<OutputFormat> {
  if (optionFormat !== undefined) return requiredEnum(optionFormat, outputFormats, 'format');
  if (output === undefined) return 'text';

  const inferred = inferFormatFromOutput(output);
  if (inferred !== undefined) return inferred;

  if (!interactive) {
    throw new CliError(
      'Unable to infer output format from --output. Pass --format text, svg, or png.',
    );
  }

  const adapter = prompt ?? (await import('./prompts'));
  const value = await adapter.select({
    message: 'Output format',
    options: [
      {value: 'svg', label: 'SVG file'},
      {value: 'png', label: 'PNG file'},
    ],
  });

  return requiredEnum(promptString(value, adapter), fileOutputFormats, 'format');
}

async function resolveOutput(
  format: OutputFormat,
  output: string | undefined,
  interactive: boolean,
  prompt: PromptAdapter | undefined,
): Promise<string | undefined> {
  if (format === 'text') {
    if (output !== undefined) {
      throw new CliError('--output is only supported with svg or png output.');
    }

    return undefined;
  }

  if (output !== undefined) return output;

  if (!interactive) {
    throw new CliError(`Missing --output for ${format} output.`);
  }

  const adapter = prompt ?? (await import('./prompts'));
  const value = await adapter.text({
    message: `${format.toUpperCase()} output path`,
    placeholder: `qrcode.${format}`,
  });

  return requiredPromptText(value, adapter, `Missing --output for ${format} output.`);
}

function requiredPromptText(
  value: string | symbol,
  prompt: PromptAdapter,
  message: string,
): string {
  const textValue = promptString(value, prompt);
  if (textValue === '') {
    throw new CliError(message);
  }

  return textValue;
}

function promptString(value: string | symbol, prompt: PromptAdapter): string {
  if (prompt.isCancel(value)) {
    prompt.cancel('Cancelled');
    throw new CliError('Cancelled.');
  }

  if (typeof value !== 'string') {
    throw new CliError('Invalid prompt response.');
  }

  return value;
}

function resolveStyle(rawOptions: RawCliOptions): QRCodeVisualStyle {
  return {
    moduleSize: optionalPositiveInteger(rawOptions.moduleSize, 'module-size') ?? 1,
    quietZone: optionalNonNegativeInteger(rawOptions.quietZone, 'quiet-zone') ?? 2,
    foreground: optionalHexColor(rawOptions.foreground, 'foreground'),
    background: optionalHexColor(rawOptions.background, 'background'),
  };
}

async function render(
  options: ResolvedCliOptions,
  runtime: CliRuntime,
  stdout: WritableTarget,
  stderr: WritableTarget,
): Promise<void> {
  const {qrcode} = await import('@qrcodesdk/core/matrix');
  const builder = qrcode(options.payload).options({
    mode: options.mode,
    errorCorrectionLevel: options.errorCorrectionLevel,
    version: options.version,
    mask: options.mask,
    eci: options.eci,
  });

  if (options.format === 'text') {
    const {QRCodeTextRenderer} = await import('@qrcodesdk/core/text');
    const textStyle = {
      moduleSize: options.style.moduleSize,
      quietZone: options.style.quietZone,
    };
    const textRenderer =
      options.ansi === 'background'
        ? QRCodeTextRenderer({
            style: textStyle,
            ansi: {
              mode: 'background',
              foreground: options.style.foreground,
              background: options.style.background,
            },
          })
        : QRCodeTextRenderer({
            style: textStyle,
            layout: options.layout,
            ansi:
              options.ansi === false
                ? false
                : {
                    mode: 'blocks',
                    foreground: options.style.foreground,
                    background: options.style.background,
                  },
          });
    stdout.write(`${builder.render(textRenderer)}\n`);
    return;
  }

  const writeFile = runtime.writeFile ?? writeFileDefault;

  if (options.format === 'svg') {
    const {QRCodeSVGRenderer} = await import('@qrcodesdk/core/svg');
    const svg = builder.render(
      QRCodeSVGRenderer({
        style: options.style,
        accessibility: {ariaLabel: options.ariaLabel, title: options.title},
      }),
    );

    await writeFile(requiredOutput(options), svg);
    stderr.write(`${styleText('green', 'Wrote')} ${requiredOutput(options)}\n`);
    return;
  }

  const {QRCodePNGRenderer} = await import('@qrcodesdk/node');
  const png = builder.render(QRCodePNGRenderer({style: options.style}));
  await writeFile(requiredOutput(options), png);
  stderr.write(`${styleText('green', 'Wrote')} ${requiredOutput(options)}\n`);
}

function requiredOutput(options: ResolvedCliOptions): string {
  if (options.output === undefined)
    throw new CliError(`Missing --output for ${options.format} output.`);
  return options.output;
}

function inferFormatFromOutput(output: string): OutputFormat | undefined {
  const normalized = output.toLowerCase();
  if (normalized.endsWith('.svg')) return 'svg';
  if (normalized.endsWith('.png')) return 'png';
  return undefined;
}

function optionalEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  name: string,
): T | undefined {
  if (value === undefined) return undefined;
  return requiredEnum(value, allowed, name);
}

function requiredEnum<T extends string>(value: string, allowed: readonly T[], name: string): T {
  if (allowed.includes(value as T)) return value as T;

  throw new CliError(`Invalid ${name}. Expected one of: ${allowed.join(', ')}.`);
}

function optionalErrorCorrectionLevel(
  value: string | undefined,
): QRCodeErrorCorrectionLevel | undefined {
  if (value === undefined) return undefined;
  return requiredEnum(value.toUpperCase(), errorCorrectionLevels, 'error-correction');
}

function optionalPositiveInteger(value: string | undefined, name: string): number | undefined {
  const parsed = optionalInteger(value, name);
  if (parsed === undefined) return undefined;
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new CliError(`Invalid ${name}. Expected a positive integer.`);
  }
  return parsed;
}

function optionalNonNegativeInteger(value: string | undefined, name: string): number | undefined {
  const parsed = optionalInteger(value, name);
  if (parsed === undefined) return undefined;
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new CliError(`Invalid ${name}. Expected a non-negative integer.`);
  }
  return parsed;
}

function optionalIntegerInRange(
  value: string | undefined,
  name: string,
  min: number,
  max: number,
): number | undefined {
  const parsed = optionalInteger(value, name);
  if (parsed === undefined) return undefined;

  if (parsed < min || parsed > max) {
    throw new CliError(`Invalid ${name}. Expected an integer from ${min} to ${max}.`);
  }

  return parsed;
}

function optionalInteger(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!/^-?\d+$/.test(value)) throw new CliError(`Invalid ${name}. Expected an integer.`);
  return Number.parseInt(value, 10);
}

function optionalHexColor(value: string | undefined, name: string): `#${string}` | undefined {
  if (value === undefined) return undefined;
  if (!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(value)) {
    throw new CliError(`Invalid ${name}. Expected an RGB or RGBA hex color like #111111.`);
  }

  return value as `#${string}`;
}
