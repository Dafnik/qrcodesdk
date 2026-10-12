import {PassThrough} from 'node:stream';
import {stripVTControlCharacters} from 'node:util';
import {describe, expect, test} from 'vitest';

import {cancel, isCancel, select, text} from '../src/prompts';

function createTerminal() {
  const input = Object.assign(new PassThrough(), {
    isTTY: true,
    isRaw: false,
    rawModes: [] as boolean[],
    setRawMode(mode: boolean) {
      this.isRaw = mode;
      this.rawModes.push(mode);
      return this;
    },
  });
  const output = new PassThrough();
  let written = '';
  output.on('data', (chunk: Buffer) => (written += chunk.toString()));
  return {input, output, written: () => stripVTControlCharacters(written)};
}

const OPTIONS = [
  {value: 'svg', label: 'SVG file'},
  {value: 'png', label: 'PNG file'},
  {value: 'txt', label: 'Text file'},
] as const;

function choose(keys: string[]) {
  const terminal = createTerminal();
  const result = select({message: 'Output format', options: OPTIONS}, terminal);
  for (const key of keys) terminal.input.write(key);
  return {result, terminal};
}

describe('select prompt', () => {
  test('selects the first option with enter and restores the terminal', async () => {
    const {result, terminal} = choose(['\r']);
    await expect(result).resolves.toBe('svg');
    expect(terminal.input.rawModes).toEqual([true, false]);
    expect(terminal.written()).toContain('❯ SVG file');
    expect(terminal.written()).toContain('? Output format SVG file');
  });

  test.each([
    [['\u001b[B', '\r'], 'png'],
    [['\u001b[B', '\u001b[B', '\u001b[B', '\r'], 'svg'],
    [['\u001b[A', '\r'], 'txt'],
    [['j', 'j', 'k', '\r'], 'png'],
    [['\t', '\r'], 'png'],
    [['3', '\r'], 'txt'],
    [['9', 'x', '\r'], 'svg'],
  ])('navigates with %j', async (keys, expected) => {
    await expect(choose(keys).result).resolves.toBe(expected);
  });

  test.each([['\u0003'], ['\u001b'], ['\u0004']])('cancels with %j', async (key) => {
    const {result, terminal} = choose([key]);
    const value = await result;
    expect(isCancel(value)).toBe(true);
    expect(terminal.input.rawModes).toEqual([true, false]);
    expect(terminal.written()).toContain('cancelled');
  });
});

describe('text prompt', () => {
  test('returns the trimmed answer and shows the placeholder hint', async () => {
    const terminal = createTerminal();
    const result = text({message: 'QR payload', placeholder: 'https://qrcodesdk.dev'}, terminal);
    terminal.input.write('  HELLO  \r');
    await expect(result).resolves.toBe('HELLO');
    expect(terminal.written()).toContain('? QR payload (e.g. https://qrcodesdk.dev)');
  });

  test.each([['\u0003'], ['\u0004']])('cancels with %j', async (key) => {
    const terminal = createTerminal();
    const result = text({message: 'QR payload'}, terminal);
    terminal.input.write(key);
    expect(isCancel(await result)).toBe(true);
  });

  test('writes the cancellation message', () => {
    const terminal = createTerminal();
    cancel('Cancelled', terminal);
    expect(terminal.written()).toBe('■ Cancelled\n');
  });
});
