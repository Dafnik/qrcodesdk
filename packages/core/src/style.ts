import {assertKnownKeys, throwInvalid} from './options';
import {validateShapePath} from './shape-path';
import {resolveColor} from './styling';
import type {
  QRCodeAlignmentCenterShape,
  QRCodeAlignmentRingShape,
  QRCodeColor,
  QRCodeDrawLayer,
  QRCodeFinderCenterShape,
  QRCodeFinderRingShape,
  QRCodeShape,
  QRCodeShapePath,
  QRCodeStylePart,
} from './types';

export type {
  QRCodeAlignmentCenterShape,
  QRCodeAlignmentRingShape,
  QRCodeFinderCenterShape,
  QRCodeFinderRingShape,
  QRCodeModuleShape,
  QRCodeShape,
  QRCodeShapePath,
  QRCodeStylePart,
} from './types';

export type QRCodeRoundedShapeOptions = {
  /** Module corner radius from 0 to 1. Finder and alignment pieces scale it to their size. */
  readonly radius?: number;
};
export type QRCodeCircleShapeOptions = {
  /** Module dot diameter from 0 to 1. Finder pieces always use full-size circles. */
  readonly size?: number;
};
export type QRCodeFinderOptions = {
  readonly ring?: QRCodeFinderRingShape;
  readonly center?: QRCodeFinderCenterShape;
  readonly color?: QRCodeColor;
};
export type QRCodeAlignmentOptions = {
  readonly ring?: QRCodeAlignmentRingShape;
  readonly center?: QRCodeAlignmentCenterShape;
  readonly color?: QRCodeColor;
};

type Radii = readonly [topLeft: number, topRight: number, bottomRight: number, bottomLeft: number];

// Corners a shape may round: top left 1, top right 2, bottom right 4, bottom left 8.
const ALL_CORNERS = 0b1111;
const DIAGONAL_CORNERS = 0b0101;
const SHAPE_KEYS = ['module', 'finderRing', 'finderCenter', 'alignmentRing', 'alignmentCenter'];
// Module roles, see QRCodeModuleRole.
const FINDER_RING_ROLE = 1;
const FINDER_CENTER_ROLE = 2;
const ALIGNMENT_RING_ROLE = 4;
const ALIGNMENT_CENTER_ROLE = 5;

/** Rounds module corners that face no dark neighbor. */
export function rounded(options?: QRCodeRoundedShapeOptions): QRCodeShape {
  return roundedShape('rounded', options, ALL_CORNERS);
}

/** Rounds only the top-left and bottom-right corners, for leaf-like shapes. */
export function diagonal(options?: QRCodeRoundedShapeOptions): QRCodeShape {
  return roundedShape('diagonal', options, DIAGONAL_CORNERS);
}

/** Draws every module as a dot and finder pieces as circles. */
export function circle(options?: QRCodeCircleShapeOptions): QRCodeShape {
  assertKnownKeys(options, 'circle', ['size']);
  const size = options?.size ?? 1;
  if (typeof size !== 'number' || !(size > 0 && size <= 1)) {
    throwInvalid('circle.size', 'greater than 0 and at most 1', size);
  }
  const offset = (1 - size) / 2;
  const dot = path((p) => roundedRect(p, offset, size, uniform(size / 2)));
  return {
    module: dot,
    finderRing: ringPath(7, uniform(3.5), uniform(2.5)),
    finderCenter: path((p) => roundedRect(p, 0, 3, uniform(1.5))),
    alignmentRing: ringPath(5, uniform(2.5), uniform(1.5)),
    alignmentCenter: dot,
  };
}

/** Draws the three finder patterns with their own shapes and color. */
export function finder(options?: QRCodeFinderOptions): QRCodeStylePart {
  const {ring, center, color} = resolvePartOptions('finder', options, 'finderRing', 'finderCenter');
  return (context) => {
    context.claimRoles(FINDER_RING_ROLE, FINDER_CENTER_ROLE);
    const n = context.matrix.size;
    const layer = context.layer(color);
    for (const [x, y] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ] as const) {
      if (context.isAreaClaimed(x, y, 7, 7)) continue;
      drawPattern(layer, ring, x, y, 7);
      drawPattern(layer, center, x + 2, y + 2, 3);
    }
  };
}

