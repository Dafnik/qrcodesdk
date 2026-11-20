import type {ReadResult} from 'zxing-wasm/reader';

/** Picks the enclosing QR code when a center logo also contains a readable symbol. */
export function largestQRCode(results: readonly ReadResult[]): ReadResult | undefined {
  let largest: ReadResult | undefined;
  let largestArea = -1;
  for (const result of results) {
    if (!result.isValid) continue;
    const {topLeft, topRight, bottomRight, bottomLeft} = result.position;
    const area = Math.abs(
      (bottomRight.x - topLeft.x) * (bottomLeft.y - topRight.y) -
        (bottomRight.y - topLeft.y) * (bottomLeft.x - topRight.x),
    );
    if (area > largestArea) {
      largest = result;
      largestArea = area;
    }
  }
  return largest;
}
