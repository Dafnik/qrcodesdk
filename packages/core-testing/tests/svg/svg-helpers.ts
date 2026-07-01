import jsQR from 'jsqr';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {PNG} from 'pngjs';
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

export function renderSvgRectsToPng(svg: string): PNG {
  const svgAttrs = extractSvgAttrs(svg);
  const width = Number(svgAttrs.width);
  const height = Number(svgAttrs.height);

  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`SVG width and height must be integers, received ${width}x${height}`);
  }

  const png = new PNG({width, height});
  png.data.fill(0xff);

  for (const rect of extractRects(svg)) {
    const fill = parseHexColor(rect.attrs.fill);
    const x = Math.floor(Number(rect.attrs.x ?? 0));
    const y = Math.floor(Number(rect.attrs.y ?? 0));
    const rectWidth = Math.ceil(Number(rect.attrs.width));
    const rectHeight = Math.ceil(Number(rect.attrs.height));

    for (let row = y; row < Math.min(y + rectHeight, height); row++) {
      for (let column = x; column < Math.min(x + rectWidth, width); column++) {
        const index = (width * row + column) << 2;
        png.data[index] = fill.red;
        png.data[index + 1] = fill.green;
        png.data[index + 2] = fill.blue;
        png.data[index + 3] = 0xff;
      }
    }
  }

  return png;
}

export function decodeSvgQRCode(svg: string): string {
  const png = renderSvgRectsToPng(svg);
  const imageData = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length);
  const result = jsQR(imageData, png.width, png.height, {inversionAttempts: 'dontInvert'});

  if (!result) {
    throw new Error(`Unable to decode SVG QR code rendered to ${png.width}x${png.height} PNG`);
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

function parseHexColor(value: string | undefined): {red: number; green: number; blue: number} {
  if (!value) throw new Error('SVG rect is missing a fill attribute');

  const match = value.match(/^#([0-9a-f]{6})$/i);
  if (!match) throw new Error(`Only 6-digit hex colors are supported, received ${value}`);

  return {
    red: Number.parseInt(match[1].slice(0, 2), 16),
    green: Number.parseInt(match[1].slice(2, 4), 16),
    blue: Number.parseInt(match[1].slice(4, 6), 16),
  };
}
