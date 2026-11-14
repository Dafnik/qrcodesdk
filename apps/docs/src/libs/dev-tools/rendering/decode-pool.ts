import type {DecodeResult, DecoderId, KnownDecodeIssues, Raster} from './decode';
import type {DecodeWorkerRequest, DecodeWorkerResponse} from './decode-worker';
import type {RendererId} from './renderers';

type DecodeEntries = readonly [DecoderId, DecodeResult][];

type PoolWorker = {
  readonly worker: Worker;
  readonly pending: Map<
    number,
    {resolve: (results: DecodeEntries) => void; reject: (error: Error) => void}
  >;
};

/** Leaves one core for the page, and caps the workers that each load ZXing. */
const POOL_SIZE = Math.min(16, Math.max(1, (navigator.hardwareConcurrency || 4) - 1));

/**
 * Renders and decodes in Web Workers, so large runs use every core. Each job goes to the worker
 * with the fewest pending jobs. The workers start on first use.
 */
export class DecodePool {
  /** How many jobs keep every worker busy without queueing much work that a cancel discards. */
  readonly capacity = POOL_SIZE * 2;

  private workers: PoolWorker[] | undefined;
  private nextId = 0;

  /** Renders a fixture with a raster renderer in a worker, then decodes it. Not for SVG. */
  render(
    fixtureId: string,
    renderer: Exclude<RendererId, 'svg'>,
    decoders: readonly DecoderId[],
  ): Promise<DecodeEntries> {
    return this.post({id: this.nextId++, kind: 'render', fixtureId, renderer, decoders});
  }

  /** Decodes pixels the page rasterized. Transfers the pixel buffer to the worker. */
  decode(
    raster: Raster,
    payload: string,
    decoders: readonly DecoderId[],
    knownIssues?: KnownDecodeIssues,
  ): Promise<DecodeEntries> {
    const transfer = typeof raster.pixels === 'string' ? [] : [raster.pixels.data.buffer];
    return this.post(
      {id: this.nextId++, kind: 'raster', raster, payload, decoders, knownIssues},
      transfer,
    );
  }

  private post(
    request: DecodeWorkerRequest,
    transfer: Transferable[] = [],
  ): Promise<DecodeEntries> {
    const target = this.start().reduce((least, candidate) =>
      candidate.pending.size < least.pending.size ? candidate : least,
    );
    return new Promise((resolve, reject) => {
      target.pending.set(request.id, {resolve, reject});
      target.worker.postMessage(request, transfer);
    });
  }

  private start(): PoolWorker[] {
    this.workers ??= Array.from({length: POOL_SIZE}, () => {
      const worker = new Worker(new URL('./decode-worker.ts', import.meta.url), {
        type: 'module',
        name: 'qrcodesdk-decode',
      });
      const poolWorker: PoolWorker = {worker, pending: new Map()};
      worker.addEventListener('message', ({data}: MessageEvent<DecodeWorkerResponse>) => {
        const job = poolWorker.pending.get(data.id);
        if (!job) return;
        poolWorker.pending.delete(data.id);
        if ('error' in data) job.reject(new Error(data.error));
        else job.resolve(data.results);
      });
      worker.addEventListener('error', (event) => {
        const error = new Error(`Decode worker failed: ${event.message}`);
        for (const job of poolWorker.pending.values()) job.reject(error);
        poolWorker.pending.clear();
      });
      return poolWorker;
    });
    return this.workers;
  }
}
