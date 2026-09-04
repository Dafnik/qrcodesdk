import {QRCodeError} from '../error';
import {createQRCodeStylePlan} from '../style-plan';
import {assertKnownKeys, parseQRCodeColor, resolveQRCodeVisualStyle} from '../styling';
import type {QRCodeMatrix, QRCodeStylePrimitive, QRCodeVisualStyle} from '../types';
import type {QRCodeDrawing, QRCodeDrawingTarget, QRCodeStyler} from './index';

const TWO_PI = Math.PI * 2;

export function createQRCodeStyler(style?: QRCodeVisualStyle): QRCodeStyler {
  const resolved = resolveQRCodeVisualStyle(style);
  const drawings = new WeakMap<QRCodeMatrix, QRCodeDrawing>();

  return Object.freeze({
    draw(matrix: QRCodeMatrix) {
      const cached = drawings.get(matrix);
      if (cached) return cached;
      const plan = createQRCodeStylePlan(matrix, resolved);
      const background = parseQRCodeColor(plan.backgroundColor);
      const layerColors = plan.layers.map((layer) => parseQRCodeColor(layer.color));
      const drawing: QRCodeDrawing = Object.freeze({
        moduleCount: plan.moduleCount,
        moduleSize: resolved.moduleSize,
        quietZone: resolved.quietZone,
        viewSize: plan.viewSize,
        outputSize: plan.outputSize,
        paint(target: QRCodeDrawingTarget) {
          target.drawBackground(...background);
          for (let layerIndex = 0; layerIndex < plan.layers.length; layerIndex++) {
            const layer = plan.layers[layerIndex]!;
            target.beginLayer(...layerColors[layerIndex]!);
            for (let index = 0; index < layer.rectangles.length; index++) {
              const rectangle = layer.rectangles[index]!;
              target.drawRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            }
            if (layer.curvedPrimitives.length > 0) {
              target.beginPath('evenodd');
              for (let index = 0; index < layer.curvedPrimitives.length; index++) {
                paintPrimitive(target, layer.curvedPrimitives[index]!);
              }
              target.endPath();
            }
            target.endLayer();
          }
        },
        placeImage(options: Parameters<QRCodeDrawing['placeImage']>[0]) {
          return resolveImagePlacement(plan.moduleCount, resolved.quietZone, options);
        },
      });
      drawings.set(matrix, drawing);
      return drawing;
    },
  });
}

function resolveImagePlacement(
  moduleCount: number,
  quietZone: number,
  options?: Parameters<QRCodeDrawing['placeImage']>[0],
): ReturnType<QRCodeDrawing['placeImage']> {
  assertKnownKeys(options, 'image', ['size', 'padding', 'clearBackground']);
  const size = options?.size ?? 0.4;
  const padding = options?.padding ?? 1;
  const clearBackground = options?.clearBackground ?? true;
  if (!Number.isFinite(size) || size <= 0 || size > 1) {
    throwInvalid('image.size', 'greater than 0 and at most 1', size);
  }
  if (!Number.isFinite(padding) || padding < 0) {
    throwInvalid('image.padding', 'a non-negative finite number', padding);
  }
  if (typeof clearBackground !== 'boolean') {
    throwInvalid('image.clearBackground', 'a boolean', clearBackground);
  }

  const imageSize = moduleCount * size;
  const position = quietZone + (moduleCount - imageSize) / 2;
  const matrixEnd = quietZone + moduleCount;
  const clearStart = Math.max(quietZone, position - padding);
  const clearEnd = Math.min(matrixEnd, position + imageSize + padding);
  return {
    image: {x: position, y: position, size: imageSize},
    clear: clearBackground
      ? {x: clearStart, y: clearStart, size: clearEnd - clearStart}
      : undefined,
  };
}

