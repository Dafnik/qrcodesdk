import type {QRCodeVCardPayload} from '../payload';
import {
  contentLines,
  singleLineTextValue,
  textValue,
  urlValue,
  validateObject,
} from './content-line';
import {invalidPayload} from './error';
import {resolvePhoneNumber} from './phone';

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
    `FN:${singleLineTextValue('formattedName', value.formattedName)}`,
  ];
  if (value.organization !== undefined)
    lines.push(`ORG:${textValue('organization', value.organization)}`);
  if (value.title !== undefined) lines.push(`TITLE:${textValue('title', value.title)}`);
  value.phones?.forEach((phone, index) => {
    const field = `phones[${index}]`;
    validateObject(field, phone);
    const number = resolvePhoneNumber(`${field}.number`, phone.number, true);
    const type = typeParameter(phone.type, ['home', 'work', 'cell', 'fax'], `${field}.type`);
    lines.push(`TEL${type ? `;TYPE=${type}` : ''}:${number}`);
  });
  value.emails?.forEach((email, index) => {
    const field = `emails[${index}]`;
    validateObject(field, email);
    const type = typeParameter(email.type, ['home', 'work'], `${field}.type`);
    const address = singleLineTextValue(`${field}.address`, email.address);
    lines.push(`EMAIL;TYPE=INTERNET${type ? `,${type}` : ''}:${address}`);
  });
  value.addresses?.forEach((address, index) => {
    const field = `addresses[${index}]`;
    validateObject(field, address);
    const type = typeParameter(address.type, ['home', 'work'], `${field}.type`);
    lines.push(`ADR${type ? `;TYPE=${type}` : ''}:${structured(address, ADDRESS_FIELDS, field)}`);
  });
  if (value.url !== undefined) lines.push(`URL:${urlValue('url', value.url)}`);
  if (value.note !== undefined) lines.push(`NOTE:${textValue('note', value.note, true)}`);
  lines.push('END:VCARD');
  return contentLines(lines);
}

function structured<T extends object>(value: T, keys: readonly (keyof T)[], field: string): string {
  validateObject(field, value);
  let hasContent = false;
  const components = keys.map((key) => {
    const component = value[key] as string | undefined;
    if (component === undefined) return '';
    // textValue rejects whitespace-only components, so any non-empty component has content.
    const escaped = textValue(`${field}.${String(key)}`, component, true);
    if (component !== '') hasContent = true;
    return escaped;
  });
  if (!hasContent)
    invalidPayload(field, value, 'At least one non-whitespace component is required');
  return components.join(';');
}

/** Returns the uppercase vCard TYPE value, or `undefined` when no type was supplied. */
function typeParameter(
  value: string | undefined,
  allowed: readonly string[],
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) invalidPayload(field, value, 'Unsupported property type');
  return value.toUpperCase();
}
