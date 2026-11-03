import {QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {QRCodeGIFImageRenderer} from '@qrcodesdk/browser/gif';
import {QRCodeJPEGImageRenderer} from '@qrcodesdk/browser/jpeg';
import {QRCodePNGImageRenderer} from '@qrcodesdk/browser/png';
import {QRCodeWebPImageRenderer} from '@qrcodesdk/browser/webp';
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

import type {DevFixture} from '../fixtures/fixture-catalog';
import type {RenderedOutput} from './decode';
import {type RendererId, canvasOptions, svgOptions} from './renderers';

/**
 * Renders a fixture without mounting an Angular component, with the renderers and options the
 * `@qrcodesdk/angular` components use. Lets "Decode all" check rows outside the virtual viewport.
 */
export function renderHeadless(fixture: DevFixture, renderer: RendererId): RenderedOutput {
  const builder = qrcode(fixture.payload).options(fixture.matrix);

  if (renderer === 'svg') {
    const {style, centerImage} = svgOptions(fixture);
    return {kind: 'svg', svg: builder.render(QRCodeSVGRenderer({style, centerImage}))};
  }

  const {style, centerImage} = canvasOptions(fixture);
  const options = {style, centerImage};
  switch (renderer) {
    case 'canvas':
      return {kind: 'canvas', canvas: builder.render(QRCodeCanvasRenderer(options))};
    case 'png':
      return {kind: 'image', image: builder.render(QRCodePNGImageRenderer(options))};
    case 'webp':
      return {kind: 'image', image: builder.render(QRCodeWebPImageRenderer(options))};
    case 'gif':
      return {kind: 'image', image: builder.render(QRCodeGIFImageRenderer(options))};
    case 'jpeg':
      return {kind: 'image', image: builder.render(QRCodeJPEGImageRenderer(options))};
  }
}
