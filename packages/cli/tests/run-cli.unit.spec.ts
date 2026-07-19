import {Buffer} from 'node:buffer';
import {beforeAll, describe, expect, test, vi} from 'vitest';

import packageJson from '../package.json' with {type: 'json'};
import {type CliRuntime, type WritableTarget, runCli} from '../src/run-cli';

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
    expect(runtime.stdoutText()).toContain('\u001b[48;2;0;0;0m');
    expect(runtime.stdoutText()).toContain('\u001b[48;2;255;255;255m');
    expect(runtime.stderrText()).toBe('');
  });

  test('accepts --input as an alternative to positional input', async () => {
    const runtime = createRuntime();

    await expect(runCli(['--input', 'HELLO WORLD'], runtime)).resolves.toBe(0);

    expect(runtime.stdoutText()).toContain('\u001b[48;2;0;0;0m');
  });

  test('prints compact plain Unicode terminal text with --small', async () => {
    const runtime = createRuntime();

    await expect(
      runCli(['HELLO WORLD', '--small', '--size', '1', '--margin', '0'], runtime),
    ).resolves.toBe(0);

    expect(runtime.stdoutText()).toContain('▀');
    expect(runtime.stdoutText()).not.toContain('\u001b[');
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

    expect(runtime.stdoutText()).toContain('\u001b[48;2;0;0;0m');
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
