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
  QRCodeCenterImageLayout,
  QRCodeDataImageURL,
  QRCodeShape,
  QRCodeStylePart,
  QRCodeSVGCenterImage,
  QRCodeSVGOptions,
} from '@qrcodesdk/core';
export {canvasCenterImage} from '@qrcodesdk/browser';
export {svgCenterImage} from '@qrcodesdk/core';
export {alignment, circle, diagonal, finder, rounded} from '@qrcodesdk/core/style';
