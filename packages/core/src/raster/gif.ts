import {QRCodeError} from '../error';
import {ByteBuffer} from './byte-buffer';
import type {RGBAImage} from './types';

export type GIFEncodeOptions = {
  /** Pixels with an alpha value below the threshold become transparent. Defaults to 128. */
  readonly transparencyThreshold?: number;
};

type ColorCount = [color: number, count: number];

const MAX_DIMENSION = 65_535;
const MAX_COLORS = 256;
// The most frequent colors, such as the background and module colors, keep their exact values.
const EXACT_COLORS = 16;
const MAX_CODE = 4096;

/**
 * Encodes RGBA pixels as a single-frame GIF89a image. Images with more than 256 colors are reduced
 * with median cut. Transparency is binary, so partially transparent pixels become opaque or
 * transparent at the alpha threshold.
 */
export function encodeGIF(
  {width, height, data}: RGBAImage,
  options?: GIFEncodeOptions,
): Uint8Array {
  if (!isDimension(width) || !isDimension(height)) {
    throw new QRCodeError(
      'RENDER_FAILED',
      `GIF output must be 1 to ${MAX_DIMENSION} pixels wide and high, received ${width} x ${height}`,
    );
  }
  const threshold = resolveGIFTransparencyThreshold(options?.transparencyThreshold);
  const pixelCount = width * height;

  const counts = new Map<number, number>();
  let transparent = false;
  // Pixels repeat in long runs, so counts are added per run.
  let runColor = -1;
  let runLength = 0;
  for (let offset = 0; offset < pixelCount * 4; offset += 4) {
    if (data[offset + 3]! < threshold) {
      transparent = true;
      continue;
    }
    const color = (data[offset]! << 16) | (data[offset + 1]! << 8) | data[offset + 2]!;
    if (color === runColor) {
      runLength++;
      continue;
    }
    if (runLength > 0) counts.set(runColor, (counts.get(runColor) ?? 0) + runLength);
    runColor = color;
    runLength = 1;
  }
  if (runLength > 0) counts.set(runColor, (counts.get(runColor) ?? 0) + runLength);

  const colorLimit = transparent ? MAX_COLORS - 1 : MAX_COLORS;
  const palette = counts.size <= colorLimit ? [...counts.keys()] : quantize(counts, colorLimit);
  const indexOf = new Map<number, number>();
  palette.forEach((color, index) => indexOf.set(color, index));
  const transparentIndex = palette.length;
  const tableBits = Math.max(1, Math.ceil(Math.log2(palette.length + (transparent ? 1 : 0))));

  const indices = new Uint8Array(pixelCount);
  let previousColor = -1;
  let previousIndex = 0;
  for (let index = 0, offset = 0; index < pixelCount; index++, offset += 4) {
    if (data[offset + 3]! < threshold) {
      indices[index] = transparentIndex;
      continue;
    }
    const color = (data[offset]! << 16) | (data[offset + 1]! << 8) | data[offset + 2]!;
    if (color !== previousColor) {
      previousColor = color;
      let paletteIndex = indexOf.get(color);
      if (paletteIndex === undefined) {
        paletteIndex = nearestColor(palette, color);
        indexOf.set(color, paletteIndex);
      }
      previousIndex = paletteIndex;
    }
    indices[index] = previousIndex;
  }

  const output = new ByteBuffer();
  output.pushASCII('GIF89a');
  output.pushUint16LE(width);
  output.pushUint16LE(height);
  // Global color table with 8-bit color resolution.
  output.push(0xf0 | (tableBits - 1));
  output.push(0);
  output.push(0);
  for (let index = 0; index < 1 << tableBits; index++) {
    const color = palette[index] ?? 0;
    output.push((color >>> 16) & 0xff);
    output.push((color >>> 8) & 0xff);
    output.push(color & 0xff);
  }
  if (transparent) {
    // Graphic control extension with a transparent color index.
    output.pushBytes([0x21, 0xf9, 0x04, 0x01, 0, 0, transparentIndex, 0]);
  }
  output.push(0x2c);
  output.pushUint16LE(0);
  output.pushUint16LE(0);
  output.pushUint16LE(width);
  output.pushUint16LE(height);
  output.push(0);
  writeLZW(output, indices, Math.max(2, tableBits));
  output.push(0x3b);
  return output.toUint8Array();
}

/** Validates the alpha value below which GIF pixels become transparent. */
export function resolveGIFTransparencyThreshold(value: number | undefined): number {
  const threshold = value ?? 128;
  if (!Number.isSafeInteger(threshold) || threshold < 0 || threshold > 256) {
    throw new QRCodeError(
      'INVALID_OPTIONS',
      `QR code transparency.threshold must be an integer from 0 to 256, received ${String(threshold)}`,
      {details: {field: 'transparency.threshold', value: threshold}},
    );
  }
  return threshold;
}

function isDimension(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 1 && value <= MAX_DIMENSION;
}

