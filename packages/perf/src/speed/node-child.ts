/**
 * Runs one workload in a fresh Node.js process and prints its samples as JSON.
 *
 *   node --expose-gc src/speed/node-child.ts <bundle> <workload id> <sampler options JSON>
 */
import process from 'node:process';
import {pathToFileURL} from 'node:url';

import type {SampleResult, SamplerOptions} from './sampler.ts';

type Entry = {
  run(id: string, options: SamplerOptions, now: () => number): Promise<SampleResult>;
  consumeSink(): unknown;
};

const [bundle, id, options] = process.argv.slice(2);
if (!bundle || !id || !options) throw new Error('Usage: node-child.ts <bundle> <id> <options>');

const entry = (await import(pathToFileURL(bundle).href)) as Entry;
(globalThis as {gc?: () => void}).gc?.();
const result = await entry.run(id, JSON.parse(options) as SamplerOptions, () => performance.now());
// Reading the sink keeps the final result observable.
process.stdout.write(JSON.stringify({...result, sink: typeof entry.consumeSink()}));
