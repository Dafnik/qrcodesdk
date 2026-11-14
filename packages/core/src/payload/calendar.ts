import type {QRCodeCalendarPayload} from '../payload';
import {contentLines, textValue, urlValue} from './content-line';
import {invalidPayload} from './error';

export function calendarPayload(value: QRCodeCalendarPayload): string {
  if (value.allDay !== undefined && typeof value.allDay !== 'boolean') {
    invalidPayload('allDay', value.allDay, 'Expected a boolean');
  }
  const timestamp = instant('timestamp', value.timestamp);
  const start = value.allDay ? date('start', value.start) : instant('start', value.start);
  const end = value.allDay ? date('end', value.end) : instant('end', value.end);
  if (end <= start)
    invalidPayload('end', value.end, 'End must be later than start and is exclusive');
  const parameter = value.allDay ? ';VALUE=DATE' : '';
  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//QRCodeSDK//Calendar//EN',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${textValue('uid', value.uid)}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART${parameter}:${start}`,
    `DTEND${parameter}:${end}`,
    `SUMMARY:${textValue('summary', value.summary)}`,
  ];
  if (value.location !== undefined) lines.push(`LOCATION:${textValue('location', value.location)}`);
  if (value.description !== undefined)
    lines.push(`DESCRIPTION:${textValue('description', value.description, true)}`);
  if (value.url !== undefined) lines.push(`URL:${urlValue('url', value.url)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return contentLines(lines);
}

function date(field: string, value: string, original: string = value): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match || match[0] !== value) invalidPayload(field, original, 'Expected YYYY-MM-DD');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]!) {
    invalidPayload(field, original, 'Expected a valid Gregorian date in years 0001–9999');
  }
  return match[1]! + match[2]! + match[3]!;
}

function instant(field: string, value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(
    value,
  );
  if (!match || match[0] !== value)
    invalidPayload(field, value, 'Expected a date and time with seconds and an explicit offset');
  date(field, match[1]!, value);
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  const offsetHour = Number(match[7] ?? 0);
  const offsetMinute = Number(match[8] ?? 0);
  if (
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59 ||
    match[5] === '-00:00'
  ) {
    invalidPayload(field, value, 'Invalid clock time or UTC offset');
  }
  // Parsing only happens after validating all components, so Date cannot normalize invalid input.
  const utc = new Date(value);
  const year = utc.getUTCFullYear();
  if (year < 1 || year > 9999)
    invalidPayload(field, value, 'Converted UTC year must be in 0001–9999');
  return utc.toISOString().replace(/[-:]/g, '').replace('.000', '');
}