function paintPrimitive(target: QRCodeDrawingTarget, primitive: QRCodeStylePrimitive): void {
  if (primitive.kind === 'finder-ring') {
    if (primitive.shape === 'circle') {
      circle(target, primitive.x, primitive.y, primitive.size);
      circle(target, primitive.x + 1, primitive.y + 1, primitive.size - 2);
      return;
    }
    const outerRadius = finderRadius(primitive.shape, primitive.size);
    const innerRadius = finderRadius(primitive.shape, primitive.size - 2);
    roundedSquare(target, primitive.x, primitive.y, primitive.size, outerRadius);
    roundedSquare(target, primitive.x + 1, primitive.y + 1, primitive.size - 2, innerRadius);
    return;
  }

  if (primitive.kind === 'finder-center') {
    if (primitive.shape === 'circle') {
      circle(target, primitive.x, primitive.y, primitive.size);
    } else {
      roundedSquare(
        target,
        primitive.x,
        primitive.y,
        primitive.size,
        finderRadius(primitive.shape, primitive.size),
      );
    }
    return;
  }

  switch (primitive.shape) {
    case 'circle':
      circle(target, primitive.x, primitive.y, primitive.size);
      return;
    case 'side-rounded':
      moveLocal(target, primitive, 0, 0);
      lineLocal(target, primitive, 0, 1);
      lineLocal(target, primitive, 0.5, 1);
      arcLocal(target, primitive, 0.5, 0.5, 0.5, Math.PI / 2, -Math.PI / 2, true);
      break;
    case 'corner-rounded':
      moveLocal(target, primitive, 0, 0);
      lineLocal(target, primitive, 0, 1);
      lineLocal(target, primitive, 1, 1);
      lineLocal(target, primitive, 1, 0.5);
      arcLocal(target, primitive, 0.5, 0.5, 0.5, 0, -Math.PI / 2, true);
      break;
    case 'corner-extra-rounded':
      moveLocal(target, primitive, 0, 0);
      lineLocal(target, primitive, 0, 1);
      lineLocal(target, primitive, 1, 1);
      arcLocal(target, primitive, 0, 1, 1, 0, -Math.PI / 2, true);
      break;
    case 'opposite-corners-rounded':
      moveLocal(target, primitive, 0, 0);
      lineLocal(target, primitive, 0, 0.5);
      arcLocal(target, primitive, 0.5, 0.5, 0.5, Math.PI, Math.PI / 2, true);
      lineLocal(target, primitive, 1, 1);
      lineLocal(target, primitive, 1, 0.5);
      arcLocal(target, primitive, 0.5, 0.5, 0.5, 0, -Math.PI / 2, true);
      break;
    default:
      roundedSquare(target, primitive.x, primitive.y, primitive.size, 0);
      return;
  }
  target.closePath();
}

function finderRadius(shape: 'square' | 'rounded' | 'extra-rounded', size: number): number {
  if (shape === 'square') return 0;
  return shape === 'rounded' ? Math.min(1, size / 2) : size / 2;
}

function circle(target: QRCodeDrawingTarget, x: number, y: number, size: number): void {
  const radius = size / 2;
  const centerX = x + radius;
  const centerY = y + radius;
  target.moveTo(centerX + radius, centerY);
  target.arc(centerX, centerY, radius, 0, TWO_PI, false);
  target.closePath();
}

function roundedSquare(
  target: QRCodeDrawingTarget,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  target.moveTo(x + radius, y);
  target.lineTo(x + size - radius, y);
  if (radius > 0) target.arc(x + size - radius, y + radius, radius, -Math.PI / 2, 0, false);
  target.lineTo(x + size, y + size - radius);
  if (radius > 0) target.arc(x + size - radius, y + size - radius, radius, 0, Math.PI / 2, false);
  target.lineTo(x + radius, y + size);
  if (radius > 0) target.arc(x + radius, y + size - radius, radius, Math.PI / 2, Math.PI, false);
  target.lineTo(x, y + radius);
  if (radius > 0) target.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
  target.closePath();
}

function moveLocal(
  target: QRCodeDrawingTarget,
  primitive: QRCodeStylePrimitive,
  x: number,
  y: number,
): void {
  target.moveTo(localX(primitive, x, y), localY(primitive, x, y));
}

function lineLocal(
  target: QRCodeDrawingTarget,
  primitive: QRCodeStylePrimitive,
  x: number,
  y: number,
): void {
  target.lineTo(localX(primitive, x, y), localY(primitive, x, y));
}

function arcLocal(
  target: QRCodeDrawingTarget,
  primitive: QRCodeStylePrimitive,
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  counterclockwise: boolean,
): void {
  const rotation = (primitive.rotation * Math.PI) / 180;
  target.arc(
    localX(primitive, centerX, centerY),
    localY(primitive, centerX, centerY),
    radius * primitive.size,
    startAngle + rotation,
    endAngle + rotation,
    counterclockwise,
  );
}

function localX(primitive: QRCodeStylePrimitive, localX: number, localY: number): number {
  switch (primitive.rotation) {
    case 90:
      return primitive.x + (1 - localY) * primitive.size;
    case 180:
      return primitive.x + (1 - localX) * primitive.size;
    case 270:
      return primitive.x + localY * primitive.size;
    default:
      return primitive.x + localX * primitive.size;
  }
}

function localY(primitive: QRCodeStylePrimitive, localX: number, localY: number): number {
  switch (primitive.rotation) {
    case 90:
      return primitive.y + localX * primitive.size;
    case 180:
      return primitive.y + (1 - localY) * primitive.size;
    case 270:
      return primitive.y + (1 - localX) * primitive.size;
    default:
      return primitive.y + localY * primitive.size;
  }
}

function throwInvalid(field: string, expected: string, value: unknown): never {
  throw new QRCodeError(
    'INVALID_OPTIONS',
    `QR code ${field} must be ${expected}, received ${String(value)}`,
    {details: {field, value}},
  );
}
