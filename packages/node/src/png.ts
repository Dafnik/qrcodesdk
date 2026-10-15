import type {
  QRCodeCenterImageOptions,
  QRCodeMatrix,
  QRCodeRenderer,
  QRCodeVisualStyle,
} from '@qrcodesdk/core';
import {type QRCodeStyledDrawingTarget, createQRCodeStyler} from '@qrcodesdk/core/drawing';
import {QRCodeError} from '@qrcodesdk/core/error';
import {ɵassertKnownKeys as assertKeys} from '@qrcodesdk/core/internal';

import {type PNGImage, decodePNG, encodePNG} from './png-codec';

export type QRCodePNGCenterImageOptions = QRCodeCenterImageOptions<Buffer>;
export type QRCodePNGRendererOptions = {
  readonly style?: QRCodeVisualStyle;
  readonly centerImage?: QRCodePNGCenterImageOptions;
  readonly compression?: {readonly level?: number};
};

const MAX_CENTER_IMAGE_BYTES = 16 * 1024 * 1024;
const MAX_CENTER_IMAGE_PIXELS = 16_777_216;

export function QRCodePNGRenderer(options?: QRCodePNGRendererOptions): QRCodeRenderer<Buffer> {
  assertKeys(options, 'options', ['style', 'centerImage', 'compression']);
  assertKeys(options?.centerImage, 'centerImage', ['source', 'size', 'padding', 'clearBackground']);
  assertKeys(options?.compression, 'compression', ['level']);
  const styler = createQRCodeStyler(options?.style);
  const hasCenterImage = !!options?.centerImage;
  const {source, ...centerImageLayout} = options?.centerImage ?? {};
  const compressionLevel = resolveCompressionLevel(options?.compression?.level);
  if (hasCenterImage) styler.draw([[1]]).placeCenterImage(centerImageLayout);

  return (matrix: QRCodeMatrix) => {
    const drawing = styler.draw(matrix);
    const png: PNGImage = {
      width: drawing.outputSize,
      height: drawing.outputSize,
      data: Buffer.alloc(4 * drawing.outputSize * drawing.outputSize),
    };
    const target = new PNGDrawingTarget(png, drawing.moduleSize);
    drawing.paint(target);

    if (hasCenterImage) {
      const image = decodeImageSource(source!);
      const {centerImage, clear} = drawing.placeCenterImage(centerImageLayout);
      if (clear) target.clearImageArea(clear);
      compositeImage(
        png,
        image,
        centerImage.x * drawing.moduleSize,
        centerImage.y * drawing.moduleSize,
        centerImage.size * drawing.moduleSize,
      );
    }
    return encodePNG(png, compressionLevel);
  };
}

type Color = {red: number; green: number; blue: number; alpha: number};

class PNGDrawingTarget implements QRCodeStyledDrawingTarget {
  private background: Color = {red: 255, green: 255, blue: 255, alpha: 255};
  private color: Color = {red: 0, green: 0, blue: 0, alpha: 255};
  private coverage: Uint16Array | undefined;
  private points: number[] = [];
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;

  constructor(
    private readonly png: PNGImage,
    private readonly scale: number,
  ) {}

  drawBackground(red: number, green: number, blue: number, alpha: number): void {
    this.background = {red, green, blue, alpha};
    fillRect(this.png, 0, 0, this.png.width, this.png.height, this.background);
  }

  beginLayer(red: number, green: number, blue: number, alpha: number): void {
    this.color = {red, green, blue, alpha};
  }

  drawRectangle(x: number, y: number, width: number, height: number): void {
    fillRect(
      this.png,
      x * this.scale,
      y * this.scale,
      width * this.scale,
      height * this.scale,
      this.color,
    );
  }

  beginPath(): void {
    this.coverage = new Uint16Array(this.png.width * this.png.height);
  }

  moveTo(x: number, y: number): void {
    if (this.points.length > 0) this.flushSubpath();
    this.startX = this.currentX = x * this.scale;
    this.startY = this.currentY = y * this.scale;
    this.points.push(this.currentX, this.currentY);
  }

  lineTo(x: number, y: number): void {
    this.currentX = x * this.scale;
    this.currentY = y * this.scale;
    this.points.push(this.currentX, this.currentY);
  }

