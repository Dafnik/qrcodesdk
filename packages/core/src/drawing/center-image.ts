import {throwInvalid} from '../options';
import type {QRCodeCenterImageLayout} from '../types';
import type {QRCodeDrawing, QRCodeStylePart} from './types';

/** An image box in view coordinates. */
export type QRCodeCenterImageBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type QRCodeCenterImagePlacement = {
  /** Clears the modules behind the image and its padding, unless clearing is disabled. */
  readonly part: QRCodeStylePart;
  /** Returns the image box for a drawing. */
  place(
    drawing: Pick<QRCodeDrawing, 'moduleWidth' | 'moduleHeight' | 'quietZone'>,
  ): QRCodeCenterImageBox;
};

/**
 * Fits the image inside a square sized from the shorter side of the symbol. Clears the modules
 * touched by the fitted image and its padding.
 */
export function createQRCodeCenterImagePlacement(
  layout?: QRCodeCenterImageLayout,
  aspectRatio = 1,
  readAspectRatio?: () => number,
): QRCodeCenterImagePlacement {
  const size = layout?.size ?? 0.3;
  const padding = layout?.padding ?? 1;
  const clearBackground = layout?.clearBackground ?? true;
  if (!Number.isFinite(size) || size <= 0 || size > 1) {
    throwInvalid('centerImage.size', 'greater than 0 and at most 1', size);
  }
  if (!Number.isFinite(padding) || padding < 0) {
    throwInvalid('centerImage.padding', 'a non-negative finite number', padding);
  }
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    throwInvalid('centerImage.aspectRatio', 'a positive finite number', aspectRatio);
  }
  // Image box in matrix coordinates.
  const box = (moduleWidth: number, moduleHeight: number): QRCodeCenterImageBox => {
    const side = Math.min(moduleWidth, moduleHeight) * size;
    const ratio = readAspectRatio?.() ?? aspectRatio;
    const width = side * Math.min(1, ratio);
    const height = side / Math.max(1, ratio);
    return {x: (moduleWidth - width) / 2, y: (moduleHeight - height) / 2, width, height};
  };

  return {
    part(context) {
      if (!clearBackground) return;
      const {x, y, width, height} = box(context.matrix.width, context.matrix.height);
      // Whole modules that the image or its padding touches.
      const startX = Math.floor(x - padding);
      const startY = Math.floor(y - padding);
      context.claimArea(
        startX,
        startY,
        Math.ceil(x + width + padding) - startX,
        Math.ceil(y + height + padding) - startY,
      );
    },
    place({moduleWidth, moduleHeight, quietZone}) {
      const {x, y, width, height} = box(moduleWidth, moduleHeight);
      return {x: quietZone + x, y: quietZone + y, width, height};
    },
  };
}
