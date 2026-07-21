import {Buffer} from 'node:buffer';
import {beforeAll, describe, expect, test, vi} from 'vitest';

import packageJson from '../package.json' with {type: 'json'};
import {type CliRuntime, type WritableTarget, runCli} from '../src/run-cli';

const ANSI_PATTERN = new RegExp(`${String.fromCodePoint(27)}\\[[\\d;]+m`, 'g');

type WriteRecord = {
  readonly path: string;
  readonly data: string | Uint8Array;
};

function createWritable() {
  const chunks: Array<string | Uint8Array> = [];
  const target: WritableTarget = {
    write(chunk) {
      chunks.push(chunk);
      return true;
    },
  };

  return {
    target,
    text() {
      return chunks
        .map((chunk) => (typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')))
        .join('');
    },
  };
}

function createRuntime(): CliRuntime & {
  readonly files: WriteRecord[];
  readonly stdoutText: () => string;
  readonly stderrText: () => string;
} {
  const stdout = createWritable();
  const stderr = createWritable();
  const files: WriteRecord[] = [];

  return {
    stdout: stdout.target,
    stderr: stderr.target,
    interactive: false,
    async writeFile(path, data) {
      files.push({path, data});
    },
    files,
    stdoutText: stdout.text,
    stderrText: stderr.text,
  };
}

describe('runCli', () => {
  beforeAll(() => {
    vi.stubGlobal('__QRCODESDK_CLI_VERSION__', packageJson.version);
  });

  test('prints the CLI package version with -V', async () => {
    const runtime = createRuntime();

    await expect(runCli(['-V'], runtime)).resolves.toBe(0);

    expect(runtime.files).toEqual([]);
    expect(runtime.stdoutText()).toBe(`${packageJson.version}\n`);
    expect(runtime.stderrText()).toBe('');
  });

  test('prints terminal text to stdout by default', async () => {
    const runtime = createRuntime();

    await expect(runCli(['HELLO WORLD'], runtime)).resolves.toBe(0);

    expect(runtime.files).toEqual([]);
    expect(runtime.stdoutText()).toContain('\u001b[38;2;0;0;0m');
    expect(runtime.stdoutText()).toContain('\u001b[48;2;255;255;255m');
    expect(runtime.stdoutText()).toMatch(/[▀▄█]/);
    expect(runtime.stderrText()).toBe('');
  });

  test('accepts --input as an alternative to positional input', async () => {
    const runtime = createRuntime();

    await expect(runCli(['--input', 'HELLO WORLD'], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).toContain('\u001b[38;2;0;0;0m');
  });

  test.each([
    {name: 'default options', args: [], small: true, ansiColors: true},
    {
      name: '--small true and --ansi-colors true',
      args: ['--small', 'true', '--ansi-colors', 'true'],
      small: true,
      ansiColors: true,
    },
    {name: '--small false', args: ['--small', 'false'], small: false, ansiColors: true},
    {
      name: '--ansi-colors false',
      args: ['--ansi-colors', 'false'],
      small: true,
      ansiColors: false,
    },
    {
      name: '--small false and --ansi-colors false',
      args: ['--small', 'false', '--ansi-colors', 'false'],
      small: false,
      ansiColors: false,
    },
  ])('supports text renderer booleans with $name', async ({args, small, ansiColors}) => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--size', '1', '--margin', '0', ...args], runtime),
    ).resolves.toBe(0);

    const output = runtime.stdoutText();
    const visibleLines = output.replaceAll(ANSI_PATTERN, '').split('\n').slice(0, -1);

    expect(output.includes('\u001b[')).toBe(ansiColors);
    expect(visibleLines).toHaveLength(small ? 11 : 21);
    expect(Array.from(visibleLines[0]!)).toHaveLength(small ? 21 : 42);
  });

  test('supports negated aliases for false renderer booleans', async () => {
    const explicit = createRuntime();
    const equalsSyntax = createRuntime();
    const negated = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--small', 'false', '--ansi-colors', 'false'], explicit),
    ).resolves.toBe(0);
    await expect(
      runCli(['HELLO WORLD', '--small=false', '--ansi-colors=false'], equalsSyntax),
    ).resolves.toBe(0);
    await expect(runCli(['HELLO WORLD', '--no-small', '--no-ansi-colors'], negated)).resolves.toBe(
      0,
    );

    expect(equalsSyntax.stdoutText()).toBe(explicit.stdoutText());
    expect(negated.stdoutText()).toBe(explicit.stdoutText());
  });

  test('uses the last repeated renderer boolean option', async () => {
    const falseLast = createRuntime();
    const trueLast = createRuntime();
    const ansiFalseLast = createRuntime();
    const ansiTrueLast = createRuntime();
    const expectedFalse = createRuntime();
    const expectedTrue = createRuntime();

    await expect(runCli(['HELLO WORLD', '--small', 'true', '--no-small'], falseLast)).resolves.toBe(
      0,
    );
    await expect(runCli(['HELLO WORLD', '--no-small', '--small', 'true'], trueLast)).resolves.toBe(
      0,
    );
    await expect(runCli(['HELLO WORLD', '--small', 'false'], expectedFalse)).resolves.toBe(0);
    await expect(runCli(['HELLO WORLD', '--small', 'true'], expectedTrue)).resolves.toBe(0);
    await expect(
      runCli(['HELLO WORLD', '--ansi-colors', 'true', '--no-ansi-colors'], ansiFalseLast),
    ).resolves.toBe(0);
    await expect(
      runCli(['HELLO WORLD', '--no-ansi-colors', '--ansi-colors', 'true'], ansiTrueLast),
    ).resolves.toBe(0);

    expect(falseLast.stdoutText()).toBe(expectedFalse.stdoutText());
    expect(trueLast.stdoutText()).toBe(expectedTrue.stdoutText());
    expect(ansiFalseLast.stdoutText()).not.toContain('\u001b[');
    expect(ansiTrueLast.stdoutText()).toContain('\u001b[');
  });

  test('uses custom colors for ANSI terminal output', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--color-dark', '#1a2b3c', '--color-light', '#ddeeff'], runtime),
    ).resolves.toBe(0);

    expect(runtime.stdoutText()).toContain('\u001b[38;2;26;43;60m');
    expect(runtime.stdoutText()).toContain('\u001b[48;2;221;238;255m');
  });

  test('renders ANSI-background-only terminal output', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(
        [
          'HELLO WORLD',
          '--only-ansi-colors',
          '--size',
          '1',
          '--margin',
          '0',
          '--color-dark',
          '#1a2b3c',
          '--color-light',
          '#ddeeff',
        ],
        runtime,
      ),
    ).resolves.toBe(0);

    const output = runtime.stdoutText();
    const visibleLines = output.replaceAll(ANSI_PATTERN, '').split('\n').slice(0, -1);

    expect(output).toContain('\u001b[48;2;26;43;60m');
    expect(output).toContain('\u001b[48;2;221;238;255m');
    expect(output).not.toContain('\u001b[38;');
    expect(output).not.toMatch(/[▀▄█]/);
    expect(visibleLines).toHaveLength(21);
    expect(Array.from(visibleLines[0]!)).toHaveLength(42);
  });

  test('rejects disabling ANSI with ANSI-background-only output', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--only-ansi-colors', '--no-ansi-colors'], runtime),
    ).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('onlyAnsiColors requires ansiColors to be enabled');
  });

  test('rejects invalid and missing renderer boolean values', async () => {
    const invalid = createRuntime();
    const missing = createRuntime();

    await expect(runCli(['HELLO WORLD', '--small', 'yes'], invalid)).resolves.toBe(1);
    await expect(runCli(['HELLO WORLD', '--ansi-colors'], missing)).resolves.toBe(1);

    expect(invalid.stderrText()).toContain('Expected true or false');
    expect(missing.stderrText()).toContain("option '--ansi-colors <boolean>' argument missing");
  });

  test('rejects conflicting positional and option input', async () => {
    const runtime = createRuntime();

    await expect(runCli(['HELLO', '--input', 'WORLD'], runtime)).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('Pass QR input either as [data] or --input');
  });

  test('infers SVG output from the output extension', async () => {
    const runtime = createRuntime();

    await expect(runCli(['HELLO WORLD', '--output', 'code.svg'], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).toBe('');
    expect(runtime.files).toHaveLength(1);
    expect(runtime.files[0]).toMatchObject({path: 'code.svg'});
    expect(String(runtime.files[0]!.data)).toContain('<svg ');
    expect(runtime.stderrText()).toContain('Wrote code.svg');
  });

  test('writes PNG output as a binary buffer', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--format', 'png', '--output', 'code.png'], runtime),
    ).resolves.toBe(0);

    expect(runtime.files).toHaveLength(1);
    const data = runtime.files[0]!.data;
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(Buffer.from(data).subarray(1, 4).toString('utf8')).toBe('PNG');
  });

  test('rejects invalid range options', async () => {
    const runtime = createRuntime();

    await expect(runCli(['HELLO WORLD', '--version', '41'], runtime)).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('Expected an integer from 1 to 40');
  });

  test.each([
    {args: ['--size', '0'], message: 'Invalid size. Expected a positive integer.'},
    {args: ['--margin', '-1'], message: 'Invalid margin. Expected a non-negative integer.'},
    {
      args: ['--color-dark', '#fff'],
      message: 'Invalid color-dark. Expected a six-digit hex color like #111111.',
    },
    {
      args: ['--color-light', '#gggggg'],
      message: 'Invalid color-light. Expected a six-digit hex color like #111111.',
    },
  ])('rejects invalid styling options: $args', async ({args, message}) => {
    const runtime = createRuntime();

    await expect(runCli(['HELLO WORLD', ...args], runtime)).resolves.toBe(1);

    expect(runtime.stderrText()).toContain(message);
  });

  test('fails instead of prompting in non-interactive mode', async () => {
    const runtime = createRuntime();

    await expect(runCli([], runtime)).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('Missing QR input');
  });

  test('requires an explicit format when an output extension is ambiguous', async () => {
    const runtime = createRuntime();

    await expect(runCli(['HELLO WORLD', '--output', 'code.out'], runtime)).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('Unable to infer output format');
  });

  test('prompts for missing input in interactive mode', async () => {
    const runtime = {
      ...createRuntime(),
      interactive: true,
      prompts: {
        async text() {
          return 'HELLO WORLD';
        },
        async select() {
          return 'svg' as const;
        },
        isCancel() {
          return false;
        },
        cancel() {},
      },
    };

    await expect(runCli([], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).toContain('\u001b[38;2;0;0;0m');
  });

  test('rejects empty prompted output paths', async () => {
    const runtime = {
      ...createRuntime(),
      interactive: true,
      prompts: {
        async text() {
          return '';
        },
        async select() {
          return 'svg' as const;
        },
        isCancel() {
          return false;
        },
        cancel() {},
      },
    };

    await expect(runCli(['HELLO WORLD', '--format', 'svg'], runtime)).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('Missing --output for svg output');
  });
});
