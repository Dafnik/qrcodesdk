import {invalidPayload} from './error';

export function validateContentText(field: string, value: string, allowEmpty = false): void {
  if (typeof value !== 'string' || (!value.trim() && !(allowEmpty && value.length === 0))) {
    invalidPayload(field, value, 'Expected non-whitespace text');
  }
  // TAB and line breaks are permitted in TEXT. All other C0 controls and DEL are rejected.
  // eslint-disable-next-line no-control-regex -- Deliberately reject unsupported controls.
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) {
    invalidPayload(field, value, 'Unsupported control character');
  }
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code >= 0xd800 && code <= 0xdfff) {
      invalidPayload(field, value, 'Unpaired UTF-16 surrogate');
    }
  }
}

/** TEXT for single-line values (display names, identifiers, email addresses) that must not contain line breaks. */
export function singleLineTextValue(field: string, value: string): string {
  const escaped = textValue(field, value);
  if (/[\r\n]/.test(value)) invalidPayload(field, value, 'Line breaks are not allowed');
  return escaped;
}

/** Rejects `null`, primitives, and arrays where a nested payload object is expected. */
export function validateObject(field: string, value: unknown): asserts value is object {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    invalidPayload(field, value, 'Expected an object');
  }
}

export function textValue(field: string, value: string, allowEmpty = false): string {
  validateContentText(field, value, allowEmpty);
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/[,;]/g, '\\$&');
}

export function urlValue(field: string, value: string): string {
  validateContentText(field, value);
  // eslint-disable-next-line no-control-regex -- URLs must reject every raw control.
  if (/\s|[\u0000-\u001f\u007f]/u.test(value)) {
    invalidPayload(field, value, 'URLs must not contain raw whitespace or controls');
  }
  const URLConstructor = (
    globalThis as unknown as {
      URL?: new (input: string) => {protocol: string; href: string};
    }
  ).URL;
  if (typeof URLConstructor !== 'function') {
    throw new TypeError('Payload URL fields require the standard URL API');
  }
  let url: {protocol: string; href: string};
  try {
    url = new URLConstructor(value);
  } catch {
    invalidPayload(field, value, 'Expected an absolute HTTP(S) URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    invalidPayload(field, value, 'Expected an absolute HTTP(S) URL');
  }
  return url.href;
}

export function contentLines(lines: readonly string[]): string {
  return (
    lines
      .map((line) => {
        let result = '';
        let width = 0;
        for (const character of line) {
          const bytes = utf8Length(character.codePointAt(0)!);
          if (width + bytes > 75) {
            result += '\r\n ';
            width = 1;
          }
          result += character;
          width += bytes;
        }
        return result;
      })
      .join('\r\n') + '\r\n'
  );
}

function utf8Length(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}
