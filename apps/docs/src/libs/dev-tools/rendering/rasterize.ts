import type {Pixels, Raster} from './decode';
import type {RendererId} from './renderers';

/** A renderer's output, captured before a recycled tile replaces it. */
export type RenderedOutput =
  | {readonly kind: 'svg'; readonly svg: string}
  | {readonly kind: 'image'; readonly image: HTMLImageElement}
  | {readonly kind: 'canvas'; readonly canvas: HTMLCanvasElement};

/** Reads the output a `@qrcodesdk/angular` component rendered into its host element. */
export function captureOutput(host: Element, renderer: RendererId): RenderedOutput | undefined {
  switch (renderer) {
    case 'svg': {
      const svg = host.querySelector('svg');
      return svg ? {kind: 'svg', svg: svg.outerHTML} : undefined;
    }
    case 'canvas': {
      const canvas = host.querySelector('canvas');
      return canvas ? {kind: 'canvas', canvas} : undefined;
    }
    default: {
      const image = host.querySelector('img');
      return image ? {kind: 'image', image} : undefined;
    }
  }
}

/** Draws the output on a white page, so transparent backgrounds stay light, and reads it back. */
export async function rasterize(output: RenderedOutput | undefined): Promise<Raster> {
  const start = performance.now();
  let pixels: Pixels | string;
  try {
    pixels = await readPixels(output);
  } catch (error) {
    pixels = error instanceof Error ? error.message : String(error);
  }
  return {pixels, durationMs: performance.now() - start};
}

async function readPixels(output: RenderedOutput | undefined): Promise<Pixels> {
  if (!output) throw new Error('The component rendered no output.');
  const {source, width, height} = await toImageSource(output);
  if (!width || !height) throw new Error('The output has no size.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Unable to create a 2D canvas context.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return {data: context.getImageData(0, 0, width, height).data, width, height};
}

async function toImageSource(
  output: RenderedOutput,
): Promise<{source: CanvasImageSource; width: number; height: number}> {
  switch (output.kind) {
    case 'canvas':
      return {source: output.canvas, width: output.canvas.width, height: output.canvas.height};
    case 'image':
      await waitForImage(output.image);
      return {
        source: output.image,
        width: output.image.naturalWidth,
        height: output.image.naturalHeight,
      };
    case 'svg': {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(output.svg)}`;
      await waitForImage(image);
      const root = new DOMParser().parseFromString(output.svg, 'image/svg+xml').documentElement;
      const width = Number(root.getAttribute('width')) || image.naturalWidth;
      const height = Number(root.getAttribute('height')) || image.naturalHeight;
      return {source: image, width, height};
    }
  }
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete) {
    return image.naturalWidth > 0
      ? Promise.resolve()
      : Promise.reject(new Error('The image failed to load.'));
  }
  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(), {once: true});
    image.addEventListener('error', () => reject(new Error('The image failed to load.')), {
      once: true,
    });
  });
}
