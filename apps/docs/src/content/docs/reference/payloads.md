---
title: Payload helpers
description: Serialize typed email, phone, SMS, geographic, and Wi-Fi values for qrcode().
---

Core exports small serializers for payload formats that scanners commonly understand. Each helper
returns the string passed to `qrcode()`.

```ts
import {qrcode, wifiPayload} from '@qrcodesdk/core';

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
import {emailPayload, geoPayload, phonePayload, smsPayload} from '@qrcodesdk/core';

emailPayload({
  to: 'hello@example.com',
  subject: 'Hello',
  body: 'Sent from a QR code',
});

phonePayload({number: '+1-201-555-0123', extension: '456'});
smsPayload({recipients: '+12015550123', body: 'Meet at 10?'});
geoPayload({latitude: 48.2082, longitude: 16.3738});
```

Invalid structured values throw `QRCodeError` with code `INVALID_INPUT`. The helpers serialize only;
they do not add builder methods or change matrix generation.
