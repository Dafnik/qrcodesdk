import type {QRCodeMatrix} from '../types';

export interface QRCodeStyler {
  draw(matrix: QRCodeMatrix): QRCodeStyledDrawing;
}

export interface QRCodeStyledDrawing {
  readonly moduleCount: number;
  readonly moduleSize: number;
  readonly quietZone: number;
  readonly viewSize: number;
  readonly outputSize: number;
  paint(target: QRCodeStyledDrawingTarget): void;
  placeCenterImage(
    options?: QRCodeStyledDrawingCenterImageOptions,
  ): QRCodeStyledDrawingCenterImagePlacement;
}

export interface QRCodeStyledDrawingTarget {
  drawBackground(red: number, green: number, blue: number, alpha: number): void;
  beginLayer(red: number, green: number, blue: number, alpha: number): void;
  drawRectangle(x: number, y: number, width: number, height: number): void;
  beginPath(fillRule: 'nonzero' | 'evenodd'): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ): void;
  cubicTo(
    control1X: number,
    control1Y: number,
    control2X: number,
    control2Y: number,
    x: number,
    y: number,
  ): void;
  closePath(): void;
  endPath(): void;
  endLayer(): void;
}

interface QRCodeStyledDrawingCenterImageOptions {
  readonly size?: number;
  readonly padding?: number;
  readonly clearBackground?: boolean;
}

interface QRCodeStyledDrawingCenterImagePlacement {
  readonly centerImage: {readonly x: number; readonly y: number; readonly size: number};
  readonly clear: {readonly x: number; readonly y: number; readonly size: number} | undefined;
}
