import type {RGBAPixel} from '@repo/core-testing';
import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import sharp from 'sharp';
import {expect} from 'vitest';

export type DecodedRaster = {width: number; height: number; data: Buffer};

// Decodes PNG, WebP, and GIF with libvips so output is verified independently of the encoders.
export async function readRaster(input: Buffer): Promise<DecodedRaster> {
  const {data, info} = await sharp(input)
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return {width: info.width, height: info.height, data};
}

// Scans the code as displayed on a white page, so transparent backgrounds stay light.
export async function decodeRasterQRCode(input: Buffer): Promise<string> {
  const png = await readRaster(
    await sharp(input).flatten({background: '#ffffff'}).png().toBuffer(),
  );
  const imageData = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length);
  const result = jsQR(imageData, png.width, png.height, {inversionAttempts: 'dontInvert'});

  if (!result) {
    throw new Error(`Unable to decode ${png.width}x${png.height} image`);
  }

  return result.data;
}

export type RasterFormat = 'PNG' | 'WebP' | 'GIF';

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
