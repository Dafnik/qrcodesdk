# Use broad machine-readable error codes

Expected failures across QRCodeSDK packages use one shared `QRCodeError` class exported by
`@qrcodesdk/core`, with a stable `code`, structured `details`, and an optional `cause`. Codes use the
small set `INVALID_INPUT`, `DATA_TOO_LARGE`, `INVALID_OPTIONS`, `RENDERER_MISSING`,
`INVALID_IMAGE_SOURCE`, and `RENDER_FAILED`; individual fields and reasons belong in `details` so
applications can handle broad categories without freezing every validation branch into the
compatibility contract.
