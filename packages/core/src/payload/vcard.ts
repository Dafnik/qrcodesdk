import type {QRCodeVCardPayload} from '../payload';
import {contentLines, textValue, urlValue, validateContentText} from './content-line';
import {invalidPayload} from './error';

const NAME_FIELDS = [
  'familyName',
  'givenName',
  'additionalNames',
  'honorificPrefix',
  'honorificSuffix',
] as const;
const ADDRESS_FIELDS = [
  'postOfficeBox',
  'extendedAddress',
  'streetAddress',
  'locality',
  'region',
  'postalCode',
  'country',
] as const;

export function vcardPayload(value: QRCodeVCardPayload): string {
  const name = value.name === undefined ? ';;;;' : structured(value.name, NAME_FIELDS, 'name');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${name}`,
    `FN:${textValue('formattedName', value.formattedName)}`,
  ];
  if (value.organization !== undefined)
    lines.push(`ORG:${textValue('organization', value.organization)}`);
  if (value.title !== undefined) lines.push(`TITLE:${textValue('title', value.title)}`);
  value.phones?.forEach((phone, index) => {
    const field = `phones[${index}]`;
    validateContentText(`${field}.number`, phone.number);
    if (
      !/^\+?[0-9 ().-]+$/.test(phone.number) ||
      /[\r\n]/.test(phone.number) ||
      !/\d/.test(phone.number)
    ) {
      invalidPayload(
        `${field}.number`,
        phone.number,
        'Phone numbers require digits, an optional leading +, and phone separators',
      );
    }
    lines.push(
      `TEL${typeParameter(phone.type, ['home', 'work', 'cell', 'fax'], `${field}.type`)}:${phone.number}`,
    );
  });
  value.emails?.forEach((email, index) => {
    const field = `emails[${index}]`;
    const type = typeParameter(email.type, ['home', 'work'], `${field}.type`);
    lines.push(
      `EMAIL;TYPE=INTERNET${type ? `,${email.type!.toUpperCase()}` : ''}:${textValue(`${field}.address`, email.address)}`,
    );
  });
  value.addresses?.forEach((address, index) => {
    const field = `addresses[${index}]`;
    lines.push(
      `ADR${typeParameter(address.type, ['home', 'work'], `${field}.type`)}:${structured(address, ADDRESS_FIELDS, field)}`,
    );
  });
  if (value.url !== undefined) lines.push(`URL:${urlValue('url', value.url)}`);
  if (value.note !== undefined) lines.push(`NOTE:${textValue('note', value.note, true)}`);
  lines.push('END:VCARD');
  return contentLines(lines);
}

function structured<T extends object>(value: T, keys: readonly (keyof T)[], field: string): string {
  let hasContent = false;
  const components = keys.map((key) => {
    const component = value[key] as string | undefined;
    if (component === undefined) return '';
    const escaped = textValue(`${field}.${String(key)}`, component, true);
    if (component.trim()) hasContent = true;
    return escaped;
  });
  if (!hasContent)
    invalidPayload(field, value, 'At least one non-whitespace component is required');
  return components.join(';');
}

function typeParameter(
  value: string | undefined,
  allowed: readonly string[],
  field: string,
): string {
  if (value === undefined) return '';
  if (!allowed.includes(value)) invalidPayload(field, value, 'Unsupported property type');
  return `;TYPE=${value.toUpperCase()}`;
}
