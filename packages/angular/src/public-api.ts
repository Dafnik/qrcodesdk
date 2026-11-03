/*
 * Public API Surface of angular
 */

export {QRCodeCanvas} from './lib/QRCodeCanvas';
export {QRCodeGIF} from './lib/QRCodeGIF';
export {QRCodeJPEG} from './lib/QRCodeJPEG';
export {QRCodePNG} from './lib/QRCodePNG';
export {QRCodeSVG} from './lib/QRCodeSVG';
export {QRCodeWebP} from './lib/QRCodeWebP';
export type {QRCodeDownloadHandle} from './lib/types';
export type {
  QRCodeCanvasAccessibilityOptions,
  QRCodeCanvasCenterImage,
  QRCodeCanvasOptions,
  QRCodeGIFImageOptions,
  QRCodeImageAccessibilityOptions,
  QRCodeJPEGImageOptions,
  QRCodePNGImageOptions,
  QRCodeWebPImageOptions,
} from '@qrcodesdk/browser';
export type {
  QRCodeDataImageURL,
  QRCodeErrorCorrectionLevel,
  QRCodeMask,
  QRCodeMatrixOptions,
  QRCodeMode,
  QRCodePayload,
  QRCodeVersion,
  QRCodeSVGAccessibilityOptions,
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
