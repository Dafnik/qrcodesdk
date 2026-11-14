import type {Pixels, Raster} from './decode';
import type {RenderedOutput} from './rasterize';

/**
 * The parts of the DOM that the `@qrcodesdk/browser` renderers use, backed by `OffscreenCanvas`
 * so the decode workers run the same renderers as the page. Import this module before anything
 * that renders.
 */
const PNG_PLACEHOLDER = 'worker-png:';

/** Canvases whose PNG data URL was requested, by placeholder URL. */
const pngCanvases = new Map<string, OffscreenCanvas>();
let nextPngId = 0;

/** An `<img>` without decoding: the worker rasterizer reads its `src`. */
class WorkerImage {
  src = '';
  width = 0;
  height = 0;
  alt = '';
  title = '';
  setAttribute(): void {}
}

function createCanvas(): OffscreenCanvas {
  return Object.assign(new OffscreenCanvas(1, 1), {
    title: '',
    setAttribute(): void {},
    // `toDataURL()` is synchronous, but `OffscreenCanvas` only encodes PNG asynchronously. The
    // rasterizer encodes the canvas when it reads the placeholder URL.
    toDataURL(this: OffscreenCanvas, type?: string): string {
      if (type !== undefined && type !== 'image/png') {
        throw new Error(`The worker cannot encode ${type} data URLs.`);
      }
      const url = `${PNG_PLACEHOLDER}${nextPngId++}`;
      pngCanvases.set(url, this);
      return url;
    },
  });
}

(globalThis as {document?: unknown}).document = {
  createElement(tagName: string): unknown {
    switch (tagName) {
      case 'canvas':
        return createCanvas();
      case 'img':
        return new WorkerImage();
      default:
        throw new Error(`The decode worker cannot create <${tagName}> elements.`);
    }
  },
};

/** Draws worker output on a white page and reads it back. SVG needs the page's image decoder. */
export async function rasterizeInWorker(output: RenderedOutput): Promise<Raster> {
  const start = performance.now();
  let pixels: Pixels | string;
  try {
    pixels = await readPixels(output);
  } catch (error) {
    pixels = error instanceof Error ? error.message : String(error);
  }
  return {pixels, durationMs: performance.now() - start};
}

async function readPixels(output: RenderedOutput): Promise<Pixels> {
  let source: CanvasImageSource;
  switch (output.kind) {
    case 'canvas':
      source = output.canvas as unknown as OffscreenCanvas;
      break;
    case 'image':
      source = await createImageBitmap(await imageBlob(output.image.src));
      break;
    case 'svg':
      throw new Error('The decode worker cannot rasterize SVG.');
  }
  const {width, height} = source as OffscreenCanvas | ImageBitmap;
  if (!width || !height) throw new Error('The output has no size.');

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Unable to create a 2D canvas context.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  if (source instanceof ImageBitmap) source.close();
  return {data: context.getImageData(0, 0, width, height).data, width, height};
}

async function imageBlob(src: string): Promise<Blob> {
  const canvas = pngCanvases.get(src);
  if (canvas) {
    pngCanvases.delete(src);
    return canvas.convertToBlob({type: 'image/png'});
  }
  const response = await fetch(src);
  if (!response.ok) throw new Error('The image failed to load.');
  return response.blob();
}
