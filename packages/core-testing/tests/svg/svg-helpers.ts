import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import sharp from 'sharp';
import {expect} from 'vitest';

export type SvgRect = {
  tag: string;
  attrs: Record<string, string>;
};

export function extractSvgAttrs(svg: string): Record<string, string> {
  const match = svg.match(/<svg\b([\s\S]*?)>/);
  if (!match) throw new Error('SVG root element was not found');
  return parseAttrs(match[1]);
}

export function extractRects(svg: string): SvgRect[] {
  return Array.from(svg.matchAll(/<rect\b([^>]*)\/>/g), ([tag, attrs]) => ({
    tag,
    attrs: parseAttrs(attrs),
  }));
}

export async function decodeSvgQRCode(svg: string): Promise<string> {
  const {data, info} = await sharp(Buffer.from(svg))
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});
  const imageData = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
  const result = jsQR(imageData, info.width, info.height, {inversionAttempts: 'dontInvert'});

  if (!result) {
    throw new Error(`Unable to decode SVG QR code rendered to ${info.width}x${info.height} PNG`);
  }

  return result.data;
}

export function expectSvgToMatchFileSnapshot(svg: string, snapshotPath: string): void {
  if (process.env.UPDATE_SVG_SNAPSHOTS === '1') {
    mkdirSync(dirname(snapshotPath), {recursive: true});
    writeFileSync(snapshotPath, svg);
  }

  if (!existsSync(snapshotPath)) {
    throw new Error(
      `SVG snapshot does not exist: ${snapshotPath}. Run with UPDATE_SVG_SNAPSHOTS=1 to create it.`,
    );
  }

  expect(svg).toBe(readFileSync(snapshotPath, 'utf8'));
}

export function parseAttrs(rawAttrs: string): Record<string, string> {
  return Object.fromEntries(
    Array.from(rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g), ([, key, value]) => [key, value]),
  );
}
