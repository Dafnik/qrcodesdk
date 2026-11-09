---
title: Payload helpers
description: Serialize typed email, phone, SMS, geographic, and Wi-Fi values for qrcode().
docType: reference

related:
  - ./builder.mdx
  - ./errors.md
  - ../packages/core.mdx
  - ../getting-started/choose-your-setup.mdx
---

Core exports small serializers for payload formats that scanners commonly understand. Each helper
returns the string passed to `qrcode()`. Helpers only build the payload text; set encoding options
on the [builder](/reference/builder/#payload).

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

Helpers throw `INVALID_PAYLOAD` when you call them, outside the component. For values that users
enter, call the helper in a `try`/`catch` before rendering, as
[Validate before rendering](/reference/errors/#validate-before-rendering) shows.

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
syntax. Omitted optional fields do not appear in the output. `subject` and `body` reject line breaks,
so a multi-line `body` throws `INVALID_PAYLOAD`. Pass the body as a single line.

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
structured values throw `QRCodeError` with code `INVALID_PAYLOAD` when you call the helper. Its
`details` name the `field`, the rejected `value`, and the `reason`; a rejected Wi-Fi password is
replaced with `'[REDACTED]'`. See the [errors reference](/reference/errors/#invalid_payload).
