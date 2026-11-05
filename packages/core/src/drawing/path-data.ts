import type {QRCodeDrawingLayer} from './types';

// Bound shared fragments to QR module dimensions, independently of caller-supplied geometry.
type Move = {data: string; rectangles?: string[][]};
const moves: Record<number, Move>[] = [{}, {}];
let commandCount = 0;

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
    const height = rects[index + 3]!;
    const dx = x - currentX;
    const dy = y - currentY;
    const row = moves[dy];
    let move = row?.[dx];
    if (move === undefined) {
      move = {data: `m${dx} ${dy}`};
      if (row && Math.abs(dx) <= 177 && Number.isInteger(dx)) {
        move.rectangles = [];
        row[dx] = move;
      }
    }
    let command = move.rectangles?.[height]?.[width];
    if (command === undefined) {
      command = `${move.data}h${width}v${height}h-${width}z`;
      if (
        move.rectangles &&
        commandCount < 1024 &&
        width >>> 0 === width &&
        height >>> 0 === height &&
        width <= 177 &&
        height <= 177
      ) {
        (move.rectangles[height] ??= [])[width] = command;
        commandCount++;
      }
    }
    path += command;
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
