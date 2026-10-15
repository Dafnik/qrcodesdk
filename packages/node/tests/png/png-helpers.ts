import type {RGBAPixel} from '@repo/core-testing';
import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import sharp from 'sharp';
import {expect} from 'vitest';

export type DecodedPng = {width: number; height: number; data: Buffer};

// Decodes with libvips so renderer output is verified independently of the package's codec.
export async function readPng(input: Buffer): Promise<DecodedPng> {
  const {data, info} = await sharp(input)
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  return {width: info.width, height: info.height, data};
}

export async function decodePngQRCode(input: Buffer): Promise<string> {
  const png = await readPng(input);
  const imageData = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length);
  const result = jsQR(imageData, png.width, png.height, {inversionAttempts: 'dontInvert'});

  if (!result) {
    throw new Error(`Unable to decode ${png.width}x${png.height} PNG`);
  }

  return result.data;
}

export function expectPngToMatchFileSnapshot(png: Buffer, snapshotPath: string): void {
  if (process.env.UPDATE_PNG_SNAPSHOTS === '1') {
    mkdirSync(dirname(snapshotPath), {recursive: true});
    writeFileSync(snapshotPath, png);
  }

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `PNG snapshot does not exist: ${snapshotPath}. Run with UPDATE_PNG_SNAPSHOTS=1 to create it.`,
    );
  }

  expect(png).toEqual(readFileSync(snapshotPath));
}

export function getPngPixel(png: DecodedPng, x: number, y: number): RGBAPixel {
  const index = (png.width * y + x) << 2;

  return {
    red: png.data[index],
    green: png.data[index + 1],
    blue: png.data[index + 2],
    alpha: png.data[index + 3],
  };
}
