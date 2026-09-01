# Trust renderer matrix input

Built-in renderers accept valid matrices produced by QRCodeSDK and do not validate arbitrary
hand-authored matrix shapes or module values. Malformed matrices are unsupported, which avoids a
full validation pass on every render while leaving custom output available through the documented
matrix and renderer contracts.
