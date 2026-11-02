/** 8-bit RGBA pixels in row-major order. */
export type RGBAImage = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array | Uint8ClampedArray;
};
