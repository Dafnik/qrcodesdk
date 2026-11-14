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
  let url: {protocol: string; href: string};
  try {
    const URLConstructor = (
      globalThis as unknown as {
        URL: new (input: string) => {protocol: string; href: string};
      }
    ).URL;
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
  const encoder = new (
    globalThis as unknown as {
      TextEncoder: new () => {encode(input: string): Uint8Array};
    }
  ).TextEncoder();
  return (
    lines
      .map((line) => {
        let result = '';
        let width = 0;
        for (const character of line) {
          const bytes = encoder.encode(character).length;
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
