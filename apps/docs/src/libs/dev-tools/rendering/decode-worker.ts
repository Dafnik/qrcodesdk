// Installs the DOM the renderers use before anything renders.
import {findDevFixture} from '../fixtures/fixture-lookup';
import {
  type DecodeResult,
  type DecoderId,
  type KnownDecodeIssues,
  type Raster,
  decodeRaster,
} from './decode';
import {renderHeadless} from './headless-render';
import type {RendererId} from './renderers';
import {rasterizeInWorker} from './worker-dom';

/** Renders a fixture with a raster renderer, or takes pixels the page rasterized. */
export type DecodeWorkerRequest = {readonly id: number; readonly decoders: readonly DecoderId[]} & (
  | {readonly kind: 'render'; readonly fixtureId: string; readonly renderer: RendererId}
  | {
      readonly kind: 'raster';
      readonly raster: Raster;
      readonly payload: string;
      readonly knownIssues?: KnownDecodeIssues;
    }
);

export type DecodeWorkerResponse =
  | {readonly id: number; readonly results: readonly [DecoderId, DecodeResult][]}
  | {readonly id: number; readonly error: string};

const scope = globalThis as unknown as {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<DecodeWorkerRequest>) => void,
  ): void;
  postMessage(message: DecodeWorkerResponse): void;
};

scope.addEventListener('message', ({data: request}) => {
  handle(request).then(
    (results) => scope.postMessage({id: request.id, results}),
    (error: unknown) => scope.postMessage({id: request.id, error: String(error)}),
  );
});

async function handle(request: DecodeWorkerRequest): Promise<[DecoderId, DecodeResult][]> {
  if (request.kind === 'raster') {
    return decodeRaster(request.raster, request.payload, request.decoders, request.knownIssues);
  }

  const fixture = findDevFixture(request.fixtureId);
  if (!fixture) throw new Error(`Unknown fixture ${request.fixtureId}`);
  let raster: Raster;
  try {
    raster = await rasterizeInWorker(renderHeadless(fixture, request.renderer));
  } catch (error) {
    console.error(`Rendering ${fixture.id} with ${request.renderer} failed`, error);
    raster = {pixels: `Rendering failed: ${String(error)}`, durationMs: 0};
  }
  return decodeRaster(raster, fixture.payload, request.decoders, fixture.knownDecodeIssues);
}
