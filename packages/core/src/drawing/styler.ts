import {arrayStorage} from '../matrix/public-array';
import {throwInvalid} from '../options';
import type {PreparedShapePath} from '../shape-path';
import {calculateQRCodeOutputSize, resolveColor, resolveQRCodeTextStyle} from '../styling';
import type {QRCodeColor, QRCodeMatrix, QRCodeVisualStyle} from '../types';
import type {QRCodeDrawContext, QRCodeDrawLayer, QRCodeStylePart} from './types';
import type {QRCodeDrawingLayer, QRCodeStyler} from './types';

type Layer = QRCodeDrawLayer & {
  readonly color: QRCodeColor;
  readonly rects: number[];
  readonly tiles: Map<string, [PreparedShapePath, number[]]>;
};
type ModuleTiles = PreparedShapePath | readonly (PreparedShapePath | undefined)[] | undefined;

// Roles that take the module shape. Finder modules stay square unless a finder part draws them.
const SHAPED_ROLES = 0b111111001;
export const fractionalRects = new WeakSet<readonly number[]>();

/**
 * Creates a styler for a style. Renderer parts, such as a center image, run before finder and
 * alignment styles so those can skip claimed areas.
 */
export function createQRCodeStyler(
  style?: QRCodeVisualStyle,
  rendererParts: readonly (QRCodeStylePart | undefined)[] = [],
): QRCodeStyler {
  const {moduleSize, quietZone} = resolveQRCodeTextStyle(style);
  const foreground = resolveColor('style.foreground', style?.foreground ?? '#000000');
  const background = resolveColor('style.background', style?.background ?? '#ffffff');
  const tiles = style?.modules?.module as unknown as ModuleTiles;
  const neighbors = Array.isArray(tiles) ? tiles : undefined;
  const constant = neighbors ? undefined : (tiles as PreparedShapePath | undefined);
  const allParts = [...rendererParts, style?.finder, style?.alignment] as readonly (
    QRCodeStylePart | undefined
  )[];

  return (matrix: QRCodeMatrix) => {
    const outputSize = calculateQRCodeOutputSize(matrix, {moduleSize, quietZone});
    const layers = new Map<QRCodeColor, Layer>();
    let claimedRoles = 0;
    const areas: number[] = [];
    const context: QRCodeDrawContext = {
      matrix,
      claimRoles(...roles) {
        for (const role of roles) claimedRoles |= 1 << role;
      },
      claimArea(x, y, width, height) {
        validateRectangle('claimArea', x, y, width, height);
        if (!width || !height) return;
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        areas.push(startX, startY, Math.ceil(x + width) - startX, Math.ceil(y + height) - startY);
      },
      isAreaCleared(x, y, width, height) {
        for (let row = y; row < y + height; row++) {
          for (let column = x; column < x + width; column++) {
            if (!isModuleInAreas(areas, column, row)) return false;
          }
        }
        return true;
      },
      layer(color = foreground) {
        color = resolveColor('layer.color', color);
        let layer = layers.get(color);
        if (!layer) layers.set(color, (layer = createLayer(color, quietZone)));
        return layer;
      },
    };
    for (const part of allParts) part?.(context);
    drawModules(
      matrix,
      claimedRoles,
      areas,
      neighbors,
      constant,
      context.layer() as Layer,
      quietZone,
    );

    return {
      moduleCount: matrix.size,
      moduleSize,
      quietZone,
      viewSize: matrix.size + 2 * quietZone,
      outputSize,
      background,
      layers: [...layers.values()]
        .filter(({rects, tiles}) => rects.length > 0 || tiles.size > 0)
        .map(({color, rects, tiles}): QRCodeDrawingLayer => ({
          color,
          rects,
          tiles: [...tiles.values()],
        })),
    };
  };
}

function isModuleInAreas(areas: readonly number[], x: number, y: number): boolean {
  for (let index = 0; index < areas.length; index += 4) {
    if (
      x >= areas[index]! &&
      x < areas[index]! + areas[index + 2]! &&
      y >= areas[index + 1]! &&
      y < areas[index + 1]! + areas[index + 3]!
    ) {
      return true;
    }
  }
  return false;
}

