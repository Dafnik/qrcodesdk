# Keep library packages silent

QRCodeSDK library packages do not write runtime warnings to the console. Invalid input throws a
machine-readable error, while risky valid choices and deprecations are communicated through types,
documentation, and release notes because console warnings are easy to miss and add unwanted output
to consuming applications.
