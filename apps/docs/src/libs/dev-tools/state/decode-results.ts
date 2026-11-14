import {Injectable, signal} from '@angular/core';

import type {DevFixture} from '../fixtures/fixture-catalog';
import {DECODERS, type DecodeResult, type DecodeStatus, type DecoderId} from '../rendering/decode';
import {DecodePool} from '../rendering/decode-pool';
import {renderHeadless} from '../rendering/headless-render';
import {type RenderedOutput, rasterize} from '../rendering/rasterize';
import type {RendererId} from '../rendering/renderers';

export function resultKey(fixture: DevFixture, renderer: RendererId, decoder: DecoderId): string {
  return `${fixture.id}|${renderer}|${decoder}`;
}

type Counts = Readonly<Record<DecodeStatus, number>>;
type DecoderCounts = Readonly<Record<DecoderId, Counts>>;

const EMPTY_COUNTS: Counts = {pass: 0, fail: 0, 'known-fail': 0};

function emptyDecoderCounts(): Record<DecoderId, Record<DecodeStatus, number>> {
  return Object.fromEntries(DECODERS.map(({id}) => [id, {...EMPTY_COUNTS}])) as Record<
    DecoderId,
    Record<DecodeStatus, number>
  >;
}

/**
 * Decoder results of the current run, one per fixture, renderer, and decoder. Workers render and
 * decode in parallel, so scrolling stays responsive, and signal updates are batched per animation
 * frame, so thousands of results don't recompute filters thousands of times.
 */
@Injectable({providedIn: 'root'})
export class DecodeResults {
  private readonly pool = new DecodePool();
  private readonly results = new Map<string, DecodeResult>();
  private readonly pending = new Set<string>();
  private generation = 0;
  /** Identifies the running "Decode all", so a cancel or a reset stops it. */
  private bulkRun = 0;
  private bulkDone = 0;
  private flushScheduled = false;
  private counts = emptyDecoderCounts();

  private readonly _version = signal(0);
  private readonly _counts = signal<DecoderCounts>(emptyDecoderCounts());
  private readonly _bulk = signal<{done: number; total: number} | undefined>(undefined);
  private readonly _runId = signal(0);

  /** Changes whenever results change. Read it to make a computed depend on results. */
  readonly version = this._version.asReadonly();
  /** Result counts per decoder. */
  readonly summary = this._counts.asReadonly();
  /** Progress of "Decode all", or `undefined` when it isn't running. */
  readonly bulkProgress = this._bulk.asReadonly();
  /** Changes when results are reset, so tiles that stay mounted across runs decode again. */
  readonly runId = this._runId.asReadonly();

  /** Results of one decoder, across all its statuses. */
  checked(decoder: DecoderId): number {
    const counts = this._counts()[decoder];
    return counts.pass + counts.fail + counts['known-fail'];
  }

  get(key: string): DecodeResult | undefined {
    return this.results.get(key);
  }

  isKnown(key: string): boolean {
    return this.results.has(key) || this.pending.has(key);
  }

  /** Drops all results and cancels queued decodes and "Decode all". */
  reset(): void {
    this.generation++;
    this.bulkRun++;
    this._runId.update((id) => id + 1);
    this.results.clear();
    this.pending.clear();
    this.counts = emptyDecoderCounts();
    this._bulk.set(undefined);
    this.scheduleFlush();
  }

  /** Decodes the decoders that have no result yet for output a mounted component rendered. */
  decode(
    fixture: DevFixture,
    renderer: RendererId,
    output: RenderedOutput | undefined,
    decoders: readonly DecoderId[],
  ): void {
    const missing = this.claim(fixture, renderer, decoders);
    if (missing.length === 0) return;
    const generation = this.generation;
    // Rasterizes right away, before a recycled tile replaces the output.
    void rasterize(output)
      .then((raster) =>
        this.pool.decode(raster, fixture.payload, missing, fixture.knownDecodeIssues),
      )
      .then(
        (results) => {
          if (generation === this.generation) this.storeAll(fixture, renderer, results);
        },
        (error: unknown) => {
          console.error(`Decoding ${fixture.id} with ${renderer} failed`, error);
          if (generation === this.generation) this.release(fixture, renderer, missing);
        },
      );
  }

