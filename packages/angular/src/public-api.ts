/*
 * Public API Surface of angular
 */

export {QRCodeCanvas} from './lib/QRCodeCanvas';
export {QRCodeImage} from './lib/QRCodeImage';
export {QRCodeSVG} from './lib/QRCodeSVG';
export type {
  QRCodeCanvasCenterImage,
  QRCodeCanvasOptions,
  QRCodeImageOptions,
} from '@qrcodesdk/browser';
export type {
  QRCodeDataImageURL,
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeMode,
  QRCodePayload,
  QRCodeVersion,
  QRCodeSVGCenterImage,
  QRCodeSVGOptions,
} from '@qrcodesdk/core';
export {canvasCenterImage} from '@qrcodesdk/browser';
export {svgCenterImage} from '@qrcodesdk/core';
export {alignment, circle, customShape, diagonal, finder, rounded} from '@qrcodesdk/core/style';
export type {
  QRCodeAlignmentCenterShape,
  QRCodeAlignmentOptions,
  QRCodeAlignmentRingShape,
  QRCodeCenterImageLayout,
  QRCodeCircleShapeOptions,
  QRCodeColor,
  QRCodeFinderCenterShape,
  QRCodeFinderOptions,
  QRCodeFinderRingShape,
  QRCodeModuleShape,
  QRCodeModulePattern,
  QRCodeFinderStyle,
  QRCodeAlignmentStyle,
  QRCodeRoundedShapeOptions,
  QRCodeShape,
  QRCodeShapePath,
  QRCodeShapePiece,
  QRCodeVisualStyle,
} from '@qrcodesdk/core/style';
