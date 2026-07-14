import {cancel, isCancel, select, text} from '@clack/prompts';
import chalk from 'chalk';
import {Command, CommanderError} from 'commander';
import {writeFile as writeFileDefault} from 'node:fs/promises';
import process from 'node:process';

import {
  type QRCodeErrorCorrectionLevel,
  type QRCodeMask,
  type QRCodeMode,
  QRCodeSVGRenderer,
  type QRCodeStylingOptions,
  QRCodeTextRenderer,
  type QRCodeVersion,
  qrcode,
} from '@qrcodesdk/core';
import {QRCodePNGRenderer} from '@qrcodesdk/node';

type OutputFormat = 'text' | 'svg' | 'png';

type RawCliOptions = {
  readonly input?: string;
  readonly format?: string;
  readonly output?: string;
  readonly mode?: string;
  readonly errorCorrection?: string;
  readonly version?: string;
  readonly mask?: string;
  readonly size?: string;
  readonly margin?: string;
  readonly colorDark?: string;
  readonly colorLight?: string;
  readonly alt?: string;
  readonly ariaLabel?: string;
  readonly title?: string;
};

type ResolvedCliOptions = {
  readonly input: string;
  readonly format: OutputFormat;
  readonly output?: string;
  readonly mode?: QRCodeMode;
  readonly errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  readonly version?: QRCodeVersion;
  readonly mask?: QRCodeMask;
  readonly styling: QRCodeStylingOptions;
  readonly alt?: string;
  readonly ariaLabel?: string;
  readonly title?: string;
};

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
  readonly interactive?: boolean;
  readonly writeFile?: (path: string, data: string | Uint8Array) => Promise<void>;
  readonly prompts?: PromptAdapter;
};

class CliError extends Error {}

const outputFormats = ['text', 'svg', 'png'] as const;
const fileOutputFormats = ['svg', 'png'] as const;
const qrModes = ['numeric', 'alphanumeric', 'octet'] as const;
const errorCorrectionLevels = ['L', 'M', 'Q', 'H'] as const;

export async function runCli(argv: readonly string[], runtime: CliRuntime = {}): Promise<number> {
  const stdout = runtime.stdout ?? process.stdout;
  const stderr = runtime.stderr ?? process.stderr;
  const command = createCommand();

  try {
    await command.parseAsync(['node', 'qrc', ...argv], {from: 'node'});
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      stderr.write(`${chalk.red('Error:')} ${error.message}\n`);
      return 1;
    }

    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${chalk.red('Error:')} ${message}\n`);
    return 1;
  }

  function createCommand(): Command {
    const program = new Command();

    program
      .name('qrc')
      .showSuggestionAfterError(true)
      .showHelpAfterError(true)
      .summary('generate QR codes from a terminal.')
      .description(
        '@qrcodesdk/cli generates QR codes from a terminal, shell script, or CI job. The `qrc` command prints compact terminal text or writes SVG and PNG files.',
      )
      .argument('[data]', 'Positional QR code input data.')
      .option('--input <value>', 'QR code input data, equivalent to positional [data]')
      .option('--format <format>', 'Output format. Inferred from `.svg` or `.png` output paths.')
      .option('-o, --output <path>', 'Required output path for SVG and PNG.')
      .option('--mode <mode>', 'QR code data mode: numeric, alphanumeric, or octet')
      .option('--error-correction <level>', 'Error correction level: L, M, Q, or H')
      .option('--version <version>', 'Pin a QR code version from 1 to 40')
      .option('--mask <mask>', 'Pin a QR code mask from 0 to 7')
      .option('--size <size>', 'Module size as a positive integer')
      .option('--margin <margin>', 'Margin as a non-negative integer')
      .option('--color-dark <hex>', 'Dark module color as #rrggbb')
      .option('--color-light <hex>', 'Light module color as #rrggbb')
      .option('--alt <text>', 'SVG alt text')
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
  const styling = resolveStyling(rawOptions);

  return {
    input,
    format,
    output,
    mode: optionalEnum(rawOptions.mode, qrModes, 'mode'),
    errorCorrectionLevel: optionalErrorCorrectionLevel(rawOptions.errorCorrection),
    version: optionalIntegerInRange(rawOptions.version, 'version', 1, 40) as
      QRCodeVersion | undefined,
    mask: optionalIntegerInRange(rawOptions.mask, 'mask', 0, 7) as QRCodeMask | undefined,
    styling,
    alt: rawOptions.alt,
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

function resolveStyling(rawOptions: RawCliOptions): QRCodeStylingOptions {
  const size = optionalPositiveInteger(rawOptions.size, 'size') ?? 1;
  const margin = optionalNonNegativeInteger(rawOptions.margin, 'margin') ?? 2;
  const colorDark = optionalHexColor(rawOptions.colorDark, 'color-dark');
  const colorLight = optionalHexColor(rawOptions.colorLight, 'color-light');
  const colors =
    colorDark === undefined && colorLight === undefined
      ? undefined
      : {
          colorDark,
          colorLight,
        };

  return {
    size,
    margin,
    colors,
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
  });

  if (options.format === 'text') {
    stdout.write(`${builder.render(QRCodeTextRenderer(options.styling))}\n`);
    return;
  }

  const writeFile = runtime.writeFile ?? writeFileDefault;

  if (options.format === 'svg') {
    const svg = builder.render(
      QRCodeSVGRenderer({
        ...options.styling,
        alt: options.alt,
        ariaLabel: options.ariaLabel,
        title: options.title,
      }),
    );

    await writeFile(requiredOutput(options), svg);
    stderr.write(`${chalk.green('Wrote')} ${requiredOutput(options)}\n`);
    return;
  }

  const png = builder.render(QRCodePNGRenderer(options.styling));
  await writeFile(requiredOutput(options), png);
  stderr.write(`${chalk.green('Wrote')} ${requiredOutput(options)}\n`);
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
  if (parsed <= 0) throw new CliError(`Invalid ${name}. Expected a positive integer.`);
  return parsed;
}

function optionalNonNegativeInteger(value: string | undefined, name: string): number | undefined {
  const parsed = optionalInteger(value, name);
  if (parsed === undefined) return undefined;
  if (parsed < 0) throw new CliError(`Invalid ${name}. Expected a non-negative integer.`);
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
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new CliError(`Invalid ${name}. Expected a six-digit hex color like #111111.`);
  }

  return value as `#${string}`;
}

const defaultPromptAdapter: PromptAdapter = {
  text,
  select,
  isCancel,
  cancel,
};
