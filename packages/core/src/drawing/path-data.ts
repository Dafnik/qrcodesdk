import type {QRCodeDrawingLayer} from './types';

// Rectangle commands are shared across calls, by vertical move, horizontal move, height, and
// width. Only integer values up to the largest QR symbol are cached, so caller-supplied geometry
// cannot grow the cache. Vertical moves cover 0 and 1, the steps between consecutive module
// rectangles, and horizontal moves are offset to stay array indexes.
const MAX_CACHED_DIMENSION = 177;
// Process-wide limit. Once reached, further commands are serialized without caching.
const MAX_CACHED_COMMANDS = 2048;
const commands: string[][][][] = [[], []];
// Tile commands by path data and horizontal move. Most tiles follow one in the same row, so only
// commands without a vertical move are cached.
const tileCommands: Record<string, Map<number, string>> = {};
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
    const column = dx + MAX_CACHED_DIMENSION;
    // Only 0 and 1 equal their squares.
    const cached =
      dy * dy === dy && small(column, 2 * MAX_CACHED_DIMENSION) && small(width) && small(height);
    let command = cached ? commands[dy]![column]?.[height]?.[width] : undefined;
    if (command === undefined) {
      command = `m${dx} ${dy}h${width}v${height}h-${width}z`;
      if (cached && commandCount++ < MAX_CACHED_COMMANDS) {
        const byHeight = (commands[dy]![column] ||= []);
        (byHeight[height] ||= [])[width] = command;
      }
    }
    path += command;
    currentX = x;
    currentY = y;
  }
  for (const [tile, positions] of tiles) {
    const moves = tileCommands[tile.data] || new Map<number, string>();
    if (commandCount < MAX_CACHED_COMMANDS) tileCommands[tile.data] = moves;
    for (let index = 0; index < positions.length; index += 2) {
      // Moves keep six decimals, so their integer millionths make exact and fast keys.
      const keyX = Math.round((positions[index]! - currentX) * 1_000_000);
      const moveX = keyX / 1_000_000;
      const moveY = round(positions[index + 1]! - currentY);
      let command = moves.get(keyX);
      if (moveY || command === undefined) {
        command = `m${moveX} ${moveY}${tile.data}`;
        if (!moveY && commandCount++ < MAX_CACHED_COMMANDS) moves.set(keyX, command);
      }
      path += command;
      currentX += moveX + tile.endX;
      currentY += moveY + tile.endY;
    }
  }
  return path;
}

function small(value: number, max = MAX_CACHED_DIMENSION): boolean {
  return value >>> 0 === value && value <= max;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