  /**
   * Renders and decodes every fixture × renderer pair without mounting components. Workers render
   * the raster outputs; the page renders and rasterizes SVG, which workers cannot decode.
   */
  decodeAll(
    fixtures: readonly DevFixture[],
    renderers: readonly RendererId[],
    decoders: readonly DecoderId[],
  ): void {
    if (this._bulk()) return;
    const pairs: [DevFixture, RendererId, DecoderId[]][] = [];
    for (const fixture of fixtures) {
      for (const renderer of renderers) {
        const missing = this.claim(fixture, renderer, decoders);
        if (missing.length > 0) pairs.push([fixture, renderer, missing]);
      }
    }
    if (pairs.length === 0) return;

    const run = ++this.bulkRun;
    const generation = this.generation;
    this.bulkDone = 0;
    this._bulk.set({done: 0, total: pairs.length});
    void this.runBulk(run, generation, pairs).finally(() => {
      // A reset already dropped the claims, and a new run may have claimed the same keys.
      if (generation !== this.generation) return;
      for (const [fixture, renderer, missing] of pairs) this.release(fixture, renderer, missing);
      if (run === this.bulkRun) this._bulk.set(undefined);
    });
  }

  cancelDecodeAll(): void {
    this.bulkRun++;
    this._bulk.set(undefined);
  }

  /** Keeps `pool.capacity` pairs in flight until all are done or the run is cancelled. */
  private async runBulk(
    run: number,
    generation: number,
    pairs: readonly [DevFixture, RendererId, DecoderId[]][],
  ): Promise<void> {
    const inFlight = new Set<Promise<void>>();
    for (const [fixture, renderer, missing] of pairs) {
      if (run !== this.bulkRun) break;
      const job = this.decodePair(fixture, renderer, missing)
        .then(
          // Results of a cancelled run still count, unless a reset dropped them.
          (results) => {
            if (generation === this.generation) this.storeAll(fixture, renderer, results);
          },
          (error: unknown) =>
            console.error(`Decoding ${fixture.id} with ${renderer} failed`, error),
        )
        .finally(() => {
          inFlight.delete(job);
          if (run !== this.bulkRun) return;
          this.bulkDone++;
          this.scheduleFlush();
        });
      inFlight.add(job);
      if (inFlight.size >= this.pool.capacity) await Promise.race(inFlight);
    }
    await Promise.all(inFlight);
  }

  private async decodePair(
    fixture: DevFixture,
    renderer: RendererId,
    decoders: readonly DecoderId[],
  ): Promise<readonly [DecoderId, DecodeResult][]> {
    if (renderer !== 'svg') return this.pool.render(fixture.id, renderer, decoders);
    let output: RenderedOutput | undefined;
    try {
      output = renderHeadless(fixture, renderer);
    } catch (error) {
      console.error(`Rendering ${fixture.id} with ${renderer} failed`, error);
    }
    const raster = await rasterize(output);
    return this.pool.decode(raster, fixture.payload, decoders, fixture.knownDecodeIssues);
  }

  /** Forgets pending decoders that got no result, so mounted tiles decode them again. */
  private release(fixture: DevFixture, renderer: RendererId, decoders: readonly DecoderId[]): void {
    for (const decoder of decoders) {
      const key = resultKey(fixture, renderer, decoder);
      if (!this.results.has(key)) this.pending.delete(key);
    }
  }

  /** Marks the decoders without a result as pending and returns them. */
  private claim(
    fixture: DevFixture,
    renderer: RendererId,
    decoders: readonly DecoderId[],
  ): DecoderId[] {
    const missing = decoders.filter(
      (decoder) => !this.isKnown(resultKey(fixture, renderer, decoder)),
    );
    for (const decoder of missing) this.pending.add(resultKey(fixture, renderer, decoder));
    return missing;
  }

  private storeAll(
    fixture: DevFixture,
    renderer: RendererId,
    results: Iterable<readonly [DecoderId, DecodeResult]>,
  ): void {
    for (const [decoder, result] of results) {
      const key = resultKey(fixture, renderer, decoder);
      const previous = this.results.get(key);
      if (previous) this.counts[decoder][previous.status]--;
      this.results.set(key, result);
      this.pending.delete(key);
      this.counts[decoder][result.status]++;
    }
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    requestAnimationFrame(() => {
      this.flushScheduled = false;
      this._counts.set(
        Object.fromEntries(
          DECODERS.map(({id}) => [id, {...this.counts[id]}]),
        ) as unknown as DecoderCounts,
      );
      this._version.update((version) => version + 1);
      const bulk = this._bulk();
      if (bulk && bulk.done !== this.bulkDone) this._bulk.set({...bulk, done: this.bulkDone});
    });
  }
}
