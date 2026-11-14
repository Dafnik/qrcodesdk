---
'@qrcodesdk/core': patch
---

Add the `vcardPayload()` and `calendarPayload()` payload helpers to `@qrcodesdk/core/payload`. `vcardPayload()` serializes a contact as a vCard 3.0 payload with a formatted name and optional structured name, organization, title, phones, emails, addresses, URL, and note. `calendarPayload()` serializes an event as an iCalendar 2.0 `VEVENT` with a UID, timestamp, summary, start, end, and optional location, description, and URL. Set `allDay: true` to pass `YYYY-MM-DD` dates instead of date-times; the end is exclusive.

Both helpers escape text values, fold long lines, and throw `QRCodeError` with code `INVALID_PAYLOAD` for invalid fields, such as line breaks in single-line fields, unsupported control characters, non-HTTP(S) URLs, date-times without seconds or an explicit offset, or an end that is not later than the start. Errors for nested fields use paths such as `addresses[0].postalCode` in `details.field`. URL fields require the standard `URL` API. Add the `QRCodeVCardPayload`, `QRCodeVCardName`, `QRCodeVCardPhone`, `QRCodeVCardEmail`, `QRCodeVCardAddress`, and `QRCodeCalendarPayload` types.
