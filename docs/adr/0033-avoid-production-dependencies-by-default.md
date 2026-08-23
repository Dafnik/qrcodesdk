# Avoid production dependencies by default

QRCodeSDK packages avoid production dependencies as a general guideline, not an absolute rule. A
runtime-specific package may depend on a focused library when implementing the capability in-house
would add substantial complexity, as `@qrcodesdk/node` does for PNG encoding; that dependency must
remain inside the package whose runtime and feature require it.