function quantize(counts: Map<number, number>, limit: number): number[] {
  const colors = [...counts].sort((left, right) => right[1] - left[1]);
  const exact = colors.slice(0, EXACT_COLORS).map(([color]) => color);
  return [...exact, ...medianCut(colors.slice(EXACT_COLORS), limit - exact.length)];
}

type Box = {readonly colors: ColorCount[]; readonly shift: number; readonly range: number};

/** Splits the colors into at most `target` boxes and returns their weighted average colors. */
function medianCut(colors: ColorCount[], target: number): number[] {
  const boxes = [describeBox(colors)];
  while (boxes.length < target) {
    let selected = -1;
    for (let index = 0; index < boxes.length; index++) {
      if (boxes[index]!.range > (boxes[selected]?.range ?? 0)) selected = index;
    }
    if (selected < 0) break;
    const {colors: boxColors, shift} = boxes[selected]!;
    boxColors.sort((left, right) => ((left[0] >>> shift) & 0xff) - ((right[0] >>> shift) & 0xff));
    const total = boxColors.reduce((sum, [, count]) => sum + count, 0);
    let split = 0;
    for (let sum = 0; split < boxColors.length - 1 && sum + boxColors[split]![1] <= total / 2;) {
      sum += boxColors[split++]![1];
    }
    split = Math.min(Math.max(split, 1), boxColors.length - 1);
    boxes.splice(
      selected,
      1,
      describeBox(boxColors.slice(0, split)),
      describeBox(boxColors.slice(split)),
    );
  }
  return boxes.map(({colors: boxColors}) => {
    let red = 0;
    let green = 0;
    let blue = 0;
    let total = 0;
    for (const [color, count] of boxColors) {
      red += ((color >>> 16) & 0xff) * count;
      green += ((color >>> 8) & 0xff) * count;
      blue += (color & 0xff) * count;
      total += count;
    }
    return (
      (Math.round(red / total) << 16) | (Math.round(green / total) << 8) | Math.round(blue / total)
    );
  });
}

function describeBox(colors: ColorCount[]): Box {
  let shift = 0;
  let range = 0;
  for (const channelShift of [16, 8, 0]) {
    let minimum = 255;
    let maximum = 0;
    for (const [color] of colors) {
      const value = (color >>> channelShift) & 0xff;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    if (maximum - minimum > range) {
      range = maximum - minimum;
      shift = channelShift;
    }
  }
  return {colors, shift, range};
}

function nearestColor(palette: readonly number[], color: number): number {
  let nearest = 0;
  let nearestDistance = Infinity;
  for (let index = 0; index < palette.length; index++) {
    const candidate = palette[index]!;
    const red = ((candidate >>> 16) & 0xff) - ((color >>> 16) & 0xff);
    const green = ((candidate >>> 8) & 0xff) - ((color >>> 8) & 0xff);
    const blue = (candidate & 0xff) - (color & 0xff);
    const distance = red * red + green * green + blue * blue;
    if (distance < nearestDistance) {
      nearest = index;
      nearestDistance = distance;
    }
  }
  return nearest;
}

/** Writes variable-width LZW image data in sub-blocks of up to 255 bytes. */
function writeLZW(output: ByteBuffer, indices: Uint8Array, minimumCodeSize: number): void {
  const stream = new ByteBuffer();
  const clearCode = 1 << minimumCodeSize;
  const endCode = clearCode + 1;
  // Maps `prefix code << 8 | index` to the code of that string. Codes 0 to `endCode` are never
  // stored, so 0 means no entry.
  const table = new Uint16Array(MAX_CODE << 8);
  const keys = new Int32Array(MAX_CODE);
  let keyCount = 0;
  let nextCode = endCode + 1;
  let codeSize = minimumCodeSize + 1;
  let bits = 0;
  let bitCount = 0;
  const emit = (code: number) => {
    bits |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      stream.push(bits & 0xff);
      bits >>>= 8;
      bitCount -= 8;
    }
  };

  emit(clearCode);
  let current = indices[0]!;
  for (let index = 1; index < indices.length; index++) {
    const value = indices[index]!;
    const key = (current << 8) | value;
    const code = table[key]!;
    if (code !== 0) {
      current = code;
      continue;
    }
    emit(current);
    if (nextCode === MAX_CODE) {
      emit(clearCode);
      for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) table[keys[keyIndex]!] = 0;
      keyCount = 0;
      nextCode = endCode + 1;
      codeSize = minimumCodeSize + 1;
    } else {
      // Decoders add each entry one code later, so the code size grows before the first entry
      // that needs the extra bit.
      if (nextCode >= 1 << codeSize) codeSize++;
      table[key] = nextCode++;
      keys[keyCount++] = key;
    }
    current = value;
  }
  emit(current);
  emit(endCode);
  if (bitCount > 0) stream.push(bits & 0xff);

  output.push(minimumCodeSize);
  const bytes = stream.toUint8Array();
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const block = bytes.subarray(offset, offset + 255);
    output.push(block.length);
    output.pushBytes(block);
  }
  output.push(0);
}
