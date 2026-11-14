import {Injectable, signal} from '@angular/core';

import type {DevFixture} from '../fixtures/fixture-catalog';
import {
  DECODERS,
  type DecodeResult,
  type DecodeStatus,
  type DecoderId,
  type RenderedOutput,
  decodeOutput,
} from '../rendering/decode';
import {renderHeadless} from '../rendering/headless-render';
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
 * Decoder results of the current run, one per fixture, renderer, and decoder. Decodes run one at a
 * time, so scrolling stays responsive, and signal updates are batched per animation frame, so
 * thousands of results don't recompute filters thousands of times.
 */
@Injectable({providedIn: 'root'})
export class DecodeResults {
  private readonly results = new Map<string, DecodeResult>();
  private readonly pending = new Set<string>();
  private queue: Promise<void> = Promise.resolve();
  private generation = 0;
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
    this._runId.update((id) => id + 1);
    this.results.clear();
    this.pending.clear();
    this.counts = emptyDecoderCounts();
    this._bulk.set(undefined);
    this.scheduleFlush();
  }

  /** Queues the decoders that have no result yet for output a mounted component rendered. */
  decode(
    fixture: DevFixture,
    renderer: RendererId,
    output: RenderedOutput | undefined,
    decoders: readonly DecoderId[],
  ): void {
    const missing = this.claim(fixture, renderer, decoders);
    if (missing.length === 0) return;
    const generation = this.generation;
    this.enqueue(async () => {
      if (generation !== this.generation) return;
      const results = await decodeOutput(
        output,
        fixture.payload,
        missing,
        fixture.knownDecodeIssues,
      );
      if (generation === this.generation) this.storeAll(fixture, renderer, results);
    });
  }

  /** Renders and decodes every fixture × renderer pair without mounting components. */
  decodeAll(
    fixtures: readonly DevFixture[],
    renderers: readonly RendererId[],
    decoders: readonly DecoderId[],
  ): void {
    if (this._bulk()) return;
    const generation = this.generation;
    const pairs: [DevFixture, RendererId, DecoderId[]][] = [];
    for (const fixture of fixtures) {
      for (const renderer of renderers) {
        const missing = this.claim(fixture, renderer, decoders);
        if (missing.length > 0) pairs.push([fixture, renderer, missing]);
      }
    }
    if (pairs.length === 0) return;

    this._bulk.set({done: 0, total: pairs.length});

    this.enqueue(async () => {
      let sliceStart = performance.now();
      for (let index = 0; index < pairs.length; index++) {
        if (generation !== this.generation || !this._bulk()) break;
        const [fixture, renderer, missing] = pairs[index]!;
        let output: RenderedOutput | undefined;
        try {
          output = renderHeadless(fixture, renderer);
        } catch (error) {
          console.error(`Rendering ${fixture.id} with ${renderer} failed`, error);
        }
        const results = await decodeOutput(
          output,
          fixture.payload,
          missing,
          fixture.knownDecodeIssues,
        );
        // A reset during the decode drops this run's results.
        if (generation !== this.generation) break;
        this.storeAll(fixture, renderer, results);
        // Yield to the browser every ~12ms.
        if (performance.now() - sliceStart > 12) {
          this._bulk.set({done: index + 1, total: pairs.length});
          await new Promise((resolve) => setTimeout(resolve));
          sliceStart = performance.now();
        }
      }
      if (generation === this.generation) {
        for (const [fixture, renderer, missing] of pairs) {
          for (const decoder of missing) {
            const key = resultKey(fixture, renderer, decoder);
            if (!this.results.has(key)) this.pending.delete(key);
          }
        }
        this._bulk.set(undefined);
      }
    });
  }

  cancelDecodeAll(): void {
    this._bulk.set(undefined);
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

  private enqueue(task: () => Promise<void>): void {
    this.queue = this.queue.then(task).catch((error: unknown) => console.error(error));
  }

  private storeAll(
    fixture: DevFixture,
    renderer: RendererId,
    results: ReadonlyMap<DecoderId, DecodeResult>,
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
    });
  }
}
