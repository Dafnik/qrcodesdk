# Publish library packages as ESM only

QRCodeSDK library packages support native ESM only and do not publish parallel CommonJS builds.
CommonJS is treated as an outdated module format; consumers in CommonJS environments must use a
compatible dynamic import or build tool rather than adding dual-package complexity to QRCodeSDK.
