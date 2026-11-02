import type {ɵRGBAImage as RGBAImage} from '@qrcodesdk/core/internal/webp';

/** Encodes Canvas pixels with a bundled encoder, which behaves the same in every browser. */
export function encodeCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  encode: (image: RGBAImage) => Uint8Array,
): string {
  const {width, height} = canvas;
  // The Canvas renderer has already created the 2D context.
  const {data} = canvas.getContext('2d')!.getImageData(0, 0, width, height);
  const bytes = encode({width, height, data});
  let binary = '';
  // Converts in chunks to stay below argument count limits.
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}
