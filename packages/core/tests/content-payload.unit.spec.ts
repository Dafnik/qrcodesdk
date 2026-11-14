import {describe, expect, test, vi} from 'vitest';

import {QRCodeError} from '../src/error';
import {calendarPayload, vcardPayload} from '../src/payload';
import type {QRCodeCalendarPayload, QRCodeVCardPayload} from '../src/payload';

const event = {
  uid: 'event@example.com',
  timestamp: '2026-11-14T12:00:00Z',
  summary: 'Meeting',
  start: '2026-12-01T10:00:00+01:00',
  end: '2026-12-01T11:00:00+01:00',
} as const;
const crlf = (lines: readonly string[]) => lines.join('\r\n') + '\r\n';
const unfold = (value: string) => value.replace(/\r\n /g, '');

function invalid(serialize: () => string, field: string, value?: unknown): void {
  expect(serialize).toThrow(QRCodeError);
  expect(serialize).toThrowError(
    expect.objectContaining({
      code: 'INVALID_PAYLOAD',
      details: expect.objectContaining({
        field,
        ...(value === undefined ? {} : {value}),
        reason: expect.any(String),
      }),
    }),
  );
}

describe('vCard payload', () => {
  test('writes a minimal vCard 3.0 with empty structured name', () => {
    expect(vcardPayload({formattedName: 'Ada Lovelace'})).toBe(
      crlf(['BEGIN:VCARD', 'VERSION:3.0', 'N:;;;;', 'FN:Ada Lovelace', 'END:VCARD']),
    );
  });

  test('writes all fields in order with independent structured components and repeated entries', () => {
    const contact: QRCodeVCardPayload = {
      formattedName: 'Zoë Müller',
      name: {
        familyName: 'Müller;Smith',
        givenName: 'Zoë',
        additionalNames: 'A,B',
        honorificPrefix: 'Dr.',
        honorificSuffix: 'Jr.',
      },
      organization: 'One;Department',
      title: 'Engineer',
      phones: [
        {number: '+43 (1) 555.01-23', type: 'work'},
        {number: '123'},
        {number: '123', type: 'fax'},
        {number: '456', type: 'home'},
        {number: '789', type: 'cell'},
      ],
      emails: [
        {address: 'zoe@example.com', type: 'work'},
        {address: 'zoe@example.com'},
        {address: 'home@example.com', type: 'home'},
      ],
      addresses: [
        {
          type: 'home',
          postOfficeBox: 'Box',
          extendedAddress: 'Floor',
          streetAddress: 'First; Second\nThird',
          locality: 'Vienna',
          region: '',
          postalCode: '1010',
          country: 'AT',
        },
        {type: 'work', country: 'JP'},
      ],
      url: 'HTTPS://EXAMPLE.COM',
      note: '',
    };
    expect(vcardPayload(contact)).toBe(
      crlf([
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Müller\\;Smith;Zoë;A\\,B;Dr.;Jr.',
        'FN:Zoë Müller',
        'ORG:One\\;Department',
        'TITLE:Engineer',
        'TEL;TYPE=WORK:+43 (1) 555.01-23',
        'TEL:123',
        'TEL;TYPE=FAX:123',
        'TEL;TYPE=HOME:456',
        'TEL;TYPE=CELL:789',
        'EMAIL;TYPE=INTERNET,WORK:zoe@example.com',
        'EMAIL;TYPE=INTERNET:zoe@example.com',
        'EMAIL;TYPE=INTERNET,HOME:home@example.com',
        'ADR;TYPE=HOME:Box;Floor;First\\; Second\\nThird;Vienna;;1010;AT',
        'ADR;TYPE=WORK:;;;;;;JP',
        'URL:https://example.com/',
        'NOTE:',
        'END:VCARD',
      ]),
    );
  });

  test('preserves duplicates and omits empty arrays and undefined fields', () => {
    expect(vcardPayload({formattedName: 'A', phones: [], emails: [], addresses: []})).toBe(
      vcardPayload({formattedName: 'A'}),
    );
    expect(vcardPayload({formattedName: 'A', phones: [{number: '1'}, {number: '1'}]})).toContain(
      'TEL:1\r\nTEL:1\r\n',
    );
    expect(vcardPayload({formattedName: 'A', name: {givenName: 'A'}})).toContain('N:;A;;;\r\n');
  });

  test('escapes TEXT without allowing content-line injection or confusing literal backslashes', () => {
    const note = 'literal\\n,;:a\r\nEND:VCARD\nNEXT\rLast 日本語 😀';
    expect(vcardPayload({formattedName: 'Zoë', note})).toContain(
      'NOTE:literal\\\\n\\,\\;:a\\nEND:VCARD\\nNEXT\\nLast 日本語 😀\r\nEND:VCARD\r\n',
    );
  });

  test.each([
    [{formattedName: ''}, 'formattedName'],
    [{formattedName: ' \n'}, 'formattedName'],
    [{formattedName: 'A', name: {}}, 'name'],
    [{formattedName: 'A', name: {familyName: ''}}, 'name'],
    [{formattedName: 'A', organization: ' '}, 'organization'],
    [{formattedName: 'A', title: ''}, 'title'],
    [{formattedName: 'A', note: ' '}, 'note'],
    [{formattedName: 'A', phones: [{number: '()'}]}, 'phones[0].number'],
    [{formattedName: 'A', phones: [{number: '1\n'}]}, 'phones[0].number'],
    [{formattedName: 'A', phones: [{number: '1+2'}]}, 'phones[0].number'],
    [{formattedName: 'A', phones: [{number: '1\n2'}]}, 'phones[0].number'],
    [{formattedName: 'A', phones: [{number: '1 ext 2'}]}, 'phones[0].number'],
    [{formattedName: 'A', phones: [{number: '1', type: 'other'}]}, 'phones[0].type'],
    [{formattedName: 'A', emails: [{address: ' '}]}, 'emails[0].address'],
    [{formattedName: 'A', emails: [{address: 'a', type: 'cell'}]}, 'emails[0].type'],
    [{formattedName: 'A', addresses: [{type: 'home'}]}, 'addresses[0]'],
    [{formattedName: 'A', addresses: [{postalCode: '\0'}]}, 'addresses[0].postalCode'],
    [{formattedName: 'A\nB'}, 'formattedName'],
    [{formattedName: 'A\rB'}, 'formattedName'],
    [{formattedName: 'A', emails: [{address: 'zoe@example.com\n'}]}, 'emails[0].address'],
    [{formattedName: 'A', emails: [{address: 'a\r\nTEL:1'}]}, 'emails[0].address'],
    [{formattedName: 'A', name: null}, 'name'],
    [{formattedName: 'A', name: 'Ada'}, 'name'],
    [{formattedName: 'A', phones: [null]}, 'phones[0]'],
    [{formattedName: 'A', emails: [null]}, 'emails[0]'],
    [{formattedName: 'A', addresses: [null]}, 'addresses[0]'],
    [{formattedName: 'A', addresses: [[]]}, 'addresses[0]'],
  ] as const)('rejects invalid contact %j at %s', (value, field) => {
    invalid(() => vcardPayload(value as QRCodeVCardPayload), field);
  });
});

