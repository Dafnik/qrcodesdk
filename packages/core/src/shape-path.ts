import {throwInvalid} from './options';
import type {QRCodeShapePath} from './types';

type Command = 'm' | 'l' | 'h' | 'v' | 'c' | 'a' | 'z';
type ShapeCommand = {command: Command; values: number[]};

const ARGUMENTS = {m: 2, l: 2, h: 1, v: 1, c: 6, a: 7} as const;
const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/iy;

/** Parses closed subpaths of relative commands shared by SVG, Canvas, and PNG. */
export function parseShapePath(field: string, value: QRCodeShapePath): ShapeCommand[] {
  const invalid = (): never =>
    throwInvalid(
      field,
      'closed path data using only relative m, l, h, v, c, a, and z commands',
      value,
    );
  const commands: ShapeCommand[] = [];
  let index = 0;
  let open = false;
  let command: Exclude<Command, 'z'> | undefined;
  const whitespace = () => {
    while (/[ \t\r\n]/.test(value[index] ?? '')) index++;
  };
  const number = (allowComma: boolean, flag: boolean): number => {
    whitespace();
    if (allowComma && value[index] === ',') {
      index++;
      whitespace();
    }
    if (flag) {
      const digit = value[index++];
      return digit === '0' ? 0 : digit === '1' ? 1 : invalid();
    }
    NUMBER.lastIndex = index;
    const match = NUMBER.exec(value);
    if (!match || !Number.isFinite(+match[0])) return invalid();
    index = NUMBER.lastIndex;
    return +match[0];
  };

  for (;;) {
    whitespace();
    if (index === value.length) break;
    const token = value[index]!;
    const explicit = token in ARGUMENTS;
    if (token === 'z') {
      if (!open) return invalid();
      commands.push({command: 'z', values: []});
      open = false;
      command = undefined;
      index++;
      continue;
    }
    if (explicit) {
      command = token as Exclude<Command, 'z'>;
      if (command === 'm' ? open : !open) return invalid();
      index++;
    }
    if (!command) return invalid();
    const values = Array.from({length: ARGUMENTS[command]}, (_, argument) =>
      number(argument > 0 || !explicit, command === 'a' && (argument === 3 || argument === 4)),
    );
    commands.push({command, values});
    if (command === 'm') {
      open = true;
      command = 'l';
    }
  }
  if (open || commands.length === 0) return invalid();
  return commands;
}

/** Validated path data and its current point after the final close. */
export type PreparedShapePath = {
  readonly data: QRCodeShapePath;
  readonly endX: number;
  readonly endY: number;
};

/**
 * Validates path data and records its end point. With a `size`, the path must also stay within
 * its `size` by `size` piece box so pieces never overlap.
 */
export function prepareShapePath(
  field: string,
  value: QRCodeShapePath,
  size?: number,
): PreparedShapePath {
  const commands = parseShapePath(field, value);
  if (size !== undefined && !isWithinBox(commands, size)) {
    throwInvalid(field, `path data within its ${size} by ${size} module box`, value);
  }
  let endX = 0;
  let endY = 0;
  for (const {command, values} of commands) {
    if (command !== 'm') continue;
    endX += values[0]!;
    endY += values[1]!;
  }
  return {data: value, endX, endY};
}

/** An SVG endpoint arc in center form, following the SVG implementation notes (B.2.4). */
export type ResolvedArc = {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly cos: number;
  readonly sin: number;
  readonly startAngle: number;
  /** Signed sweep angle in radians. */
  readonly delta: number;
};

/** Returns `undefined` for arcs drawn as straight lines: zero radii or equal endpoints. */
export function resolveArc(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  largeArc: number,
  sweep: number,
): ResolvedArc | undefined {
  radiusX = Math.abs(radiusX);
  radiusY = Math.abs(radiusY);
  if (radiusX === 0 || radiusY === 0 || (fromX === toX && fromY === toY)) return undefined;
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const halfX = (fromX - toX) / 2;
  const halfY = (fromY - toY) / 2;
  const x1 = cos * halfX + sin * halfY;
  const y1 = -sin * halfX + cos * halfY;
  const lambda = (x1 * x1) / (radiusX * radiusX) + (y1 * y1) / (radiusY * radiusY);
  if (lambda > 1) {
    radiusX *= Math.sqrt(lambda);
    radiusY *= Math.sqrt(lambda);
  }
  const numerator =
    radiusX * radiusX * radiusY * radiusY -
    radiusX * radiusX * y1 * y1 -
    radiusY * radiusY * x1 * x1;
  const denominator = radiusX * radiusX * y1 * y1 + radiusY * radiusY * x1 * x1;
  const factor = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
  const centerX1 = (factor * radiusX * y1) / radiusY;
  const centerY1 = (-factor * radiusY * x1) / radiusX;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const startAngle = angle(1, 0, (x1 - centerX1) / radiusX, (y1 - centerY1) / radiusY);
  let delta = angle(
    (x1 - centerX1) / radiusX,
    (y1 - centerY1) / radiusY,
    (-x1 - centerX1) / radiusX,
    (-y1 - centerY1) / radiusY,
  );
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  return {
    centerX: cos * centerX1 - sin * centerY1 + (fromX + toX) / 2,
    centerY: sin * centerX1 + cos * centerY1 + (fromY + toY) / 2,
    radiusX,
    radiusY,
    cos,
    sin,
    startAngle,
    delta,
  };
}

