import type {PreparedShapePath} from '../shape-path';
import type {QRCodeColor, QRCodeMatrix, QRCodeModuleRole} from '../types';

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
  readonly tiles: readonly (readonly [path: PreparedShapePath, positions: readonly number[]])[];
};

/**
 * Draws one group of modules, such as the finder patterns, before the remaining modules. Renderer
 * parts, such as center images, run before style parts.
 */
export type QRCodeStylePart = (context: QRCodeDrawContext) => void;

export interface QRCodeDrawContext {
  readonly matrix: QRCodeMatrix;
  /** Stops drawing modules with these roles as modules, because the part draws them itself. */
  claimRoles(...roles: QRCodeModuleRole[]): void;
  /** Stops drawing every module touched by this area in matrix coordinates, leaving the background. */
  claimArea(x: number, y: number, width: number, height: number): void;
  /** Whether a claimed area overlaps this area, so a part can skip patterns behind it. */
  isAreaClaimed(x: number, y: number, width: number, height: number): boolean;
  /** Returns the layer for a color, or for the foreground when the color is omitted. */
  layer(color?: QRCodeColor): QRCodeDrawLayer;
}

/** Collects geometry in matrix coordinates. */
export interface QRCodeDrawLayer {
  /** Draws a rectangle with finite coordinates and non-negative dimensions. */
  rect(x: number, y: number, width: number, height: number): void;
  /** Places a path at finite coordinates, which may be fractional. */
  tile(path: PreparedShapePath, x: number, y: number): void;
}