describe('shared content lines', () => {
  test.each([
    '\0',
    '\u0001',
    '\u0008',
    '\u000b',
    '\u000c',
    '\u001f',
    '\u007f',
    '\ud800',
    '\udfff',
    'a\ud800b',
  ])('rejects unsupported text %j', (text) => {
    invalid(() => vcardPayload({formattedName: text}), 'formattedName', text);
    invalid(() => calendarPayload({...event, description: text}), 'description', text);
  });

  test('reports a missing URL API as a runtime error, not invalid input', () => {
    vi.stubGlobal('URL', undefined);
    try {
      expect(() => vcardPayload({formattedName: 'A', url: 'https://example.com'})).toThrow(
        new TypeError('Payload URL fields require the standard URL API'),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test.each([
    'relative/path',
    'ftp://example.com',
    'https://example.com/a b',
    'https://example.com/\t',
    'https://example.com/\nX:Y',
    'https://example.com/\ud800',
  ])('rejects unsafe URLs %j', (url) => {
    invalid(() => vcardPayload({formattedName: 'A', url}), 'url', url);
    invalid(() => calendarPayload({...event, url}), 'url', url);
  });

  test.each([74, 75, 76, 149, 150, 151, 300])('folds content at a %i-byte boundary', (length) => {
    const note = 'x'.repeat(length - 5);
    const result = vcardPayload({formattedName: 'A', note});
    const physical = result.split('\r\n');
    expect(physical.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(result.includes('\r\n ')).toBe(length > 75);
    expect(unfold(result)).toContain(`NOTE:${note}\r\n`);
    const noteLines = result
      .slice(result.indexOf('NOTE:'), result.indexOf('END:VCARD'))
      .split('\r\n')
      .filter(Boolean);
    expect(
      noteLines.slice(0, -1).every((line) => new TextEncoder().encode(line).length === 75),
    ).toBe(true);
  });

  test('folds repeated multibyte text without splitting code points or changing Unicode', () => {
    const note = 'e\u0301 Zoë 日本語 😀'.repeat(40) + '\t';
    const result = vcardPayload({formattedName: 'A', note});
    expect(result.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(
      true,
    );
    expect(unfold(result)).toContain(`NOTE:${note}\r\n`);
    expect(new TextDecoder('utf-8', {fatal: true}).decode(new TextEncoder().encode(result))).toBe(
      result,
    );
  });

  test('does not mutate frozen readonly inputs', () => {
    const contact = Object.freeze({
      formattedName: 'A',
      name: Object.freeze({givenName: 'A'}),
      phones: Object.freeze([Object.freeze({number: '123'})]),
    });
    const calendar = Object.freeze({...event});
    expect(vcardPayload(contact)).toBe(vcardPayload(contact));
    expect(calendarPayload(calendar)).toBe(calendarPayload(calendar));
  });
});

describe('calendar payload', () => {
  test('writes a full wrapper and converts offsets to UTC', () => {
    expect(calendarPayload(event)).toBe(
      crlf([
        'BEGIN:VCALENDAR',
        'PRODID:-//QRCodeSDK//Calendar//EN',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:event@example.com',
        'DTSTAMP:20261114T120000Z',
        'DTSTART:20261201T090000Z',
        'DTEND:20261201T100000Z',
        'SUMMARY:Meeting',
        'END:VEVENT',
        'END:VCALENDAR',
      ]),
    );
  });

  test('writes optional TEXT and URI fields with distinct escaping', () => {
    expect(
      calendarPayload({
        ...event,
        uid: 'a,b;\\c',
        summary: '日本語 😀',
        location: 'Room;1',
        description: 'One\rTwo\nThree\r\nFour',
        url: 'https://EXAMPLE.com/a,b;c',
      }),
    ).toContain(
      crlf([
        'UID:a\\,b\\;\\\\c',
        'DTSTAMP:20261114T120000Z',
        'DTSTART:20261201T090000Z',
        'DTEND:20261201T100000Z',
        'SUMMARY:日本語 😀',
        'LOCATION:Room\\;1',
        'DESCRIPTION:One\\nTwo\\nThree\\nFour',
        'URL:https://example.com/a,b;c',
      ]),
    );
    expect(calendarPayload({...event, description: ''})).toContain('DESCRIPTION:\r\n');
  });

  test('writes exclusive all-day dates and an instant timestamp', () => {
    expect(
      calendarPayload({
        ...event,
        allDay: true,
        start: '2024-02-29',
        end: '2024-03-01',
        timestamp: '2026-01-01T00:30:00+01:00',
      }),
    ).toContain(
      crlf([
        'DTSTAMP:20251231T233000Z',
        'DTSTART;VALUE=DATE:20240229',
        'DTEND;VALUE=DATE:20240301',
      ]),
    );
  });

  test.each([
    ['2026-01-01T00:30:00+01:00', '20251231T233000Z'],
    ['2026-12-31T23:30:00-01:00', '20270101T003000Z'],
    ['0001-01-01T00:00:00Z', '00010101T000000Z'],
    ['0099-01-01T00:00:00Z', '00990101T000000Z'],
    ['9999-12-31T23:59:59Z', '99991231T235959Z'],
    ['2000-02-29T00:00:00+00:00', '20000229T000000Z'],
    ['2026-01-01T00:00:00+23:59', '20251231T000100Z'],
  ])('converts %s independently of local timezone', (timestamp, expected) => {
    expect(calendarPayload({...event, timestamp})).toContain(`DTSTAMP:${expected}\r\n`);
  });

  test.each([
    '2025-02-29T00:00:00Z',
    '1900-02-29T00:00:00Z',
    '2026-04-31T00:00:00Z',
    '2026-00-01T00:00:00Z',
    '2026-13-01T00:00:00Z',
    '2026-01-00T00:00:00Z',
    '2026-01-01T24:00:00Z',
    '2026-01-01T00:60:00Z',
    '2026-01-01T00:00:60Z',
    '2026-01-01T00:00:00Z\n',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00',
    '2026-01-01',
    '2026-01-01T00:00:00-00:00',
    '2026-01-01T00:00:00+24:00',
    '2026-01-01T00:00:00+00:60',
    '0000-01-01T00:00:00Z',
    '0001-01-01T00:00:00+00:01',
    '9999-12-31T23:59:59-00:01',
  ])('rejects invalid instants %s', (timestamp) => {
    invalid(() => calendarPayload({...event, timestamp}), 'timestamp', timestamp);
    invalid(() => calendarPayload({...event, start: timestamp}), 'start', timestamp);
    invalid(() => calendarPayload({...event, end: timestamp}), 'end');
  });

  test.each([
    '2025-02-29',
    '1900-02-29',
    '0000-01-01',
    '2026-13-01',
    '2026-01-00',
    '2026-1-1',
    '2026-01-01\n',
    '2026-01-01T00:00:00Z',
  ])('rejects invalid all-day dates %s', (start) => {
    invalid(
      () => calendarPayload({...event, allDay: true, start, end: '2027-01-01'}),
      'start',
      start,
    );
  });

  test('rejects equal and reversed ranges, including equivalent instants', () => {
    invalid(() => calendarPayload({...event, end: event.start}), 'end');
    invalid(() => calendarPayload({...event, end: '2026-12-01T09:00:00Z'}), 'end');
    invalid(() => calendarPayload({...event, end: '2026-12-01T08:59:59Z'}), 'end');
    for (const end of ['2026-12-01', '2026-11-30']) {
      invalid(
        () => calendarPayload({...event, allDay: true, start: '2026-12-01', end}),
        'end',
        end,
      );
    }
  });

  test.each(['uid', 'summary', 'location', 'description'] as const)(
    'rejects whitespace-only %s',
    (field) => {
      invalid(() => calendarPayload({...event, [field]: ' '}), field, ' ');
    },
  );

  test.each([
    ['uid', 'event@example.com\r\nEND:VEVENT'],
    ['summary', 'One\nTwo'],
    ['summary', 'One\rTwo'],
  ] as const)('rejects line breaks in single-line %s', (field, value) => {
    invalid(() => calendarPayload({...event, [field]: value}), field, value);
  });

  test('produces identical output across host timezones', () => {
    const expected = calendarPayload(event);
    try {
      for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
        vi.stubEnv('TZ', timezone);
        expect(calendarPayload(event)).toBe(expected);
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test('requires end and timestamp at runtime too', () => {
    invalid(
      () => calendarPayload({...event, end: undefined} as unknown as QRCodeCalendarPayload),
      'end',
    );
    invalid(
      () => calendarPayload({...event, timestamp: undefined} as unknown as QRCodeCalendarPayload),
      'timestamp',
    );
    invalid(
      () => calendarPayload({...event, allDay: 'yes'} as unknown as QRCodeCalendarPayload),
      'allDay',
    );
  });
});
