# Use payload and options in framework components

Framework components permanently accept one `payload` property and one `options` property for QR
code behavior. They do not duplicate renderer and matrix options as individual component properties,
which keeps the options model consistent across frameworks and avoids collisions with ordinary
component-host attributes such as `title`. Matrix options are nested under `options.matrix`;
renderer concerns such as `style`, `accessibility`, and `centerImage` remain adjacent to it and are passed
only to the owning renderer.
