import {throwInvalid} from './options';
import type {QRCodeShapePath} from './types';

type Command = 'm' | 'l' | 'h' | 'v' | 'c' | 'a' | 'z';
type ShapeCommand = {command: Command; values: number[]};

const ARGUMENTS = {m: 2, l: 2, h: 1, v: 1, c: 6, a: 7} as const;
const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/iy;

/** Parses closed subpaths of relative commands shared by SVG, Canvas, and PNG. */
export function parseShapePath(field: string, value: unknown): ShapeCommand[] {
  const invalid = (): never =>
    throwInvalid(
      field,
      'closed path data using only relative m, l, h, v, c, a, and z commands',
      value,
    );
  if (typeof value !== 'string') return invalid();
  const commands: ShapeCommand[] = [];
  let index = 0;
  let open = false;
  let command: Exclude<Command, 'z'> | undefined;
  const whitespace = () => {
    while (/[ \t\r\n]/.test(value[index] ?? '')) index++;
  };
  const number = (allowComma: boolean, flag: boolean): number => {
    whitespace();
    if (allowComma && value[index] === ',') {
      index++;
      whitespace();
    }
    if (flag) {
      const digit = value[index++];
      return digit === '0' ? 0 : digit === '1' ? 1 : invalid();
    }
    NUMBER.lastIndex = index;
    const match = NUMBER.exec(value);
    if (!match || !Number.isFinite(+match[0])) return invalid();
    index = NUMBER.lastIndex;
    return +match[0];
  };

  for (;;) {
    whitespace();
    if (index === value.length) break;
    const token = value[index]!;
    const explicit = token in ARGUMENTS;
    if (token === 'z') {
      if (!open) return invalid();
      commands.push({command: 'z', values: []});
      open = false;
      command = undefined;
      index++;
      continue;
    }
    if (explicit) {
      command = token as Exclude<Command, 'z'>;
      if (command === 'm' ? open : !open) return invalid();
      index++;
    }
    if (!command) return invalid();
    const values = Array.from({length: ARGUMENTS[command]}, (_, argument) =>
      number(argument > 0 || !explicit, command === 'a' && (argument === 3 || argument === 4)),
    );
    commands.push({command, values});
    if (command === 'm') {
      open = true;
      command = 'l';
    }
  }
  if (open || commands.length === 0) return invalid();
  return commands;
}

export function validateShapePath(field: string, value: unknown): asserts value is QRCodeShapePath {
  parseShapePath(field, value);
}
