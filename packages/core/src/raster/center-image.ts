import {type QRCodeCenterImageBox, createQRCodeCenterImagePlacement} from '../drawing/center-image';
import type {QRCodeDrawing, QRCodeStylePart} from '../drawing/types';
import {QRCodeError} from '../error';
import type {QRCodeCenterImageLayout} from '../types';
import {blendPixel} from './blend';
import {type DecodedImage, type Inflate, MAX_PNG_PIXELS, decodePNG, readPNGDimensions} from './png';
import type {RGBAImage} from './types';

/** Clears the modules behind a raster center image and draws it into the rendered pixels. */
export type RasterCenterImageRenderer = {
  readonly part: QRCodeStylePart;
  draw(image: RGBAImage, drawing: QRCodeDrawing): void;
};

const MAX_CENTER_IMAGE_BYTES = 16 * 1024 * 1024;

/**
 * Validates the layout and PNG bytes of a raster center image, decodes them once, and returns its
 * renderer. `inflate` decompresses the PNG data.
 */
export function createRasterCenterImage(
  source: Uint8Array,
  layout: QRCodeCenterImageLayout | undefined,
  inflate: Inflate,
): RasterCenterImageRenderer {
  const {part, place} = createQRCodeCenterImagePlacement(
    layout,
    undefined,
    () => image.width / image.height,
  );
  const image = decodeImageSource(source, inflate);
  return {
    part,
    draw(target, drawing) {
      compositeImage(target, image, place(drawing), drawing.moduleSize);
    },
  };
}

function decodeImageSource(source: Uint8Array, inflate: Inflate): DecodedImage {
  if (source.length > MAX_CENTER_IMAGE_BYTES) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      `QR code PNG image source must not exceed ${MAX_CENTER_IMAGE_BYTES} bytes`,
    );
  }
  const dimensions = readPNGDimensions(source);
  if (dimensions) assertImageDimensions(dimensions.width, dimensions.height);
  try {
    const image = decodePNG(source, inflate);
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

function assertImageDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > MAX_PNG_PIXELS
  ) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      `QR code PNG image source must not exceed ${MAX_PNG_PIXELS} pixels`,
    );
  }
}

/** Composites the fitted image into the output pixels. */
function compositeImage(
  target: RGBAImage,
  source: DecodedImage,
  box: QRCodeCenterImageBox,
  moduleSize: number,
): void {
  const fittedWidth = box.width * moduleSize;
  const fittedHeight = box.height * moduleSize;
  const width = Math.max(1, Math.round(fittedWidth));
  const height = Math.max(1, Math.round(fittedHeight));
  const startX = Math.round(box.x * moduleSize + (fittedWidth - width) / 2);
  const startY = Math.round(box.y * moduleSize + (fittedHeight - height) / 2);
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
