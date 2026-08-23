# Do not acquire input resources during rendering

QRCodeSDK generation and built-in rendering never fetch URLs, read file paths, or decode unloaded
image sources. Developers prepare input resources before rendering, which keeps input handling
synchronous and predictable; explicitly selected output side effects such as browser download
renderers remain allowed.
