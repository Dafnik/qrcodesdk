import {cancel, isCancel, select, text} from '@clack/prompts';
import {Command, CommanderError, Option} from 'commander';
import {writeFile as writeFileDefault} from 'node:fs/promises';
import process from 'node:process';
import {styleText} from 'node:util';

import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMatrixOptions,
  QRCodeSVGRenderer,
  QRCodeTextRenderer,
  type QRCodeVersion,
  type QRCodeVisualStyle,
  qrcode,
} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

declare const __QRCODESDK_CLI_VERSION__: string;

type OutputFormat = 'text' | 'svg' | 'png';

type RawCliOptions = {
  readonly input?: string;
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
    readonly input: string;
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

export async function runCli(argv: readonly string[], runtime: CliRuntime = {}): Promise<number> {
  const stdout = runtime.stdout ?? process.stdout;
  const stderr = runtime.stderr ?? process.stderr;
  const command = createCommand();

  try {
    await command.parseAsync(['node', 'qrc', ...argv], {from: 'node'});
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      stderr.write(`${styleText('red', 'Error:')} ${error.message}\n`);
      return 1;
    }

    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${styleText('red', 'Error:')} ${message}\n`);
    return 1;
  }

  function createCommand(): Command {
    const program = new Command();

    program
      .name('qrc')
      .showSuggestionAfterError(true)
      .showHelpAfterError(true)
      .usage('[data] [options]')
      .summary('generate QR codes from a terminal.')
      .description(
        '@qrcodesdk/cli generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact UTF-8 terminal text or writes SVG and PNG files.',
      )
      .version(__QRCODESDK_CLI_VERSION__, '-V', 'Print the installed CLI package version')
      .argument('[data]', 'Positional QR code input data')
      .option('--input <value>', 'QR code input data, equivalent to positional [data]')
      .option('--format <format>', 'Output format. Inferred from `.svg` or `.png` output paths')
      .option('-o, --output <path>', 'Required output path for SVG and PNG')
      .option('--mode <mode>', 'QR code data mode: numeric, alphanumeric, or octet')
      .option('--error-correction <level>', 'Error correction level: L, M, Q, or H')
      .option('--version <version>', 'Pin a QR code version from 1 to 40')
      .option('--mask <mask>', 'Pin a QR code mask from 0 to 7')
      .addOption(
        booleanOption(
          '--eci [boolean]',
          'Emit UTF-8 ECI assignment 26 for octet segments',
          'eci',
          false,
        ),
      )
      .option('--module-size <size>', 'Module size as a positive integer')
      .option('--quiet-zone <size>', 'Quiet zone as a non-negative integer')
      .option('--layout <layout>', 'Text layout: compact or full')
      .option('--ansi <mode>', 'ANSI mode: off, blocks, or background')
      .option('--foreground <hex>', 'Foreground color as #rrggbb or #rrggbbaa')
      .option('--background <hex>', 'Background color as #rrggbb or #rrggbbaa')
      .option('--aria-label <text>', 'SVG aria-label')
      .option('--title <text>', 'SVG title')
      .configureOutput({
        writeErr: (chunk) => stderr.write(chunk),
        writeOut: (chunk) => stdout.write(chunk),
      })
      .exitOverride()
      .action(async (positionalInput: string | undefined, rawOptions: RawCliOptions) => {
        const options = await resolveCliOptions(positionalInput, rawOptions, runtime);
        await render(options, runtime, stdout, stderr);
      });

    return program;
  }
}

async function resolveCliOptions(
  positionalInput: string | undefined,
  rawOptions: RawCliOptions,
  runtime: CliRuntime,
): Promise<ResolvedCliOptions> {
  const prompt = runtime.prompts ?? defaultPromptAdapter;
  const interactive = runtime.interactive ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const input = await resolveInput(positionalInput, rawOptions.input, interactive, prompt);
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
    input,
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

async function resolveInput(
  positionalInput: string | undefined,
  optionInput: string | undefined,
  interactive: boolean,
  prompt: PromptAdapter,
): Promise<string> {
  if (
    positionalInput !== undefined &&
    optionInput !== undefined &&
    positionalInput !== optionInput
  ) {
    throw new CliError(
      'Pass QR input either as [data] or --input, not both with different values.',
    );
  }

  const input = optionInput ?? positionalInput;
  if (input !== undefined) return input;

  if (!interactive) {
    throw new CliError('Missing QR input. Pass [data] or --input.');
  }

  const value = await prompt.text({
    message: 'QR input',
    placeholder: 'https://qrcodesdk.dev',
  });
  return requiredPromptText(value, prompt, 'Missing QR input. Pass [data] or --input.');
}

async function resolveFormat(
  optionFormat: string | undefined,
  output: string | undefined,
  interactive: boolean,
  prompt: PromptAdapter,
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

  const value = await prompt.select({
    message: 'Output format',
    options: [
      {value: 'svg', label: 'SVG file'},
      {value: 'png', label: 'PNG file'},
    ],
  });

  return requiredEnum(promptString(value, prompt), fileOutputFormats, 'format');
}

async function resolveOutput(
  format: OutputFormat,
  output: string | undefined,
  interactive: boolean,
  prompt: PromptAdapter,
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

  const value = await prompt.text({
    message: `${format.toUpperCase()} output path`,
    placeholder: `qrcode.${format}`,
  });

  return requiredPromptText(value, prompt, `Missing --output for ${format} output.`);
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
  const builder = qrcode(options.input).config({
    mode: options.mode,
    errorCorrectionLevel: options.errorCorrectionLevel,
    version: options.version,
    mask: options.mask,
    eci: options.eci,
  });

  if (options.format === 'text') {
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

function booleanOption(
  flags: string,
  description: string,
  name: string,
  defaultValue?: boolean,
): Option {
  const option = new Option(flags, description).argParser((value) => requiredBoolean(value, name));
  return defaultValue === undefined ? option : option.default(defaultValue);
}

function requiredBoolean(value: string, name: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new CliError(`Invalid ${name}. Expected true or false.`);
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

const defaultPromptAdapter: PromptAdapter = {
  text,
  select,
  isCancel,
  cancel,
};
