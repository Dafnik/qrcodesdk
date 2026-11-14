import type {RGBAPixel} from '@repo/core-testing';
import {
  type QRCodeScan,
  type QRCodeScanFormat,
  decodeQRCode,
} from '@repo/core-testing/decoder/node';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import sharp from 'sharp';
import {expect} from 'vitest';

export type DecodedRaster = {width: number; height: number; data: Buffer};

// Decodes PNG, WebP, GIF, and JPEG with libvips so output is verified independently of the encoders.
export async function readRaster(input: Buffer): Promise<DecodedRaster> {
  const {data, info} = await sharp(input)
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return {width: info.width, height: info.height, data};
}

/** Scans the code as displayed on a white page, so transparent backgrounds stay light. */
export async function scanRasterQRCode(
  input: Buffer,
  format: QRCodeScanFormat = 'QRCodeModel2',
): Promise<QRCodeScan> {
  // PNG keeps a second lossy encoding of JPEG and WebP input out of the scan.
  const raster = await readRaster(
    await sharp(input).flatten({background: '#ffffff'}).png().toBuffer(),
  );
  return decodeQRCode(new Uint8ClampedArray(raster.data), raster.width, raster.height, format);
}

/** Scans a QR code and returns its text. */
export async function decodeRasterQRCode(input: Buffer): Promise<string> {
  return (await scanRasterQRCode(input)).text;
}

/** Scans a Micro QR code. */
export function decodeRasterMicroQRCode(input: Buffer): Promise<QRCodeScan> {
  return scanRasterQRCode(input, 'MicroQRCode');
}

export type RasterFormat = 'PNG' | 'WebP' | 'GIF' | 'JPEG';

/** Compares bytes with a tracked file, which `UPDATE_<FORMAT>_SNAPSHOTS=1` rewrites. */
export function expectRasterToMatchFileSnapshot(
  format: RasterFormat,
  bytes: Buffer,
  snapshotPath: string,
): void {
  const updateFlag = `UPDATE_${format.toUpperCase()}_SNAPSHOTS`;
  if (process.env[updateFlag] === '1') {
    mkdirSync(dirname(snapshotPath), {recursive: true});
    writeFileSync(snapshotPath, bytes);
  }

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `${format} snapshot does not exist: ${snapshotPath}. Run with ${updateFlag}=1 to create it.`,
    );
  }

  expect(bytes).toEqual(readFileSync(snapshotPath));
}

export function getRasterPixel(png: DecodedRaster, x: number, y: number): RGBAPixel {
  const index = (png.width * y + x) << 2;

  return {
    red: png.data[index],
    green: png.data[index + 1],
    blue: png.data[index + 2],
    alpha: png.data[index + 3],
  };
}
