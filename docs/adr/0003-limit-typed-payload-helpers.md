# Limit typed payload helpers to established formats

QRCodeSDK may provide typed helpers only for open, widely implemented payload formats with a stable
formal specification or a documented, stable de facto convention backed by major scanners. This
includes formats such as the widely supported Wi-Fi convention, while preventing the SDK from
becoming a collection of serializers for proprietary, unstable, or narrowly used payloads.
