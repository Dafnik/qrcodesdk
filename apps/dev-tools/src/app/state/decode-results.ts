import {Injectable, computed, signal} from '@angular/core';

import type {DevFixture} from '../fixtures/fixture-catalog';
import {
  type DecodeResult,
  type DecodeStatus,
  type RenderedOutput,
  decodeOutput,
} from '../rendering/decode';
import {renderHeadless} from '../rendering/headless-render';
import type {RendererId} from '../rendering/renderers';

export function resultKey(fixture: DevFixture, renderer: RendererId): string {
  return `${fixture.id}|${renderer}`;
}

type Counts = Readonly<Record<DecodeStatus, number>>;
const EMPTY_COUNTS: Counts = {pass: 0, fail: 0, 'known-fail': 0};

/**
 * jsQR results of the current run. Decodes run one at a time, so scrolling stays responsive, and
 * signal updates are batched per animation frame, so thousands of results don't recompute
 * filters thousands of times.
 */
@Injectable({providedIn: 'root'})
export class DecodeResults {
  private readonly results = new Map<string, DecodeResult>();
  private readonly pending = new Set<string>();
  private queue: Promise<void> = Promise.resolve();
  private generation = 0;
  private flushScheduled = false;
  private counts: Record<DecodeStatus, number> = {...EMPTY_COUNTS};

  private readonly _version = signal(0);
  private readonly _counts = signal<Counts>(EMPTY_COUNTS);
  private readonly _bulk = signal<{done: number; total: number} | undefined>(undefined);

  /** Changes whenever results change. Read it to make a computed depend on results. */
  readonly version = this._version.asReadonly();
  readonly summary = this._counts.asReadonly();
  readonly checked = computed(() => {
    const counts = this._counts();
    return counts.pass + counts.fail + counts['known-fail'];
  });
  /** Progress of "Decode all", or `undefined` when it isn't running. */
  readonly bulkProgress = this._bulk.asReadonly();

  get(key: string): DecodeResult | undefined {
    return this.results.get(key);
  }

  isKnown(key: string): boolean {
    return this.results.has(key) || this.pending.has(key);
  }

  /** Drops all results and cancels queued decodes and "Decode all". */
  reset(): void {
    this.generation++;
    this.results.clear();
    this.pending.clear();
    this.counts = {...EMPTY_COUNTS};
    this._bulk.set(undefined);
    this.scheduleFlush();
  }

  /** Queues a decode of output a mounted component rendered. */
  decode(key: string, fixture: DevFixture, output: RenderedOutput | undefined): void {
    if (this.isKnown(key)) return;
    this.pending.add(key);
    const generation = this.generation;
    this.enqueue(async () => {
      if (generation !== this.generation) return;
      const result = await decodeOutput(output, fixture.payload, fixture.knownDecodeIssue);
      if (generation === this.generation) this.store(key, result);
    });
  }

  /** Renders and decodes every fixture × renderer pair without mounting components. */
  decodeAll(fixtures: readonly DevFixture[], renderers: readonly RendererId[]): void {
    if (this._bulk()) return;
    const generation = this.generation;
    const pairs: [string, DevFixture, RendererId][] = [];
    for (const fixture of fixtures) {
      for (const renderer of renderers) {
        const key = resultKey(fixture, renderer);
        if (!this.isKnown(key)) pairs.push([key, fixture, renderer]);
      }
    }
    if (pairs.length === 0) return;

    this._bulk.set({done: 0, total: pairs.length});
    for (const [key] of pairs) this.pending.add(key);

    this.enqueue(async () => {
      let sliceStart = performance.now();
      for (let index = 0; index < pairs.length; index++) {
        if (generation !== this.generation || !this._bulk()) break;
        const [key, fixture, renderer] = pairs[index]!;
        if (!this.results.has(key)) {
          let output: RenderedOutput | undefined;
          try {
            output = renderHeadless(fixture, renderer);
          } catch (error) {
            console.error(`Rendering ${key} failed`, error);
          }
          this.store(key, await decodeOutput(output, fixture.payload, fixture.knownDecodeIssue));
        }
        // Yield to the browser every ~12ms.
        if (performance.now() - sliceStart > 12) {
          this._bulk.set({done: index + 1, total: pairs.length});
          await new Promise((resolve) => setTimeout(resolve));
          sliceStart = performance.now();
        }
      }
      if (generation === this.generation) {
        for (const [key] of pairs) if (!this.results.has(key)) this.pending.delete(key);
        this._bulk.set(undefined);
      }
    });
  }

  cancelDecodeAll(): void {
    this._bulk.set(undefined);
  }

  private enqueue(task: () => Promise<void>): void {
    this.queue = this.queue.then(task).catch((error: unknown) => console.error(error));
  }

  private store(key: string, result: DecodeResult): void {
    const previous = this.results.get(key);
    if (previous) this.counts[previous.status]--;
    this.results.set(key, result);
    this.pending.delete(key);
    this.counts[result.status]++;
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    requestAnimationFrame(() => {
      this.flushScheduled = false;
      this._counts.set({...this.counts});
      this._version.update((version) => version + 1);
    });
  }
}
