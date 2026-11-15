import type {FeatureId} from '../areas.ts';
import type {SpeedTarget} from '../report-types.ts';

/**
 * One timed operation. `setup` runs once, outside the timing, and its result is passed to `run`.
 * `run` must return its result, so the runtime cannot discard the work.
 */
export type Workload<State = unknown> = {
  readonly id: string;
  readonly title: string;
  readonly features: readonly FeatureId[];
  /** Defaults to both targets. */
  readonly targets?: readonly SpeedTarget[];
  readonly setup?: () => State | Promise<State>;
  readonly run: (state: State) => unknown;
};

export type WorkloadGroup = {
  readonly id: string;
  readonly workloads: readonly Workload[];
};

/** Keeps the state type of each workload while collecting them in one group. */
export function workload<State>(definition: Workload<State>): Workload {
  return definition as Workload;
}

export const QR_VERSIONS = [1, 10, 40] as const;

/** A deterministic payload of `length` characters from `alphabet`. */
export function payloadOf(alphabet: string, length: number): string {
  let state = length;
  let result = '';
  for (let index = 0; index < length; index++) {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    result += alphabet[state % alphabet.length];
  }
  return result;
}

/** Alphanumeric payloads that fill versions 1, 10, and 40 at error correction level M. */
export const ALPHANUMERIC_PAYLOADS = {
  1: payloadOf('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:', 20),
  10: payloadOf('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:', 311),
  40: payloadOf('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:', 3391),
} as const;

export const URL_PAYLOAD = 'https://qrcodesdk.dev/guides/getting-started?utm_source=perf';
