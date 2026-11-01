import type {QRCodeDrawingLayer} from './types';

/**
 * Serializes one drawing layer into compact SVG path data, which SVG and `Path2D` both accept.
 * Fill it with the even-odd rule.
 */
export function toQRCodePathData({rects, tiles}: QRCodeDrawingLayer): string {
  let path = '';
  // A leading relative move is absolute, so the current point starts at the origin.
  let currentX = 0;
  let currentY = 0;
  for (let index = 0; index < rects.length; index += 4) {
    const x = rects[index]!;
    const y = rects[index + 1]!;
    const width = rects[index + 2]!;
    path += `m${x - currentX} ${y - currentY}h${width}v${rects[index + 3]}h-${width}z`;
    currentX = x;
    currentY = y;
  }
  for (const [tile, positions] of tiles) {
    for (let index = 0; index < positions.length; index += 2) {
      const x = positions[index]!;
      const y = positions[index + 1]!;
      const moveX = round(x - currentX);
      const moveY = round(y - currentY);
      path += `m${moveX} ${moveY}${tile.data}`;
      currentX += moveX + tile.endX;
      currentY += moveY + tile.endY;
    }
  }
  return path;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
