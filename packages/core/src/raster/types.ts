/** 8-bit RGBA pixels in row-major order. */
export type RGBAImage = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array | Uint8ClampedArray;
};

/**
 * Views the pixels as one 32-bit word each, to find runs of equal pixels quickly. The byte order of
 * the words depends on the platform, so they are only compared, and the channels are read from
 * `bytes`, which is a copy when the data is not 4-byte aligned.
 */
export function pixelWords({width, height, data}: RGBAImage): {
  bytes: RGBAImage['data'];
  words: Int32Array;
} {
  const bytes = data.byteOffset & 3 ? Uint8Array.from(data) : data;
  return {bytes, words: new Int32Array(bytes.buffer, bytes.byteOffset, width * height)};
}
