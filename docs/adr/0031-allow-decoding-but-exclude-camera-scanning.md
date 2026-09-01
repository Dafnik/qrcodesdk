# Allow a future decoder but exclude camera scanning

A separate first-party decoder package may eventually accept caller-prepared image data and extract
QR payloads, but no such package is currently planned. Camera acquisition, media permissions,
continuous scanning, and scanning UI remain outside QRCodeSDK's scope, so the project uses
"decoder" rather than "scanner" for the possible capability.
