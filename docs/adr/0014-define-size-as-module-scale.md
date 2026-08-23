# Define size as module scale

The visual `size` option remains a positive integer scale per QR code module rather than a fixed
final width. This keeps raster modules aligned to whole pixels and avoids a second fixed-width sizing
model, accepting that rendered dimensions grow when the payload requires a larger symbol version.