function createLayer(color: QRCodeColor, offset: number): Layer {
  const rects: number[] = [];
  const tiles = new Map<string, [PreparedShapePath, number[]]>();
  return {
    color,
    rects,
    tiles,
    rect(x, y, width, height) {
      if (width === 0 || height === 0) return;
      x += offset;
      y += offset;
      if (![x, y, width, height].every(Number.isInteger)) fractionalRects.add(rects);
      rects.push(x, y, width, height);
    },
    tile(path, x, y) {
      let tile = tiles.get(path.data);
      if (!tile) tiles.set(path.data, (tile = [path, []]));
      tile[1].push(x + offset, y + offset);
    },
  };
}

function validateRectangle(
  field: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (
    ![x, y, width, height, x + width, y + height].every(Number.isFinite) ||
    width < 0 ||
    height < 0
  ) {
    throwInvalid(field, 'finite coordinates and non-negative dimensions', [x, y, width, height]);
  }
}

/**
 * Draws every dark module that no part claimed. Filled modules are merged into horizontal runs,
 * and equal runs in consecutive rows are merged into one rectangle.
 */
function drawModules(
  {size: n, modules: publicModules, roles: publicRoles}: QRCodeMatrix,
  claimedRoles: number,
  areas: readonly number[],
  neighbors: readonly (PreparedShapePath | undefined)[] | undefined,
  constant: PreparedShapePath | undefined,
  layer: Layer,
  offset: number,
): void {
  const {rects} = layer;
  const modules = arrayStorage.get(publicModules);
  const roles = arrayStorage.get(publicRoles) ?? publicRoles;
  const stride = n + 2;
  const shapedRoles = neighbors || constant ? SHAPED_ROLES : 0;
  // 0 not drawn, 1 filled, 2 shaped. A light border keeps neighbor reads in bounds.
  const cells = new Uint8Array(stride * stride);
  if (modules) {
    for (let y = 0; y < n; y++) {
      cells.set(modules.subarray(y * n, (y + 1) * n), (y + 1) * stride + 1);
    }
  } else {
    for (let y = 0; y < n; y++) {
      for (let x = 0, source = y * n, target = (y + 1) * stride + 1; x < n; x++) {
        cells[target + x] = publicModules[source + x]!;
      }
    }
  }
  if (claimedRoles || shapedRoles) {
    for (let y = 0; y < n; y++) {
      for (let x = 0, index = y * n, cell = (y + 1) * stride + 1; x < n; x++, index++, cell++) {
        const role = roles[index]!;
        cells[cell] =
          cells[cell]! * (1 - ((claimedRoles >> role) & 1)) * (1 + ((shapedRoles >> role) & 1));
      }
    }
  }
  for (let index = 0; index < areas.length; index += 4) {
    const startX = Math.max(0, areas[index]!);
    const endX = Math.min(n, areas[index]! + areas[index + 2]!);
    for (
      let y = Math.max(0, areas[index + 1]!);
      y < Math.min(n, areas[index + 1]! + areas[index + 3]!);
      y++
    ) {
      if (endX > startX) cells.fill(0, (y + 1) * stride + 1 + startX, (y + 1) * stride + 1 + endX);
    }
  }
  if (shapedRoles) {
    for (let y = 0; y < n; y++) {
      for (let x = 0, index = (y + 1) * stride + 1; x < n; x++, index++) {
        if (cells[index] === 2) {
          const path = neighbors
            ? neighbors[
                +(cells[index - 1] !== 0) |
                  (+(cells[index + 1] !== 0) << 1) |
                  (+(cells[index - stride] !== 0) << 2) |
                  (+(cells[index + stride] !== 0) << 3)
              ]
            : constant;
          if (path === undefined) cells[index] = 1;
          else layer.tile(path, x, y);
        }
      }
    }
  }
  // Last row, width, and rectangle index for each starting column.
  const runs = new Array<number>(n * 3);
  for (let y = 0; y < n; y++) {
    for (let x = 0, index = (y + 1) * stride + 1; x < n; x++, index++) {
      if (cells[index] === 1) {
        const start = x;
        do {
          x++;
          index++;
        } while (cells[index] === 1);
        const runLength = x - start;
        const run = start * 3;
        if (runs[run] === y - 1 && runs[run + 1] === runLength) {
          rects[runs[run + 2]! + 3]!++;
        } else {
          runs[run + 1] = runLength;
          runs[run + 2] = rects.length;
          rects.push(start + offset, y + offset, runLength, 1);
        }
        runs[run] = y;
      }
    }
  }
}
