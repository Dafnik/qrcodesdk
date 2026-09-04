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
    stdoutIsTTY: true,
    environment: {},
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

  test('disables ANSI when stdout is not a TTY', async () => {
    const runtime = {...createRuntime(), stdoutIsTTY: false};

    await expect(runCli(['HELLO WORLD'], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).not.toContain('\u001b[');
  });

  test('disables ANSI when NO_COLOR is present', async () => {
    const runtime = {...createRuntime(), environment: {NO_COLOR: ''}};

    await expect(runCli(['HELLO WORLD'], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).not.toContain('\u001b[');
  });

  test.each([
    {args: ['--ansi', 'blocks'], stdoutIsTTY: false, environment: {}},
    {args: ['--ansi', 'blocks'], stdoutIsTTY: true, environment: {NO_COLOR: '1'}},
    {args: ['--ansi', 'background'], stdoutIsTTY: false, environment: {NO_COLOR: '1'}},
  ])('lets explicit ANSI flags override the output environment', async (configuration) => {
    const runtime = {...createRuntime(), ...configuration};

    await expect(runCli(['HELLO WORLD', ...configuration.args], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).toContain('\u001b[');
  });

  test.each([
    {name: 'text', args: ['--ansi', 'off']},
    {name: 'SVG', args: ['--output', 'code.svg']},
    {name: 'PNG', args: ['--output', 'code.png']},
  ])('defaults $name output to no ECI and supports explicit opt-in', async ({args}) => {
    const defaultRuntime = createRuntime();
    const explicitFalseRuntime = createRuntime();
    const enabledRuntime = createRuntime();
    const explicitTrueRuntime = createRuntime();

    await expect(runCli(['Grüße', '--mask', '0', ...args], defaultRuntime)).resolves.toBe(0);
    await expect(
      runCli(['Grüße', '--mask', '0', '--eci', 'false', ...args], explicitFalseRuntime),
    ).resolves.toBe(0);
    await expect(runCli(['Grüße', '--mask', '0', '--eci', ...args], enabledRuntime)).resolves.toBe(
      0,
    );
    await expect(
      runCli(['Grüße', '--mask', '0', '--eci', 'true', ...args], explicitTrueRuntime),
    ).resolves.toBe(0);

    const output = (runtime: ReturnType<typeof createRuntime>) =>
      runtime.files[0]?.data ?? runtime.stdoutText();
    expect(output(explicitFalseRuntime)).toEqual(output(defaultRuntime));
    expect(output(enabledRuntime)).not.toEqual(output(defaultRuntime));
    expect(output(explicitTrueRuntime)).toEqual(output(enabledRuntime));
  });

  test.each([
    {name: 'default options', args: [], compact: true, ansi: true},
    {name: 'full layout', args: ['--layout', 'full'], compact: false, ansi: true},
    {name: 'ANSI off', args: ['--ansi', 'off'], compact: true, ansi: false},
    {
      name: 'full layout with ANSI off',
      args: ['--layout', 'full', '--ansi', 'off'],
      compact: false,
      ansi: false,
    },
  ])('supports text renderer options with $name', async ({args, compact, ansi}) => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--module-size', '1', '--quiet-zone', '0', ...args], runtime),
    ).resolves.toBe(0);

    const output = runtime.stdoutText();
    const visibleLines = output.replaceAll(ANSI_PATTERN, '').split('\n').slice(0, -1);

    expect(output.includes('\u001b[')).toBe(ansi);
    expect(visibleLines).toHaveLength(compact ? 11 : 21);
    expect(Array.from(visibleLines[0]!)).toHaveLength(compact ? 21 : 42);
  });

  test('uses custom colors for ANSI terminal output', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--foreground', '#1a2b3c', '--background', '#ddeeff'], runtime),
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
          '--ansi',
          'background',
          '--module-size',
          '1',
          '--quiet-zone',
          '0',
          '--foreground',
          '#1a2b3c',
          '--background',
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

  test('rejects a layout with ANSI-background output', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--ansi', 'background', '--layout', 'full'], runtime),
    ).resolves.toBe(1);

    expect(runtime.stderrText()).toContain('layout');
  });

  test('rejects invalid and missing ANSI modes', async () => {
    const invalid = createRuntime();
    const missing = createRuntime();

    await expect(runCli(['HELLO WORLD', '--ansi', 'yes'], invalid)).resolves.toBe(1);
    await expect(runCli(['HELLO WORLD', '--ansi'], missing)).resolves.toBe(1);

    expect(invalid.stderrText()).toContain('Expected one of: off, blocks, background');
    expect(missing.stderrText()).toContain("option '--ansi <mode>' argument missing");
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
    {args: ['--module-size', '0'], message: 'Invalid module-size. Expected a positive integer.'},
    {args: ['--quiet-zone', '-1'], message: 'Invalid quiet-zone. Expected a non-negative integer.'},
    {
      args: ['--foreground', '#fff'],
      message: 'Invalid foreground. Expected an RGB or RGBA hex color like #111111.',
    },
    {
      args: ['--background', '#gggggg'],
      message: 'Invalid background. Expected an RGB or RGBA hex color like #111111.',
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
