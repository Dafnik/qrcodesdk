import process from 'node:process';
import {createInterface, emitKeypressEvents} from 'node:readline';
import {styleText} from 'node:util';

type PromptInput = NodeJS.ReadableStream & {
  isTTY?: boolean;
  isRaw?: boolean;
  setRawMode?: (mode: boolean) => unknown;
};
type PromptOutput = NodeJS.WritableStream;
type Key = {name?: string; ctrl?: boolean};

export type PromptStreams = {
  readonly input?: PromptInput;
  readonly output?: PromptOutput;
};

const CANCEL = Symbol('cancel');
const ESCAPE = '\u001b[';

export function isCancel(value: unknown): value is symbol {
  return value === CANCEL;
}

export function cancel(message: string, {output = process.stdout}: PromptStreams = {}): void {
  output.write(`${styleText('red', '■')} ${message}\n`);
}

export function text(
  {message, placeholder}: {message: string; placeholder?: string},
  {input = process.stdin, output = process.stdout}: PromptStreams = {},
): Promise<string | symbol> {
  return new Promise((resolve) => {
    const readline = createInterface({input, output, terminal: !!input.isTTY});
    let answered = false;
    readline.once('SIGINT', () => readline.close());
    readline.once('close', () => {
      if (!answered) {
        output.write('\n');
        resolve(CANCEL);
      }
    });
    const hint = placeholder ? ` ${styleText('dim', `(e.g. ${placeholder})`)}` : '';
    readline.question(
      `${styleText('cyan', '?')} ${styleText('bold', message)}${hint} `,
      (answer) => {
        answered = true;
        readline.close();
        resolve(answer.trim());
      },
    );
  });
}

export function select<TValue>(
  {message, options}: {message: string; options: readonly {value: TValue; label: string}[]},
  {input = process.stdin, output = process.stdout}: PromptStreams = {},
): Promise<TValue | symbol> {
  return new Promise((resolve) => {
    let selected = 0;
    const wasRaw = !!input.isRaw;
    const render = (firstRender: boolean) => {
      if (!firstRender) output.write(`${ESCAPE}${options.length}A`);
      options.forEach(({label}, index) => {
        const line =
          index === selected ? styleText('cyan', `❯ ${label}`) : `  ${styleText('dim', label)}`;
        output.write(`${ESCAPE}2K${line}\n`);
      });
    };
    const finish = (value: TValue | symbol) => {
      input.off('keypress', onKeypress);
      input.setRawMode?.(wasRaw);
      input.pause();
      // Replace the menu with a one-line summary and restore the cursor.
      output.write(`${ESCAPE}${options.length + 1}A${ESCAPE}J${ESCAPE}?25h`);
      const summary = isCancel(value)
        ? styleText('dim', 'cancelled')
        : styleText('cyan', options[selected]!.label);
      output.write(`${styleText('cyan', '?')} ${styleText('bold', message)} ${summary}\n`);
      resolve(value);
    };
    const onKeypress = (character: string | undefined, key: Key = {}) => {
      if ((key.ctrl && (key.name === 'c' || key.name === 'd')) || key.name === 'escape') {
        finish(CANCEL);
      } else if (key.name === 'return' || key.name === 'enter') {
        finish(options[selected]!.value);
      } else {
        if (key.name === 'up' || key.name === 'k') {
          selected = (selected + options.length - 1) % options.length;
        } else if (key.name === 'down' || key.name === 'j' || key.name === 'tab') {
          selected = (selected + 1) % options.length;
        } else if (character && Number(character) >= 1 && Number(character) <= options.length) {
          selected = Number(character) - 1;
        } else {
          return;
        }
        render(false);
      }
    };

    emitKeypressEvents(input);
    input.setRawMode?.(true);
    input.on('keypress', onKeypress);
    input.resume();
    output.write(
      `${ESCAPE}?25l${styleText('cyan', '?')} ${styleText('bold', message)} ${styleText('dim', '(↑/↓ to move, enter to select)')}\n`,
    );
    render(true);
  });
}
