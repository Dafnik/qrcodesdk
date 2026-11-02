import jsQR from 'jsqr';

import type {RendererId} from './renderers';

/** A renderer's output, captured before a recycled tile replaces it. */
export type RenderedOutput =
  | {readonly kind: 'svg'; readonly svg: string}
  | {readonly kind: 'image'; readonly image: HTMLImageElement}
  | {readonly kind: 'canvas'; readonly canvas: HTMLCanvasElement};

export type DecodeStatus = 'pass' | 'fail' | 'known-fail';

export type DecodeResult = {
  readonly status: DecodeStatus;
  readonly message: string;
  readonly decoded?: string;
  readonly width?: number;
  readonly height?: number;
  readonly durationMs: number;
};

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

/** Scans the output on a white page, so transparent backgrounds stay light. */
export async function decodeOutput(
  output: RenderedOutput | undefined,
  payload: string,
  knownIssue: string | undefined,
): Promise<DecodeResult> {
  const start = performance.now();
  const result = (
    status: 'pass' | 'fail',
    message: string,
    extra: Partial<DecodeResult> = {},
  ): DecodeResult => ({
    status: status === 'fail' && knownIssue ? 'known-fail' : status,
    message: status === 'fail' && knownIssue ? `${message} Known issue: ${knownIssue}` : message,
    durationMs: performance.now() - start,
    ...extra,
  });

  if (!output) return result('fail', 'The component rendered no output.');

  let source: CanvasImageSource;
  let width: number;
  let height: number;
  try {
    ({source, width, height} = await toImageSource(output));
  } catch (error) {
    return result('fail', error instanceof Error ? error.message : String(error));
  }
  if (!width || !height) return result('fail', 'The output has no size.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) return result('fail', 'Unable to create a 2D canvas context.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  const code = jsQR(context.getImageData(0, 0, width, height).data, width, height, {
    inversionAttempts: 'dontInvert',
  });

  if (!code) return result('fail', `jsQR found no QR code in the ${width}×${height} output.`);
  if (code.data !== payload) {
    return result('fail', 'The decoded text differs from the payload.', {
      decoded: code.data,
      width,
      height,
    });
  }
  return result('pass', `Decoded ${width}×${height} output.`, {decoded: code.data, width, height});
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
