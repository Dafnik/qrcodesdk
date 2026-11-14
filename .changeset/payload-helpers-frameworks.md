---
'@qrcodesdk/angular': patch
'@qrcodesdk/react': patch
'@qrcodesdk/svelte': patch
'@qrcodesdk/vue': patch
---

Re-export the payload helpers `calendarPayload`, `emailPayload`, `geoPayload`, `phonePayload`, `smsPayload`, `vcardPayload`, and `wifiPayload` together with their types from `@qrcodesdk/core/payload`, so framework projects no longer need to add Core to build payloads such as `wifiPayload({ssid: 'Office', password: 'secret'})`.
