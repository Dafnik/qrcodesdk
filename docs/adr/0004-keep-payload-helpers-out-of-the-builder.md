# Keep payload helpers out of the builder

Typed payload helpers serialize format-specific fields into QR code payloads and do not create or
configure `QRCodeBuilder`. Developers pass the serialized result to `qrcode()`, which keeps payload
semantics separate from symbol generation and prevents every supported payload format from adding
methods to the builder API.
