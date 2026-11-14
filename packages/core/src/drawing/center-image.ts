import {throwInvalid} from '../options';
import type {QRCodeCenterImageLayout} from '../types';
import type {QRCodeStylePart} from './types';
import type {QRCodeDrawing} from './types';

/** A square box in view coordinates. */
export type QRCodeCenterImageBox = {readonly x: number; readonly y: number; readonly size: number};

export type QRCodeCenterImagePlacement = {
  /** Clears the modules behind the image and its padding, unless clearing is disabled. */
  readonly part: QRCodeStylePart;
  /** Returns the image box for a drawing. */
  place(
    drawing: Pick<QRCodeDrawing, 'moduleWidth' | 'moduleHeight' | 'quietZone'>,
  ): QRCodeCenterImageBox;
};

/**
 * Validates a center-image layout and returns its clearing part and placement. The image is a
 * square sized from the shorter side of the symbol and centered on both axes.
 */
export function createQRCodeCenterImagePlacement(
  layout?: QRCodeCenterImageLayout,
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
  // Image box in matrix coordinates.
  const box = (width: number, height: number) => {
    const side = Math.min(width, height) * size;
    return {x: (width - side) / 2, y: (height - side) / 2, size: side};
  };

  return {
    part(context) {
      if (!clearBackground) return;
      const {x, y, size: side} = box(context.matrix.width, context.matrix.height);
      // Whole modules that the image or its padding touches.
      const startX = Math.floor(x - padding);
      const startY = Math.floor(y - padding);
      context.claimArea(
        startX,
        startY,
        Math.ceil(x + side + padding) - startX,
        Math.ceil(y + side + padding) - startY,
      );
    },
    place({moduleWidth, moduleHeight, quietZone}) {
      const {x, y, size: side} = box(moduleWidth, moduleHeight);
      return {x: quietZone + x, y: quietZone + y, size: side};
    },
  };
}