/** Draws the alignment patterns with their own shapes and color. */
export function alignment(options?: QRCodeAlignmentOptions): QRCodeStylePart {
  const {ring, center, color} = resolvePartOptions(
    'alignment',
    options,
    'alignmentRing',
    'alignmentCenter',
  );
  return (context) => {
    context.claimRoles(ALIGNMENT_RING_ROLE, ALIGNMENT_CENTER_ROLE);
    const {size: n, roles} = context.matrix;
    const layer = context.layer(color);
    for (let index = 0; index < roles.length; index++) {
      if (roles[index] !== ALIGNMENT_CENTER_ROLE) continue;
      const x = index % n;
      const y = (index - x) / n;
      if (context.isAreaClaimed(x - 2, y - 2, 5, 5)) continue;
      drawPattern(layer, ring, x - 2, y - 2, 5);
      drawPattern(layer, center, x, y, 1);
    }
  };
}

function resolvePartOptions(
  name: string,
  options:
    {readonly ring?: object; readonly center?: object; readonly color?: QRCodeColor} | undefined,
  ringKey: string,
  centerKey: string,
): {ring?: QRCodeShapePath; center?: QRCodeShapePath; color?: QRCodeColor} {
  assertKnownKeys(options, name, ['ring', 'center', 'color']);
  const color =
    options?.color === undefined ? undefined : resolveColor(`${name}.color`, options.color);
  const read = (option: 'ring' | 'center', key: string) => {
    const shape = options?.[option];
    assertKnownKeys(shape, `${name}.${option}`, SHAPE_KEYS);
    if (shape === undefined) return undefined;
    const value = (shape as Record<string, unknown>)[key];
    validateShapePath(`${name}.${option}.${key}`, value);
    return value;
  };
  return {ring: read('ring', ringKey), center: read('center', centerKey), color};
}

/** Sizes 5 and 7 are rings; sizes 1 and 3 are filled centers. */
function drawPattern(
  layer: QRCodeDrawLayer,
  shape: QRCodeShapePath | undefined,
  x: number,
  y: number,
  size: number,
): void {
  if (shape !== undefined) {
    layer.tile(shape, x, y);
  } else if (size < 5) {
    layer.rect(x, y, size, size);
  } else {
    // A filled ring: top, bottom, left, and right edges.
    layer.rect(x, y, size, 1);
    layer.rect(x, y + size - 1, size, 1);
    layer.rect(x, y + 1, 1, size - 2);
    layer.rect(x + size - 1, y + 1, 1, size - 2);
  }
}

function roundedShape(
  name: string,
  options: QRCodeRoundedShapeOptions | undefined,
  corners: number,
): QRCodeShape {
  assertKnownKeys(options, name, ['radius']);
  const radius = options?.radius ?? 0.5;
  if (typeof radius !== 'number' || !(radius >= 0 && radius <= 1)) {
    throwInvalid(`${name}.radius`, 'a number from 0 to 1', radius);
  }
  const cornerRadii = (value: number) =>
    [0, 1, 2, 3].map((corner) => ((corners >> corner) & 1 ? value : 0)) as unknown as Radii;

  return {
    module: Array.from({length: 16}, (_, mask) => {
      const left = mask & 1;
      const right = mask & 2;
      const top = mask & 4;
      const bottom = mask & 8;
      const free = [!left && !top, !right && !top, !right && !bottom, !left && !bottom].map(
        (isFree, corner) => isFree && radius > 0 && ((corners >> corner) & 1) === 1,
      );
      if (!free.includes(true)) return undefined;
      // Two rounded corners on one side share it, so each can use at most half of it.
      const radii = free.map((isFree, corner) =>
        !isFree
          ? 0
          : free[(corner + 1) % 4] || free[(corner + 3) % 4]
            ? Math.min(radius, 0.5)
            : radius,
      ) as unknown as Radii;
      return path((p) => roundedRect(p, 0, 1, radii));
    }),
    // Finder and alignment pieces scale the radius with their size.
    finderRing: ringPath(7, cornerRadii(radius * 2.8), cornerRadii(Math.max(0, radius * 2.8 - 1))),
    finderCenter: path((p) => roundedRect(p, 0, 3, cornerRadii(radius * 1.2))),
    alignmentRing: ringPath(5, cornerRadii(radius * 2), cornerRadii(Math.max(0, radius * 2 - 1))),
    // Rounded corners of the 1x1 center share their sides, so each uses at most half of them.
    alignmentCenter: path((p) =>
      roundedRect(p, 0, 1, cornerRadii(corners === ALL_CORNERS ? Math.min(radius, 0.5) : radius)),
    ),
  };
}

