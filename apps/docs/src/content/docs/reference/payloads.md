---
title: Payload helpers
description: Serialize typed email, phone, SMS, geographic, and Wi-Fi values for qrcode().
docType: reference
---

Core exports small serializers for payload formats that scanners commonly understand. Each helper
returns the string passed to `qrcode()`.

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

`wifiPayload` defaults to `WPA` when a password is present and `nopass` when it is absent. Set
`encryption: 'WEP'` for a WEP network or `hidden: true` for a hidden network. The serializer escapes
Wi-Fi delimiter characters in the SSID and password.

## Available helpers

| Helper         | Input type           | Output convention |
| -------------- | -------------------- | ----------------- |
| `emailPayload` | `QRCodeEmailPayload` | RFC 6068 `mailto` |
| `phonePayload` | `QRCodePhonePayload` | RFC 3966 `tel`    |
| `smsPayload`   | `QRCodeSMSPayload`   | RFC 5724 `sms`    |
| `geoPayload`   | `QRCodeGeoPayload`   | RFC 5870 `geo`    |
| `wifiPayload`  | `QRCodeWiFiPayload`  | Wi-Fi QR payload  |

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
addresses and query values while preserving the `@` in recipient addresses.

| Field     | Type                          | Required | Meaning                         |
| --------- | ----------------------------- | -------- | ------------------------------- |
| `to`      | `string \| readonly string[]` | Yes      | One or more recipient addresses |
| `cc`      | `string \| readonly string[]` | No       | Copy recipients                 |
| `bcc`     | `string \| readonly string[]` | No       | Blind-copy recipients           |
| `subject` | `string`                      | No       | Subject line; may be empty      |
| `body`    | `string`                      | No       | Message body; may be empty      |

Recipient lists must contain at least one non-empty string. The helper does not check email-address
syntax. Omitted optional fields do not appear in the output.

## Phone fields

`phonePayload()` accepts `QRCodePhonePayload` and returns a `tel:` string.

| Field       | Type     | Required | Meaning                                                                                       |
| ----------- | -------- | -------- | --------------------------------------------------------------------------------------------- |
| `number`    | `string` | Yes      | Phone number containing digits, an optional leading `+`, and separators `(`, `)`, `.`, or `-` |
| `extension` | `string` | No       | One or more digits, appended as `;ext=...`                                                    |

The number must contain at least one digit. An omitted extension adds no `ext` parameter.

## SMS fields

`smsPayload()` accepts `QRCodeSMSPayload` and returns an `sms:` string.

| Field        | Type                          | Required | Meaning                                                         |
| ------------ | ----------------------------- | -------- | --------------------------------------------------------------- |
| `recipients` | `string \| readonly string[]` | Yes      | One or more phone numbers using the phone helper's number rules |
| `body`       | `string`                      | No       | Percent-encoded message body; may be empty                      |

Recipient arrays must not be empty. Multiple recipients are comma-separated. An omitted body adds
no query string; an empty body adds `?body=`.

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

`'WPA'` and `'WEP'` require a supplied password. `'nopass'` rejects a supplied password, including an
empty string. The helper escapes backslashes, semicolons, commas, colons, and quotation marks in
the SSID and password.

## Validation and return values

All helpers return a `string`. Text fields reject NUL, carriage returns, and newlines. Invalid
structured values throw `QRCodeError` with code `INVALID_PAYLOAD`.

The helpers serialize only. Pass their result to `qrcode()` to generate a matrix or rendered output.
