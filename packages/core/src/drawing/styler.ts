import {assertKnownKeys, throwInvalid} from '../options';
import {validateShapePath} from '../shape-path';
import {calculateQRCodeOutputSize, resolveColor, resolveQRCodeTextStyle} from '../styling';
import type {
  QRCodeColor,
  QRCodeDrawContext,
  QRCodeDrawLayer,
  QRCodeMatrix,
  QRCodeModuleShape,
  QRCodeShapePath,
  QRCodeStylePart,
  QRCodeVisualStyle,
} from '../types';
import type {QRCodeDrawingLayer, QRCodeStyler} from './index';

type Layer = QRCodeDrawLayer & {
  readonly color: QRCodeColor;
  readonly rects: number[];
  readonly tiles: Map<QRCodeShapePath, number[]>;
};
type ModuleTiles = readonly (QRCodeShapePath | undefined)[];

// Roles that take the module shape. Finder modules stay square unless a finder part draws them.
const SHAPED_ROLES = 0b111111001;
const SHAPE_KEYS = ['module', 'finderRing', 'finderCenter', 'alignmentRing', 'alignmentCenter'];

/**
 * Creates a styler for a style. Renderers may pass extra parts, such as a center image, which run
 * before the style's own parts so those can skip claimed areas.
 */
export function createQRCodeStyler(
  style?: QRCodeVisualStyle,
  parts: readonly (QRCodeStylePart | undefined)[] = [],
): QRCodeStyler {
  assertKnownKeys(style, 'style', [
    'moduleSize',
    'quietZone',
    'foreground',
    'background',
    'modules',
    'finder',
    'alignment',
  ]);
  const {moduleSize, quietZone} = resolveQRCodeTextStyle(style, false);
  const foreground = resolveColor('style.foreground', style?.foreground ?? '#000000');
  const background = resolveColor('style.background', style?.background ?? '#ffffff');
  const tiles = resolveModuleTiles(style?.modules);
  for (const key of ['finder', 'alignment'] as const) {
    const part = style?.[key];
    if (part !== undefined && typeof part !== 'function') {
      throwInvalid(`style.${key}`, `a style part such as ${key}()`, part);
    }
  }
  const allParts = [...parts, style?.finder, style?.alignment];

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
        if (width === 0 || height === 0) return;
        const startX = Math.floor(x);
        const startY = Math.floor(y);
        areas.push(startX, startY, Math.ceil(x + width) - startX, Math.ceil(y + height) - startY);
      },
      isAreaClaimed(x, y, width, height) {
        for (let index = 0; index < areas.length; index += 4) {
          if (
            x < areas[index]! + areas[index + 2]! &&
            areas[index]! < x + width &&
            y < areas[index + 1]! + areas[index + 3]! &&
            areas[index + 1]! < y + height
          ) {
            return true;
          }
        }
        return false;
      },
      layer(color = foreground) {
        color = resolveColor('layer.color', color);
        let layer = layers.get(color);
        if (!layer) layers.set(color, (layer = createLayer(color, quietZone)));
        return layer;
      },
    };
    for (const part of allParts) part?.(context);
    drawModules(matrix, claimedRoles, areas, tiles, context.layer() as Layer, quietZone);

    return {
      moduleCount: matrix.size,
      moduleSize,
      quietZone,
      viewSize: matrix.size + 2 * quietZone,
      outputSize,
      background,
      layers: [...layers.values()]
        .filter(({rects, tiles}) => rects.length > 0 || tiles.size > 0)
        .map(({color, rects, tiles}): QRCodeDrawingLayer => ({color, rects, tiles: [...tiles]})),
    };
  };
}

function resolveModuleTiles(shape: QRCodeModuleShape | undefined): ModuleTiles {
  assertKnownKeys(shape, 'style.modules', SHAPE_KEYS);
  if (shape === undefined) return [];
  const module = shape.module;
  if (typeof module === 'string') {
    validateShapePath('style.modules.module', module);
    return Array.from({length: 16}, () => module);
  }
  if (!Array.isArray(module) || module.length > 16) {
    throwInvalid('style.modules.module', 'path data or up to 16 neighbor paths', module);
  }
  const tiles: ModuleTiles = Array.from({length: 16}, (_, mask) => module[mask]);
  tiles.forEach((path, mask) => {
    if (path !== undefined) validateShapePath(`style.modules.module[${mask}]`, path);
  });
  return tiles;
}

function createLayer(color: QRCodeColor, offset: number): Layer {
  const rects: number[] = [];
  const tiles = new Map<QRCodeShapePath, number[]>();
  return {
    color,
    rects,
    tiles,
    rect(x, y, width, height) {
      validateRectangle('rect', x, y, width, height);
      if (width === 0 || height === 0) return;
      rects.push(x + offset, y + offset, width, height);
    },
    tile(path, x, y) {
      if (![x, y].every(Number.isFinite)) throwInvalid('tile', 'finite coordinates', [x, y]);
      let positions = tiles.get(path);
      if (!positions) {
        validateShapePath('tile', path);
        tiles.set(path, (positions = []));
      }
      positions.push(x + offset, y + offset);
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
  {size: n, modules, roles}: QRCodeMatrix,
  claimedRoles: number,
  areas: readonly number[],
  tiles: ModuleTiles,
  layer: Layer,
  offset: number,
): void {
  const {rects} = layer;
  const stride = n + 2;
  // How each module is drawn, with a light border so neighbor reads stay in bounds:
  // 0 not drawn, 1 filled, 2 shaped.
  const cells = new Uint8Array(stride * stride);
  for (let y = 0; y < n; y++) {
    for (let x = 0, index = y * n, cell = (y + 1) * stride + 1; x < n; x++, index++, cell++) {
      const role = roles[index]!;
      cells[cell] =
        modules[index]! * (1 - ((claimedRoles >> role) & 1)) * (1 + ((SHAPED_ROLES >> role) & 1));
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
  const runRow = new Int32Array(stride).fill(-2);
  const runWidth = new Int32Array(stride);
  const runIndex = new Int32Array(stride);

  for (let y = 0; y < n; y++) {
    let start = -1;
    // The border cell after each row ends the last run.
    for (let x = 0, index = (y + 1) * stride + 1; x <= n; x++, index++) {
      const cell = cells[index]!;
      let fill = cell === 1;
      if (cell === 2) {
        const path =
          tiles[
            +(cells[index - 1] !== 0) |
              (+(cells[index + 1] !== 0) << 1) |
              (+(cells[index - stride] !== 0) << 2) |
              (+(cells[index + stride] !== 0) << 3)
          ];
        if (path === undefined) fill = true;
        else layer.tile(path, x, y);
      }
      if (fill) {
        if (start < 0) start = x;
      } else if (start >= 0) {
        const runLength = x - start;
        if (runRow[start] === y - 1 && runWidth[start] === runLength) {
          rects[runIndex[start]! + 3]!++;
        } else {
          runIndex[start] = rects.length;
          runWidth[start] = runLength;
          rects.push(start + offset, y + offset, runLength, 1);
        }
        runRow[start] = y;
        start = -1;
      }
    }
  }
}
