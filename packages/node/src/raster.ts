import type {QRCodeShapePath} from '@qrcodesdk/core';
import {ɵparseShapePath as parseShapePath} from '@qrcodesdk/core/internal';

/** Coverage of one shape path in 4x4 samples per pixel, from 0 to 16. */
export type Coverage = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly samples: Uint8Array;
};

const SAMPLES = 4;

/**
 * Rasterizes relative shape path data at `scale` pixels per module with the even-odd rule. The
 * coverage origin is the path origin, offset by the integer pixel bounds in `x` and `y`.
 */
export function rasterizeShapePath(
  path: QRCodeShapePath,
  scale: number,
  offsetX = 0,
  offsetY = 0,
): Coverage {
  const polygons = flattenShapePath(path, scale, offsetX, offsetY);
  let minimumX = Infinity;
  let minimumY = Infinity;
  let maximumX = -Infinity;
  let maximumY = -Infinity;
  for (const points of polygons) {
    for (let index = 0; index < points.length; index += 2) {
      minimumX = Math.min(minimumX, points[index]!);
      maximumX = Math.max(maximumX, points[index]!);
      minimumY = Math.min(minimumY, points[index + 1]!);
      maximumY = Math.max(maximumY, points[index + 1]!);
    }
  }
  if (minimumX > maximumX) return {x: 0, y: 0, width: 0, height: 0, samples: new Uint8Array()};
  const x = Math.floor(minimumX);
  const y = Math.floor(minimumY);
  const width = Math.ceil(maximumX) - x;
  const height = Math.ceil(maximumY) - y;
  const samples = new Uint8Array(width * height);
  const crossings: number[] = [];

  for (let sampleRow = 0; sampleRow < height * SAMPLES; sampleRow++) {
    const sampleY = y + (sampleRow + 0.5) / SAMPLES;
    crossings.length = 0;
    for (const points of polygons) {
      for (let index = 0, previous = points.length - 2; index < points.length; index += 2) {
        const x1 = points[previous]!;
        const y1 = points[previous + 1]!;
        const x2 = points[index]!;
        const y2 = points[index + 1]!;
        if (y1 > sampleY !== y2 > sampleY) {
          crossings.push(x1 + ((sampleY - y1) * (x2 - x1)) / (y2 - y1));
        }
        previous = index;
      }
    }
    crossings.sort((left, right) => left - right);
    const rowOffset = Math.floor(sampleRow / SAMPLES) * width;
    for (let index = 0; index + 1 < crossings.length; index += 2) {
      // Sample columns whose centers fall inside the span.
      const start = Math.max(0, Math.ceil((crossings[index]! - x) * SAMPLES - 0.5));
      const end = Math.min(width * SAMPLES, Math.ceil((crossings[index + 1]! - x) * SAMPLES - 0.5));
      for (let sampleColumn = start; sampleColumn < end; sampleColumn++) {
        samples[rowOffset + Math.floor(sampleColumn / SAMPLES)]!++;
      }
    }
  }
  return {x, y, width, height, samples};
}

/** Converts relative `m l h v c a z` path data into closed polygons in pixels. */
function flattenShapePath(
  path: string,
  scale: number,
  offsetX: number,
  offsetY: number,
): number[][] {
  const polygons: number[][] = [];
  let points: number[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  const add = (pointX: number, pointY: number) => {
    x = pointX;
    y = pointY;
    points.push(x * scale + offsetX, y * scale + offsetY);
  };
  const close = () => {
    if (points.length >= 6) polygons.push(points);
    points = [];
    x = startX;
    y = startY;
  };

  for (const {command, values} of parseShapePath('tile', path)) {
    if (command === 'm') {
      startX = x + values[0]!;
      startY = y + values[1]!;
      add(startX, startY);
    } else if (command === 'l') {
      add(x + values[0]!, y + values[1]!);
    } else if (command === 'h') {
      add(x + values[0]!, y);
    } else if (command === 'v') {
      add(x, y + values[0]!);
    } else if (command === 'c') {
      const [x1, y1, x2, y2, endX, endY] = values as [
        number,
        number,
        number,
        number,
        number,
        number,
      ];
      const fromX = x;
      const fromY = y;
      const steps = curveSteps(
        Math.hypot(x1, y1) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(endX - x2, endY - y2),
        scale,
      );
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        const u = 1 - t;
        const a = 3 * u * u * t;
        const b = 3 * u * t * t;
        const c = t * t * t;
        add(fromX + a * x1 + b * x2 + c * endX, fromY + a * y1 + b * y2 + c * endY);
      }
    } else if (command === 'a') {
      arc(
        x,
        y,
        x + values[5]!,
        y + values[6]!,
        values[0]!,
        values[1]!,
        values[2]!,
        values[3]!,
        values[4]!,
        add,
        scale,
      );
    } else {
      close();
    }
  }
  return polygons;
}

function curveSteps(length: number, scale: number): number {
  return Math.max(4, Math.ceil(length * scale));
}

/** Flattens an SVG endpoint arc, following the SVG implementation notes (B.2.4). */
function arc(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  largeArc: number,
  sweep: number,
  add: (x: number, y: number) => void,
  scale: number,
): void {
  radiusX = Math.abs(radiusX);
  radiusY = Math.abs(radiusY);
  if (radiusX === 0 || radiusY === 0 || (fromX === toX && fromY === toY)) {
    add(toX, toY);
    return;
  }
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
  const centerX = cos * centerX1 - sin * centerY1 + (fromX + toX) / 2;
  const centerY = sin * centerX1 + cos * centerY1 + (fromY + toY) / 2;
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

  const steps = curveSteps(Math.abs(delta) * Math.max(radiusX, radiusY), scale);
  for (let step = 1; step < steps; step++) {
    const theta = startAngle + (delta * step) / steps;
    const pointX = radiusX * Math.cos(theta);
    const pointY = radiusY * Math.sin(theta);
    add(cos * pointX - sin * pointY + centerX, sin * pointX + cos * pointY + centerY);
  }
  add(toX, toY);
}