/** Returns the point of a resolved arc at an angle. */
export function arcPoint(arc: ResolvedArc, theta: number): [x: number, y: number] {
  const {centerX, centerY, radiusX, radiusY, cos, sin} = arc;
  const pointX = radiusX * Math.cos(theta);
  const pointY = radiusY * Math.sin(theta);
  return [cos * pointX - sin * pointY + centerX, sin * pointX + cos * pointY + centerY];
}

// Tolerates floating-point error in arc and curve extremes.
const BOX_TOLERANCE = 1e-6;

function isWithinBox(commands: readonly ShapeCommand[], size: number): boolean {
  const inside = (x: number, y: number) =>
    x >= -BOX_TOLERANCE &&
    y >= -BOX_TOLERANCE &&
    x <= size + BOX_TOLERANCE &&
    y <= size + BOX_TOLERANCE;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const {command, values} of commands) {
    const fromX = x;
    const fromY = y;
    if (command === 'z') {
      x = startX;
      y = startY;
      continue;
    }
    if (command === 'h') x += values[0]!;
    else if (command === 'v') y += values[0]!;
    else {
      x += values[values.length - 2]!;
      y += values[values.length - 1]!;
    }
    if (command === 'm') {
      startX = x;
      startY = y;
    }
    if (!inside(x, y)) return false;
    if (command === 'c') {
      // Cubic extremes lie where a coordinate's derivative is zero.
      const [x1, y1, x2, y2] = values as [number, number, number, number];
      for (const t of [...cubicExtremes(x1, x2, x - fromX), ...cubicExtremes(y1, y2, y - fromY)]) {
        const u = 1 - t;
        const a = 3 * u * u * t;
        const b = 3 * u * t * t;
        const c = t * t * t;
        if (
          !inside(
            fromX + a * x1 + b * x2 + c * (x - fromX),
            fromY + a * y1 + b * y2 + c * (y - fromY),
          )
        ) {
          return false;
        }
      }
    } else if (command === 'a') {
      const arc = resolveArc(
        fromX,
        fromY,
        x,
        y,
        ...(values as [number, number, number, number, number]),
      );
      if (arc && !arcExtremes(arc).every(([pointX, pointY]) => inside(pointX, pointY))) {
        return false;
      }
    }
  }
  return true;
}

/** Parameters in (0, 1) where a cubic from 0 through `p1` and `p2` to `p3` turns around. */
function cubicExtremes(p1: number, p2: number, p3: number): number[] {
  const a = 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p2 - 2 * p1);
  const c = p1;
  const roots =
    Math.abs(a) < 1e-12
      ? Math.abs(b) < 1e-12
        ? []
        : [-c / b]
      : (() => {
          const discriminant = b * b - 4 * a * c;
          if (discriminant < 0) return [];
          const root = Math.sqrt(discriminant);
          return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
        })();
  return roots.filter((t) => t > 0 && t < 1);
}

/** Points where an arc reaches its horizontal or vertical extremes within its sweep. */
function arcExtremes(arc: ResolvedArc): [number, number][] {
  const {radiusX, radiusY, cos, sin, startAngle, delta} = arc;
  const thetaX = Math.atan2(-radiusY * sin, radiusX * cos);
  const thetaY = Math.atan2(radiusY * cos, radiusX * sin);
  const turn = 2 * Math.PI;
  return [thetaX, thetaX + Math.PI, thetaY, thetaY + Math.PI]
    .filter((theta) => {
      const offset =
        (((delta >= 0 ? theta - startAngle : startAngle - theta) % turn) + turn) % turn;
      return offset <= Math.abs(delta);
    })
    .map((theta) => arcPoint(arc, theta));
}
