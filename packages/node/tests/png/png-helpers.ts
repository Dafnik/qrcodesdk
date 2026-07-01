import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {PNG} from 'pngjs';
import {expect} from 'vitest';

export type RGBAPixel = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

export function decodePngQRCode(input: Buffer | PNG): string {
  const png = Buffer.isBuffer(input) ? PNG.sync.read(input) : input;
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

export function getPngPixel(png: PNG, x: number, y: number): RGBAPixel {
  const index = (png.width * y + x) << 2;

  return {
    red: png.data[index],
    green: png.data[index + 1],
    blue: png.data[index + 2],
    alpha: png.data[index + 3],
  };
}
