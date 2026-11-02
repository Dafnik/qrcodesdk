/** Deterministic RGBA pixels for center-image fixtures. */
export type QRCodeFixtureImage = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
};

type Pixel = readonly [red: number, green: number, blue: number, alpha: number];

function createImage(
  name: string,
  width: number,
  height: number,
  pixel: (x: number, y: number) => Pixel,
): QRCodeFixtureImage {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data.set(pixel(x, y), (y * width + x) * 4);
  }
  return {name, width, height, data};
}

/** A square red logo with a white cross and transparent corners. */
export const LOGO_IMAGE = createImage('logo', 32, 32, (x, y) => {
  const corner = Math.min(x, 31 - x) + Math.min(y, 31 - y) < 6;
  if (corner) return [0, 0, 0, 0];
  if ((x >= 13 && x <= 18) || (y >= 13 && y <= 18)) return [255, 255, 255, 255];
  return [220, 38, 38, 255];
});

/** A landscape image with vertical stripes, centered vertically inside the square box. */
export const WIDE_IMAGE = createImage('wide', 48, 16, (x) =>
  Math.floor(x / 8) % 2 ? [29, 78, 216, 255] : [249, 115, 22, 255],
);

/** A portrait image with a vertical gradient, centered horizontally inside the square box. */
export const TALL_IMAGE = createImage('tall', 16, 40, (_x, y) => [
  22,
  Math.round(80 + (y / 39) * 160),
  74,
  255,
]);

/** A photo-like image with 4096 colors. */
export const GRADIENT_IMAGE = createImage('gradient', 64, 64, (x, y) => [
  x * 4,
  y * 4,
  ((x + y) * 2) % 256,
  255,
]);

/** A partially transparent image that lets modules show through. */
export const TRANSLUCENT_IMAGE = createImage('translucent', 24, 24, (x, y) =>
  (x + y) % 2 ? [15, 23, 42, 128] : [15, 23, 42, 64],
);

/** Encodes RGBA pixels as an uncompressed PNG, so fixture bytes never depend on a compressor. */
export function encodeFixturePNG({width, height, data}: QRCodeFixtureImage): Uint8Array {
  const rowLength = width * 4 + 1;
  const rows = new Uint8Array(rowLength * height);
  for (let y = 0; y < height; y++) {
    rows.set(data.subarray(y * width * 4, (y + 1) * width * 4), y * rowLength + 1);
  }

  // A zlib stream of stored deflate blocks.
  const zlib: number[] = [0x78, 0x01];
  for (let offset = 0; offset < rows.length || offset === 0; offset += 0xffff) {
    const block = rows.subarray(offset, offset + 0xffff);
    const final = offset + 0xffff >= rows.length ? 1 : 0;
    zlib.push(final, block.length & 0xff, block.length >>> 8);
    zlib.push(~block.length & 0xff, (~block.length >>> 8) & 0xff, ...block);
  }
  let a = 1;
  let b = 0;
  for (const byte of rows) {
    a = (a + byte) % 65_521;
    b = (b + a) % 65_521;
  }
  zlib.push(...uint32(((b << 16) | a) >>> 0));

  const header = [...uint32(width), ...uint32(height), 8, 6, 0, 0, 0];
  return Uint8Array.from([
    ...[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    ...chunk('IHDR', header),
    ...chunk('IDAT', zlib),
    ...chunk('IEND', []),
  ]);
}

/** Returns an image as a PNG data URL for SVG center images. */
export function fixtureImageDataURL(image: QRCodeFixtureImage): `data:image/png;base64,${string}` {
  let binary = '';
  for (const byte of encodeFixturePNG(image)) binary += String.fromCharCode(byte);
  return `data:image/png;base64,${btoa(binary)}`;
}

function chunk(type: string, data: readonly number[]): number[] {
  const typeAndData = [...type].map((character) => character.charCodeAt(0)).concat(data);
  return [...uint32(data.length), ...typeAndData, ...uint32(crc32(typeAndData))];
}

function uint32(value: number): number[] {
  return [value >>> 24, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function crc32(bytes: readonly number[]): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