/** A square ring of `size` modules with a hole one module inside it. */
function ringPath(size: number, outer: Radii, inner: Radii): QRCodeShapePath {
  return path((p) => {
    roundedRect(p, 0, size, outer);
    roundedRect(p, 1, size - 2, inner);
  });
}

function uniform(radius: number): Radii {
  return [radius, radius, radius, radius];
}

type PathBuilder = {
  move(x: number, y: number): void;
  line(x: number, y: number): void;
  corner(cornerX: number, cornerY: number, x: number, y: number): void;
  close(): void;
};
type Point = readonly [x: number, y: number];

/**
 * Builds relative path data, tracking rounded positions so rounding never accumulates. Quarter
 * circles around one center merge into as few arcs as possible.
 */
function path(build: (builder: PathBuilder) => void): QRCodeShapePath {
  let data = '';
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let arc: {centerX: number; centerY: number; radius: number; ends: Point[]} | undefined;
  const round = (value: number) => Math.round(value * 1000) / 1000;
  // Separators are only needed where the next number would otherwise extend the previous one.
  const format = (...values: number[]) =>
    values
      .map((value) => String(round(value)).replace(/^(-?)0\./, '$1.'))
      .reduce((joined, value) =>
        value[0] === '-' || (value[0] === '.' && /\.\d*$/.test(joined))
          ? joined + value
          : `${joined} ${value}`,
      );
  const to = (x: number, y: number) => {
    currentX = round(x);
    currentY = round(y);
  };
  const end = (): Point => arc?.ends[arc.ends.length - 1] ?? [currentX, currentY];
  const flushArc = () => {
    if (!arc) return;
    const {radius, ends} = arc;
    arc = undefined;
    const arcTo = ([x, y]: Point, largeArc: number) => {
      data += `a${format(radius, radius, 0, largeArc, 1, round(x) - currentX, round(y) - currentY)}`;
      to(x, y);
    };
    // A full circle needs two arcs because one arc cannot end where it starts.
    if (ends.length === 4) {
      arcTo(ends[1]!, 0);
      arcTo(ends[3]!, 0);
    } else {
      arcTo(ends[ends.length - 1]!, ends.length === 3 ? 1 : 0);
    }
  };
  build({
    move(x, y) {
      flushArc();
      data += `m${format(round(x) - currentX, round(y) - currentY)}`;
      to(x, y);
      startX = currentX;
      startY = currentY;
    },
    line(x, y) {
      const [fromX, fromY] = end();
      if (round(x) === round(fromX) && round(y) === round(fromY)) return;
      flushArc();
      const deltaX = round(x) - currentX;
      const deltaY = round(y) - currentY;
      data +=
        deltaY === 0
          ? `h${format(deltaX)}`
          : deltaX === 0
            ? `v${format(deltaY)}`
            : `l${format(deltaX, deltaY)}`;
      to(x, y);
    },
    // Clockwise quarter circle from the current point to (x, y), bending toward the corner.
    corner(cornerX, cornerY, x, y) {
      const [fromX, fromY] = end();
      const centerX = fromX + x - cornerX;
      const centerY = fromY + y - cornerY;
      const radius = round(Math.abs(x - centerX) + Math.abs(y - centerY));
      if (
        arc &&
        arc.radius === radius &&
        round(arc.centerX) === round(centerX) &&
        round(arc.centerY) === round(centerY)
      ) {
        arc.ends.push([x, y]);
      } else {
        flushArc();
        arc = {centerX, centerY, radius, ends: [[x, y]]};
      }
    },
    close() {
      flushArc();
      data += 'z';
      currentX = startX;
      currentY = startY;
    },
  });
  return data;
}

/** Adds a clockwise square at (offset, offset) with per-corner radii. */
function roundedRect(
  p: PathBuilder,
  offset: number,
  size: number,
  [topLeft, topRight, bottomRight, bottomLeft]: Radii,
): void {
  const end = offset + size;
  p.move(offset + topLeft, offset);
  p.line(end - topRight, offset);
  if (topRight) p.corner(end, offset, end, offset + topRight);
  p.line(end, end - bottomRight);
  if (bottomRight) p.corner(end, end, end - bottomRight, end);
  p.line(offset + bottomLeft, end);
  if (bottomLeft) p.corner(offset, end, offset, end - bottomLeft);
  if (topLeft) {
    p.line(offset, offset + topLeft);
    p.corner(offset, offset, offset + topLeft, offset);
  }
  p.close();
}
