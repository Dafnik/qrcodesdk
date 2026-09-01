# Use data and options as framework component inputs

Framework components permanently accept one `data` input and one `options` input for QR code
behavior. They do not duplicate renderer and matrix settings as individual component props, which
keeps the configuration model consistent across frameworks and avoids collisions with ordinary
component-host attributes such as `title`.
