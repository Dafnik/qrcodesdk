import type {QRCodeColor, QRCodeMatrix, QRCodeShapePath} from '../types';

export {createQRCodeStyler} from './styler';
export {toQRCodePathData} from './path-data';
export {
  type QRCodeCenterImageBox,
  type QRCodeCenterImagePlacement,
  createQRCodeCenterImage,
} from './center-image';
export type {
  QRCodeCenterImageLayout,
  QRCodeDrawContext,
  QRCodeDrawLayer,
  QRCodeModuleRole,
  QRCodeStylePart,
} from '../types';

/** Names for the `QRCodeModuleRole` values in `QRCodeMatrix.roles`. */
export const QR_CODE_MODULE_ROLES = {
  data: 0,
  finderRing: 1,
  finderCenter: 2,
  separator: 3,
  alignmentRing: 4,
  alignmentCenter: 5,
  timing: 6,
  format: 7,
  version: 8,
} as const;

export type QRCodeStyler = (matrix: QRCodeMatrix) => QRCodeDrawing;

/** Renderer-neutral geometry in view coordinates, where one unit is one module. */
export type QRCodeDrawing = {
  readonly moduleCount: number;
  readonly moduleSize: number;
  readonly quietZone: number;
  /** Width and height in modules, including the quiet zone. */
  readonly viewSize: number;
  /** Width and height in pixels. */
  readonly outputSize: number;
  readonly background: QRCodeColor;
  /** Layers in paint order. Geometry never overlaps, within or across layers. */
  readonly layers: readonly QRCodeDrawingLayer[];
};

export type QRCodeDrawingLayer = {
  readonly color: QRCodeColor;
  /** Filled rectangles as flat x, y, width, height values. */
  readonly rects: readonly number[];
  /** Shaped pieces: one path and the flat x, y positions of its top-left corners. */
  readonly tiles: readonly (readonly [path: QRCodeShapePath, positions: readonly number[]])[];
};
