import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';
import {promisify} from 'node:util';
import type {Browser} from 'playwright';

import {PERF_ROOT} from '../paths.ts';
import type {SpeedTarget} from '../report-types.ts';
import type {SampleResult, SamplerOptions} from './sampler.ts';

const run = promisify(execFile);

export type WorkloadInfo = {
  readonly id: string;
  readonly title: string;
  readonly features: readonly string[];
  readonly targets?: readonly SpeedTarget[];
};

export type Runner = {
  readonly target: SpeedTarget;
  /** The runtime version, such as the Chromium version. */
  readonly version?: string;
  list(entry: string): Promise<WorkloadInfo[]>;
  run(entry: string, id: string, options: SamplerOptions): Promise<SampleResult>;
  close(): Promise<void>;
};

/** Runs each workload in a fresh Node.js process. */
export function createNodeRunner(): Runner {
  return {
    target: 'node',
    async list(entry) {
      const module = (await import(pathToFileURL(entry).href)) as {workloads: WorkloadInfo[]};
      return module.workloads;
    },
    async run(entry, id, options) {
      try {
        const {stdout} = await run(
          process.execPath,
          [
            '--expose-gc',
            path.join(PERF_ROOT, 'src/speed/node-child.ts'),
            entry,
            id,
            JSON.stringify(options),
          ],
          {maxBuffer: 64 * 1024 * 1024},
        );
        return JSON.parse(stdout) as SampleResult;
      } catch (error) {
        const stderr = (error as {stderr?: string}).stderr ?? '';
        const message = stderr.split('\n').find((line) => /^\w*Error\b/.test(line));
        throw new Error(message ?? (error instanceof Error ? error.message : String(error)));
      }
    },
    async close() {},
  };
}

const ORIGIN = 'http://perf.localhost';

type PerfGlobal = {
  __perf?: {
    list(): WorkloadInfo[];
    run(id: string, options: SamplerOptions): Promise<SampleResult>;
  };
};

/**
 * Runs each workload on a fresh page in headless Chromium. Pages are served cross-origin
 * isolated, which gives `performance.now()` its finest resolution.
 */
export async function createBrowserRunner(): Promise<Runner> {
  const {chromium} = await import('playwright');
  const browser: Browser = await chromium.launch({headless: true});

  async function withPage<T>(entry: string, task: (page: import('playwright').Page) => Promise<T>) {
    const root = path.dirname(entry);
    const context = await browser.newContext();
    try {
      await context.route(`${ORIGIN}/**`, async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
        if (!file.startsWith(root)) return route.fulfill({status: 403});
        try {
          await route.fulfill({
            body: await readFile(file),
            contentType: file.endsWith('.html') ? 'text/html' : 'text/javascript',
            headers: {
              'Cross-Origin-Opener-Policy': 'same-origin',
              'Cross-Origin-Embedder-Policy': 'require-corp',
            },
          });
        } catch {
          await route.fulfill({status: 404});
        }
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${ORIGIN}/`);
      await page
        .waitForFunction(() => (globalThis as PerfGlobal).__perf !== undefined, undefined, {
          timeout: 30_000,
        })
        .catch((error: unknown) => {
          throw new Error(errors[0] ?? String(error));
        });
      return await task(page);
    } finally {
      await context.close();
    }
  }

  return {
    target: 'browser',
    version: browser.version(),
    list: (entry) =>
      withPage(entry, (page) => page.evaluate(() => (globalThis as PerfGlobal).__perf!.list())),
    run: (entry, id, options) =>
      withPage(entry, (page) =>
        page.evaluate(
          ([workloadId, samplerOptions]) =>
            (globalThis as PerfGlobal).__perf!.run(workloadId, samplerOptions),
          [id, options] as const,
        ),
      ),
    close: () => browser.close(),
  };
}
