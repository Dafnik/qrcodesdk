import {type QRCodeFixtureImage, fixtureImageDataURL} from '@repo/core-testing';

import {
  type QRCodeCanvasOptions,
  type QRCodeSVGOptions,
  canvasCenterImage,
  svgCenterImage,
} from '@qrcodesdk/angular';

import type {DevFixture} from '../fixtures/fixture-catalog';

export type RendererId = 'svg' | 'png' | 'webp' | 'gif' | 'canvas';

export const RENDERERS: readonly {
  readonly id: RendererId;
  readonly label: string;
  readonly component: string;
}[] = [
  {id: 'svg', label: 'SVG', component: 'QRCodeSVG'},
  {id: 'png', label: 'PNG', component: 'QRCodePNG'},
  {id: 'webp', label: 'WebP', component: 'QRCodeWebP'},
  {id: 'gif', label: 'GIF', component: 'QRCodeGIF'},
  {id: 'canvas', label: 'Canvas', component: 'QRCodeCanvas'},
];

export function rendererLabel(id: RendererId): string {
  return RENDERERS.find((renderer) => renderer.id === id)?.label ?? id;
}

const imageCanvases = new WeakMap<QRCodeFixtureImage, HTMLCanvasElement>();
const imageDataURLs = new WeakMap<QRCodeFixtureImage, ReturnType<typeof fixtureImageDataURL>>();
const svgOptionsCache = new WeakMap<DevFixture, QRCodeSVGOptions>();
const canvasOptionsCache = new WeakMap<DevFixture, QRCodeCanvasOptions>();

/** Draws fixture pixels on a canvas, for use with `canvasCenterImage()`. */
function fixtureImageCanvas(image: QRCodeFixtureImage): HTMLCanvasElement {
  let canvas = imageCanvases.get(image);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    canvas
      .getContext('2d')
      ?.putImageData(
        new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
        0,
        0,
      );
    imageCanvases.set(image, canvas);
  }
  return canvas;
}

function imageDataURL(image: QRCodeFixtureImage): ReturnType<typeof fixtureImageDataURL> {
  let url = imageDataURLs.get(image);
  if (!url) {
    url = fixtureImageDataURL(image);
    imageDataURLs.set(image, url);
  }
  return url;
}

/** Options for `QRCodeSVG`. Cached per fixture, so recycled tiles keep stable inputs. */
export function svgOptions(fixture: DevFixture): QRCodeSVGOptions {
  let options = svgOptionsCache.get(fixture);
  if (!options) {
    const {centerImage} = fixture;
    options = {
      matrix: fixture.matrix,
      style: fixture.style,
      centerImage: centerImage
        ? svgCenterImage(imageDataURL(centerImage.image), centerImage.layout)
        : undefined,
    };
    svgOptionsCache.set(fixture, options);
  }
  return options;
}

/** Options for `QRCodeCanvas`, `QRCodePNG`, `QRCodeWebP`, and `QRCodeGIF`. */
export function canvasOptions(fixture: DevFixture): QRCodeCanvasOptions {
  let options = canvasOptionsCache.get(fixture);
  if (!options) {
    const {centerImage} = fixture;
    options = {
      matrix: fixture.matrix,
      style: fixture.style,
      centerImage: centerImage
        ? canvasCenterImage(fixtureImageCanvas(centerImage.image), centerImage.layout)
        : undefined,
    };
    canvasOptionsCache.set(fixture, options);
  }
  return options;
}
