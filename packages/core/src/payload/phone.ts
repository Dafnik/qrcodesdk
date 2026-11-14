import {invalidPayload} from './error';

/**
 * Validates a phone number made of digits, an optional leading `+`, and `().-` separators.
 * vCard numbers additionally allow ASCII spaces; `tel:`/`sms:` URIs do not.
 */
export function resolvePhoneNumber(field: string, value: string, allowSpaces = false): string {
  const pattern = allowSpaces ? /^\+?[0-9 ().-]+$/ : /^\+?[0-9().-]+$/;
  if (typeof value !== 'string' || !pattern.test(value) || !/\d/.test(value)) {
    invalidPayload(
      field,
      value,
      allowSpaces
        ? 'Phone numbers require digits, an optional leading +, and phone separators'
        : 'Phone numbers may contain digits and RFC 3966 separators',
    );
  }
  return value;
}
