---
title: Payload helpers
description: Serialize typed contact, calendar, email, phone, SMS, geographic, and Wi-Fi values for qrcode().
docType: reference

related:
  - ./builder.mdx
  - ./errors.md
  - ../packages/core.mdx
  - ../getting-started/choose-your-setup.mdx
---

Core exports small serializers for payload formats that scanners understand. Each helper returns a
string that you pass to `qrcode()` or a framework component’s `payload` input.
Scanner recognition of each format depends on the app and device.

Helpers only build the payload text. Set encoding options on the
[builder](/reference/builder/#payload).

```ts
import {qrcode} from '@qrcodesdk/core';
import {wifiPayload} from '@qrcodesdk/core/payload';

const matrix = qrcode(
  wifiPayload({
    ssid: 'Office Wi-Fi',
    password: 'correct horse battery staple',
  }),
).matrix();
```

## Use with framework components

Framework packages do not re-export the payload helpers.
[Add Core to the project](/getting-started/choose-your-setup/#add-core-to-a-framework-project), then
pass the helper's result as the component's `payload`:

```tsx
import {wifiPayload} from '@qrcodesdk/core/payload';
import {QRCodeSVG, type QRCodeSVGOptions} from '@qrcodesdk/react';

const payload = wifiPayload({ssid: 'Office Wi-Fi', password: 'correct horse battery staple'});
const options: QRCodeSVGOptions = {accessibility: {ariaLabel: 'Scan to join Office Wi-Fi'}};

export function WiFiQRCode() {
  return <QRCodeSVG payload={payload} options={options} />;
}
```

Helpers throw `INVALID_PAYLOAD` when you call them, not inside the component. For user input, call
the helper in a `try`/`catch` before rendering. See
[Validate before rendering](/reference/errors/#validate-before-rendering).

## Available helpers

| Helper            | Input type              | Output convention            |
| ----------------- | ----------------------- | ---------------------------- |
| `vcardPayload`    | `QRCodeVCardPayload`    | vCard 3.0                    |
| `calendarPayload` | `QRCodeCalendarPayload` | iCalendar 2.0 with one event |
| `emailPayload`    | `QRCodeEmailPayload`    | RFC 6068 `mailto`            |
| `phonePayload`    | `QRCodePhonePayload`    | RFC 3966 `tel`               |
| `smsPayload`      | `QRCodeSMSPayload`      | RFC 5724 `sms`               |
| `geoPayload`      | `QRCodeGeoPayload`      | RFC 5870 `geo`               |
| `wifiPayload`     | `QRCodeWiFiPayload`     | Wi-Fi QR payload             |

```ts
import {emailPayload, geoPayload, phonePayload, smsPayload} from '@qrcodesdk/core/payload';

emailPayload({
  to: 'hello@example.com',
  subject: 'Hello',
  body: 'Sent from a QR code',
});

phonePayload({number: '+1-201-555-0123', extension: '456'});
smsPayload({recipients: '+12015550123', body: 'Meet at 10?'});
geoPayload({latitude: 48.2082, longitude: 16.3738});
```

## Email fields

`emailPayload()` accepts `QRCodeEmailPayload` and returns a `mailto:` string. It percent-encodes
addresses and query values but keeps the `@` in recipient addresses.

| Field     | Type                          | Required | Meaning                         |
| --------- | ----------------------------- | -------- | ------------------------------- |
| `to`      | `string \| readonly string[]` | Yes      | One or more recipient addresses |
| `cc`      | `string \| readonly string[]` | No       | Copy recipients                 |
| `bcc`     | `string \| readonly string[]` | No       | Blind-copy recipients           |
| `subject` | `string`                      | No       | Subject line; may be empty      |
| `body`    | `string`                      | No       | Message body; may be empty      |

- Recipient lists need at least one non-empty string.
- The helper does not check email-address syntax.
- Omitted optional fields do not appear in the output.
- `subject` and `body` reject line breaks. A multi-line `body` throws `INVALID_PAYLOAD`, so pass it as
  a single line.

## Phone fields

`phonePayload()` accepts `QRCodePhonePayload` and returns a `tel:` string.

| Field       | Type     | Required | Meaning                                                                                       |
| ----------- | -------- | -------- | --------------------------------------------------------------------------------------------- |
| `number`    | `string` | Yes      | Phone number containing digits, an optional leading `+`, and separators `(`, `)`, `.`, or `-` |
| `extension` | `string` | No       | One or more digits, appended as `;ext=...`                                                    |

- The number must contain at least one digit.
- An omitted extension adds no `ext` parameter.

## SMS fields

`smsPayload()` accepts `QRCodeSMSPayload` and returns an `sms:` string.

| Field        | Type                          | Required | Meaning                                                         |
| ------------ | ----------------------------- | -------- | --------------------------------------------------------------- |
| `recipients` | `string \| readonly string[]` | Yes      | One or more phone numbers using the phone helper's number rules |
| `body`       | `string`                      | No       | Percent-encoded message body; may be empty                      |

- Recipient arrays must not be empty.
- Multiple recipients are comma-separated.
- An omitted body adds no query string. An empty body adds `?body=`.

## Geographic fields

`geoPayload()` accepts `QRCodeGeoPayload` and returns a `geo:` string. It writes coordinates as
decimal numbers without exponent notation.

| Field         | Type     | Required | Meaning                                                          |
| ------------- | -------- | -------- | ---------------------------------------------------------------- |
| `latitude`    | `number` | Yes      | Finite latitude in degrees from `-90` through `90`               |
| `longitude`   | `number` | Yes      | Finite longitude in degrees from `-180` through `180`            |
| `altitude`    | `number` | No       | Finite altitude in meters, appended as a third coordinate        |
| `uncertainty` | `number` | No       | Finite, non-negative uncertainty in meters, appended as `;u=...` |

Omitted altitude and uncertainty values do not appear in the output.

## Wi-Fi fields

`wifiPayload()` accepts `QRCodeWiFiPayload` and returns a `WIFI:...;;` string.

| Field        | Type                         | Required | Meaning                                                               |
| ------------ | ---------------------------- | -------- | --------------------------------------------------------------------- |
| `ssid`       | `string`                     | Yes      | Non-empty network name                                                |
| `password`   | `string`                     | No       | Network password; may be empty                                        |
| `encryption` | `'WPA' \| 'WEP' \| 'nopass'` | No       | Defaults to `'WPA'` when `password` is supplied, otherwise `'nopass'` |
| `hidden`     | `boolean`                    | No       | Writes the hidden-network flag when supplied; omitted by default      |

- `'WPA'` and `'WEP'` require a password.
- `'nopass'` rejects any supplied password, even an empty string.
- The helper escapes backslashes, semicolons, commas, colons, and quotation marks in the SSID and
  password.

## Contacts

`vcardPayload()` accepts `QRCodeVCardPayload` and returns a vCard 3.0 string.
It always writes `VERSION:3.0`, `N`, and `FN`. Omitting `name` writes `N:;;;;`.
The helper never splits `formattedName` to infer name components.

| Field           | Type                            | Required | Meaning                                                  |
| --------------- | ------------------------------- | -------- | -------------------------------------------------------- |
| `formattedName` | `string`                        | Yes      | Display name, written as `FN`                            |
| `name`          | `QRCodeVCardName`               | No       | Structured name, written as `N`                          |
| `organization`  | `string`                        | No       | One organization component, with no department splitting |
| `title`         | `string`                        | No       | Job title                                                |
| `phones`        | `readonly QRCodeVCardPhone[]`   | No       | One `TEL` per entry                                      |
| `emails`        | `readonly QRCodeVCardEmail[]`   | No       | One `EMAIL` per entry, always with `TYPE=INTERNET`       |
| `addresses`     | `readonly QRCodeVCardAddress[]` | No       | One `ADR` per entry                                      |
| `url`           | `string`                        | No       | Absolute HTTP(S) URL                                     |
| `note`          | `string`                        | No       | Multiline TEXT, may be empty                             |

`QRCodeVCardName` contains optional string components in this order:
`familyName`, `givenName`, `additionalNames`, `honorificPrefix`, `honorificSuffix`.
Each component is escaped independently. Empty positions retain their semicolon separators.
A supplied name must contain at least one non-whitespace component.

| Entry type           | Fields                                      | Rules                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QRCodeVCardPhone`   | `number: string`, optional `type`           | Type is `'home'`, `'work'`, `'cell'`, or `'fax'`. Number permits digits, one optional leading `+`, ASCII spaces, and `().-`, with at least one digit. Formatting is preserved. Extensions are unsupported. |
| `QRCodeVCardEmail`   | `address: string`, optional `type`          | Type is `'home'` or `'work'`. Address must contain non-whitespace text. Full email syntax is not validated.                                                                                                |
| `QRCodeVCardAddress` | Optional `type` and string components below | Type is `'home'` or `'work'`. At least one component must contain non-whitespace text.                                                                                                                     |

The seven address components, in order, are `postOfficeBox`, `extendedAddress`,
`streetAddress`, `locality`, `region`, `postalCode`, and `country`.
Empty components retain their positions. Address text may contain escaped line breaks.
Repeated fields preserve array order and duplicates. Empty arrays emit no properties.
Type parameters use uppercase values.

Photos, birthdays, departments, custom labels, preferred entries, and arbitrary properties
are outside this API.

## Calendar events

`calendarPayload()` accepts `QRCodeCalendarPayload`. It returns an iCalendar 2.0
`VCALENDAR` containing one `VEVENT`, with fixed
`PRODID:-//QRCodeSDK//Calendar//EN` and `VERSION:2.0` headers.

| Field         | Type      | Required | Meaning                                                           |
| ------------- | --------- | -------- | ----------------------------------------------------------------- |
| `uid`         | `string`  | Yes      | Caller-supplied globally unique event identifier, escaped as TEXT |
| `timestamp`   | `string`  | Yes      | Explicit-offset instant, written as UTC `DTSTAMP`                 |
| `summary`     | `string`  | Yes      | Event title                                                       |
| `allDay`      | `boolean` | No       | Defaults to `false`; selects date-only start and end when `true`  |
| `start`       | `string`  | Yes      | Inclusive start                                                   |
| `end`         | `string`  | Yes      | Exclusive end, strictly later than start                          |
| `location`    | `string`  | No       | Event location                                                    |
| `description` | `string`  | No       | Multiline TEXT, may be empty                                      |
| `url`         | `string`  | No       | Absolute HTTP(S) URL                                              |

Timed `start`, `end`, and every `timestamp` must use `YYYY-MM-DDTHH:mm:ssZ` or
`YYYY-MM-DDTHH:mm:ss±HH:mm`. Explicit offsets convert to UTC `YYYYMMDDTHHmmssZ`.
The helper never consults the host’s local timezone. Offset conversion preserves the instant,
but does not retain an IANA timezone identity.

With `allDay: true`, `start` and `end` use `YYYY-MM-DD` and serialize as
`DTSTART;VALUE=DATE:YYYYMMDD` and `DTEND;VALUE=DATE:YYYYMMDD`.
A one-day event on December 25 ends on December 26. An explicit end is always required.
The caller supplies UID and timestamp; the helper does not read a clock or generate randomness.

Validation checks Gregorian dates and leap years, clock fields, and offsets.
Years must be `0001` through `9999`, including after UTC conversion. Fractional seconds,
leap seconds, `24:00`, missing offsets, and `-00:00` are rejected. Impossible dates never normalize
to another date. These values remain ordinary TypeScript strings; runtime validation checks them.

Named zones, floating times, `VTIMEZONE`, recurrence, duration, alarms, attendees, organizers,
invitations, and multiple events are outside this API.

## Contact and calendar examples

```ts
import {qrcode} from '@qrcodesdk/core';
import {calendarPayload, vcardPayload} from '@qrcodesdk/core/payload';

const contact = vcardPayload({
  formattedName: 'Zoë Müller',
  name: {givenName: 'Zoë', familyName: 'Müller'},
  phones: [{number: '+43 1 5550123', type: 'work'}],
  emails: [{address: 'zoe@example.com', type: 'work'}],
  note: 'First line\nSecond line',
});

const meeting = calendarPayload({
  uid: 'meeting-20261201@example.com',
  timestamp: '2026-11-14T12:00:00Z',
  summary: 'Project meeting',
  start: '2026-12-01T10:00:00+01:00',
  end: '2026-12-01T11:00:00+01:00',
});

const holiday = calendarPayload({
  uid: 'holiday-20261225@example.com',
  timestamp: '2026-11-14T12:00:00Z',
  summary: 'Holiday',
  allDay: true,
  start: '2026-12-25',
  end: '2026-12-26',
});

qrcode(contact).matrix();
qrcode(meeting).matrix();
qrcode(holiday).matrix();
```

The contact output below shows literal `\n` escapes in the note. Every line, including the last,
ends in CRLF:

```text
BEGIN:VCARD
VERSION:3.0
N:Müller;Zoë;;;
FN:Zoë Müller
TEL;TYPE=WORK:+43 1 5550123
EMAIL;TYPE=INTERNET,WORK:zoe@example.com
NOTE:First line\nSecond line
END:VCARD
```

Use the returned string directly with a framework component:

```tsx
import {vcardPayload} from '@qrcodesdk/core/payload';
import {QRCodeSVG} from '@qrcodesdk/react';

const contact = vcardPayload({formattedName: 'Zoë Müller'});

export function ContactQRCode() {
  return <QRCodeSVG payload={contact} />;
}
```

For explicit UTF-8 signaling, opt in with `qrcode(contact).eci(true).matrix()`.
Japanese text remains Unicode; segmentation and encoding selection belong to the builder.
Use standard QR for these complete payloads. Micro QR byte capacity is insufficient, and the
serializers do not add a fallback.

## Contact and calendar escaping

Both serializers write CRLF between content lines and after the final line. TEXT values escape
backslashes, commas, and semicolons. Colons stay unchanged. Embedded CRLF, LF, and standalone CR
become literal `\n` escapes, so multiline input cannot inject a new property.
Structured name and address components escape before joining with semicolons.

Undefined fields are omitted. Supplied scalar fields must contain non-whitespace text, except
that notes, descriptions, and structured components may be empty. NUL, DEL, unsupported C0 controls,
and unpaired UTF-16 surrogates are rejected. Tabs and escaped line breaks are permitted in TEXT.
Valid Unicode is preserved without normalization, transliteration, or quoted-printable encoding.

URLs use the standard `URL` API for validation and normalization. They must be absolute HTTP(S)
URLs without raw whitespace or controls. They do not use TEXT escaping. Date and time values also
serialize separately from TEXT.

Escaped content lines fold at 75 UTF-8 bytes using CRLF followed by one space. The continuation
space counts toward the next line’s 75-byte limit. Folding never splits a Unicode code point.
Consumers must unfold these continuation lines before parsing properties.

Serialization is deterministic and does not mutate inputs. QR capacity errors remain the builder’s
responsibility.

## Scanner compatibility

vCard 3.0 follows the contact format illustrated by
[ZXing’s scanner guidance](https://github.com/zxing/zxing/wiki/Barcode-Contents), although
[vCard 4.0 supersedes it](https://www.rfc-editor.org/rfc/rfc6350).
The full calendar wrapper follows [iCalendar 2.0](https://www.rfc-editor.org/rfc/rfc5545.html).
These format choices do not guarantee native camera recognition or successful contact/event import.

Automated SVG render/decode tests cover ASCII contacts, folded Unicode contacts, UTC events,
and all-day events with ECI disabled and enabled. They check the complete serialized string,
including folding and CRLF. This establishes QR transport fidelity only.

Manual testing with a ZXing-based scanner and native iOS/Android cameras has not been performed.
No scanner app or OS version, or imported contact/event values, have been verified. Record those
versions and values when testing recognition separately from QR text decoding.

## Validation and return values

All helpers return a `string`. The email, phone, SMS, and Wi-Fi helpers retain their existing
restrictions on NUL, carriage returns, and newlines. Contact and calendar TEXT fields support
escaped line breaks as described above.

Invalid values throw `QRCodeError` with code `INVALID_PAYLOAD` when you call the helper. Its
`details` contain:

- `field`: the rejected field, including nested paths such as `addresses[0].postalCode`;
- `value`: the rejected value. A rejected Wi-Fi password is replaced with `'[REDACTED]'`;
- `reason`: why it was rejected.

See the [errors reference](/reference/errors/#invalid_payload).
