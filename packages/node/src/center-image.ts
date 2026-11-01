import {QRCodeError} from '@qrcodesdk/core/error';

import {blendPixel} from './pixels';
import {type PNGImage, decodePNG} from './png-codec';

const MAX_CENTER_IMAGE_BYTES = 16 * 1024 * 1024;
const MAX_CENTER_IMAGE_PIXELS = 16_777_216;

/** Validates and decodes center-image PNG bytes. */
export function decodeImageSource(source: Uint8Array): PNGImage {
  // View plain byte arrays as a Buffer without copying them.
  const bytes = Buffer.isBuffer(source)
    ? source
    : Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  return decodeImageBytes(bytes);
}

function decodeImageBytes(source: Buffer): PNGImage {
  if (source.length > MAX_CENTER_IMAGE_BYTES) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      `QR code PNG image source must not exceed ${MAX_CENTER_IMAGE_BYTES} bytes`,
    );
  }
  assertPngDimensions(source);
  try {
    const image = decodePNG(source);
    assertImageDimensions(image.width, image.height);
    return image;
  } catch (error) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code PNG image source must contain valid PNG bytes',
      {cause: error},
    );
  }
}

function assertPngDimensions(source: Buffer): void {
  if (
    source.length < 24 ||
    source.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    source.readUInt32BE(8) !== 13 ||
    source.subarray(12, 16).toString('ascii') !== 'IHDR'
  ) {
    return;
  }
  assertImageDimensions(source.readUInt32BE(16), source.readUInt32BE(20));
}

function assertImageDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > MAX_CENTER_IMAGE_PIXELS
  ) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      `QR code PNG image source must not exceed ${MAX_CENTER_IMAGE_PIXELS} pixels`,
    );
  }
}

/** Draws an image into a square box, keeping its aspect ratio. */
export function compositeImage(
  target: PNGImage,
  source: PNGImage,
  boxX: number,
  boxY: number,
  boxSize: number,
): void {
  const scale = Math.min(boxSize / source.width, boxSize / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const startX = Math.round(boxX + (boxSize - width) / 2);
  const startY = Math.round(boxY + (boxSize - height) / 2);
  for (let y = 0; y < height; y++) {
    const targetY = startY + y;
    if (targetY < 0 || targetY >= target.height) continue;
    const sourceY = Math.min(source.height - 1, Math.floor((y * source.height) / height));
    for (let x = 0; x < width; x++) {
      const targetX = startX + x;
      if (targetX < 0 || targetX >= target.width) continue;
      const sourceX = Math.min(source.width - 1, Math.floor((x * source.width) / width));
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      blendPixel(
        target,
        targetY * target.width + targetX,
        {
          red: source.data[sourceIndex]!,
          green: source.data[sourceIndex + 1]!,
          blue: source.data[sourceIndex + 2]!,
          alpha: source.data[sourceIndex + 3]!,
        },
        1,
      );
    }
  }
}