  arc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ): void {
    let delta = endAngle - startAngle;
    if (counterclockwise) {
      while (delta >= 0) delta -= Math.PI * 2;
    } else {
      while (delta <= 0) delta += Math.PI * 2;
    }
    const steps = Math.max(4, Math.ceil((Math.abs(delta) * radius * this.scale) / 2));
    for (let index = 1; index <= steps; index++) {
      const angle = startAngle + (delta * index) / steps;
      this.currentX = (centerX + Math.cos(angle) * radius) * this.scale;
      this.currentY = (centerY + Math.sin(angle) * radius) * this.scale;
      this.points.push(this.currentX, this.currentY);
    }
  }

  closePath(): void {
    if (this.currentX !== this.startX || this.currentY !== this.startY) {
      this.points.push(this.startX, this.startY);
    }
    this.flushSubpath();
  }

  endPath(): void {
    this.flushSubpath();
    const coverage = this.coverage;
    if (!coverage) return;
    for (let index = 0; index < coverage.length; index++) {
      const mask = coverage[index]!;
      if (mask === 0) continue;
      blendPixel(this.png, index, this.color, popcount(mask) / 16);
    }
    this.coverage = undefined;
  }

  endLayer(): void {}

  clearImageArea(area: {x: number; y: number; size: number}): void {
    clearRect(
      this.png,
      area.x * this.scale,
      area.y * this.scale,
      area.size * this.scale,
      area.size * this.scale,
    );
    fillRect(
      this.png,
      area.x * this.scale,
      area.y * this.scale,
      area.size * this.scale,
      area.size * this.scale,
      this.background,
    );
  }

  private flushSubpath(): void {
    const coverage = this.coverage;
    if (!coverage || this.points.length < 6) {
      this.points.length = 0;
      return;
    }
    let minimumX = Infinity;
    let minimumY = Infinity;
    let maximumX = -Infinity;
    let maximumY = -Infinity;
    for (let index = 0; index < this.points.length; index += 2) {
      minimumX = Math.min(minimumX, this.points[index]!);
      maximumX = Math.max(maximumX, this.points[index]!);
      minimumY = Math.min(minimumY, this.points[index + 1]!);
      maximumY = Math.max(maximumY, this.points[index + 1]!);
    }
    const startX = Math.max(0, Math.floor(minimumX));
    const endX = Math.min(this.png.width, Math.ceil(maximumX));
    const startY = Math.max(0, Math.floor(minimumY));
    const endY = Math.min(this.png.height, Math.ceil(maximumY));
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        let sampleMask = 0;
        for (let sampleY = 0; sampleY < 4; sampleY++) {
          for (let sampleX = 0; sampleX < 4; sampleX++) {
            if (insidePolygon(x + (sampleX + 0.5) / 4, y + (sampleY + 0.5) / 4, this.points)) {
              sampleMask |= 1 << (sampleY * 4 + sampleX);
            }
          }
        }
        const coverageIndex = y * this.png.width + x;
        coverage[coverageIndex] = coverage[coverageIndex]! ^ sampleMask;
      }
    }
    this.points.length = 0;
  }
}

function insidePolygon(x: number, y: number, points: readonly number[]): boolean {
  let inside = false;
  for (let index = 0, previous = points.length - 2; index < points.length; index += 2) {
    const x1 = points[index]!;
    const y1 = points[index + 1]!;
    const x2 = points[previous]!;
    const y2 = points[previous + 1]!;
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
    previous = index;
  }
  return inside;
}

function popcount(value: number): number {
  value -= (value >>> 1) & 0x5555;
  value = (value & 0x3333) + ((value >>> 2) & 0x3333);
  value = (value + (value >>> 4)) & 0x0f0f;
  return (value + (value >>> 8)) & 0x1f;
}

function fillRect(
  png: PNGImage,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Color,
): void {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(png.width, Math.ceil(x + width));
  const endY = Math.min(png.height, Math.ceil(y + height));
  for (let row = startY; row < endY; row++) {
    for (let column = startX; column < endX; column++) {
      blendPixel(png, row * png.width + column, color, 1);
    }
  }
}

function clearRect(png: PNGImage, x: number, y: number, width: number, height: number): void {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(png.width, Math.ceil(x + width));
  const endY = Math.min(png.height, Math.ceil(y + height));
  for (let row = startY; row < endY; row++) {
    png.data.fill(0, (row * png.width + startX) * 4, (row * png.width + endX) * 4);
  }
}

function blendPixel(png: PNGImage, pixelIndex: number, color: Color, coverage: number): void {
  const index = pixelIndex * 4;
  const sourceAlpha = (color.alpha / 255) * coverage;
  const destinationAlpha = png.data[index + 3]! / 255;
  const outputAlpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (outputAlpha === 0) {
    png.data.fill(0, index, index + 4);
    return;
  }
  const destinationWeight = destinationAlpha * (1 - sourceAlpha);
  png.data[index] = Math.round(
    (color.red * sourceAlpha + png.data[index]! * destinationWeight) / outputAlpha,
  );
  png.data[index + 1] = Math.round(
    (color.green * sourceAlpha + png.data[index + 1]! * destinationWeight) / outputAlpha,
  );
  png.data[index + 2] = Math.round(
    (color.blue * sourceAlpha + png.data[index + 2]! * destinationWeight) / outputAlpha,
  );
  png.data[index + 3] = Math.round(outputAlpha * 255);
}

function decodeImageSource(source: Buffer): PNGImage {
  if (!Buffer.isBuffer(source)) {
    throw new QRCodeError(
      'INVALID_IMAGE_SOURCE',
      'QR code PNG image source must be a Buffer containing PNG bytes',
    );
  }
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

function compositeImage(
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

function resolveCompressionLevel(value: number | undefined): number {
  const level = value ?? 9;
  if (!Number.isSafeInteger(level) || level < 0 || level > 9) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code compression.level must be an integer from 0 to 9, received ${String(level)}`,
      {details: {field: 'compression.level', value: level}},
    );
  }
  return level;
}
