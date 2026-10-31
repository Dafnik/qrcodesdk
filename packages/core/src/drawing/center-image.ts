import {assertKnownKeys, throwInvalid} from '../options';
import type {QRCodeCenterImageLayout, QRCodeStylePart} from '../types';
import type {QRCodeDrawing} from './index';

/** A square box in view coordinates. */
export type QRCodeCenterImageBox = {readonly x: number; readonly y: number; readonly size: number};

export type QRCodeCenterImagePlacement = {
  /** Clears the modules behind the image and its padding, unless clearing is disabled. */
  readonly part: QRCodeStylePart;
  /** Returns the image box for a drawing. */
  place(drawing: Pick<QRCodeDrawing, 'moduleCount' | 'quietZone'>): QRCodeCenterImageBox;
};

/** Validates a center-image layout and returns its clearing part and placement. */
export function createQRCodeCenterImage(
  layout?: QRCodeCenterImageLayout,
): QRCodeCenterImagePlacement {
  assertKnownKeys(layout, 'centerImage', ['size', 'padding', 'clearBackground']);
  const size = layout?.size ?? 0.4;
  const padding = layout?.padding ?? 1;
  const clearBackground = layout?.clearBackground ?? true;
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > 1) {
    throwInvalid('centerImage.size', 'greater than 0 and at most 1', size);
  }
  if (typeof padding !== 'number' || !Number.isFinite(padding) || padding < 0) {
    throwInvalid('centerImage.padding', 'a non-negative finite number', padding);
  }
  if (typeof clearBackground !== 'boolean') {
    throwInvalid('centerImage.clearBackground', 'a boolean', clearBackground);
  }
  // Image position in matrix coordinates.
  const position = (moduleCount: number) => (moduleCount * (1 - size)) / 2;

  return {
    part(context) {
      if (!clearBackground) return;
      const moduleCount = context.matrix.size;
      // Whole modules that the image or its padding touches.
      const start = Math.floor(position(moduleCount) - padding);
      const end = Math.ceil(position(moduleCount) + moduleCount * size + padding);
      context.claimArea(start, start, end - start, end - start);
    },
    place({moduleCount, quietZone}) {
      const offset = quietZone + position(moduleCount);
      return {x: offset, y: offset, size: moduleCount * size};
    },
  };
}
