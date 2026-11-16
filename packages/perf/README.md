# @repo/perf

Internal bundle-size and speed reports for every QRCodeSDK feature. The reports describe
QRCodeSDK only; they do not compare it with other libraries.

Run the tasks from the workspace root. Turbo builds the packages first:

```sh
pnpm turbo run report:size --filter=@repo/perf
pnpm turbo run check:size --filter=@repo/perf
pnpm turbo run report:speed --filter=@repo/perf
pnpm turbo run report:speed:browser --filter=@repo/perf
```

Pass options after `--`, for example
`pnpm turbo run report:speed --filter=@repo/perf -- --only=matrix/ --quick`.

The reports are written to `reports/` (ignored). The committed baselines live in `baseline/`.
The docs show both at `/devtools/size` and `/devtools/speed`: a local report when one exists,
compared with the baseline, and otherwise the baseline alone.

## Size report

`src/size/scenarios.ts` lists about 60 small apps. Each one imports and uses one combination of
features, such as "SVG with rounded modules", "lazy Micro QR and rMQR", or "Vue with all
components". Every app reads its payload at runtime, so bundlers cannot fold the work away.

- **Vite** builds every scenario as a production app (`index.html` and `main.js`). Its numbers are
  the ones the report and the budget use.
- **Source-map attribution.** The QRCodeSDK builds ship source maps, which the build chains. Each
  minified byte is attributed to its original source file and to a code area from `src/areas.ts`,
  such as `core:micro` or `browser:png`. Third-party code is attributed per package.
- **Feature cost** is the gzip difference to the scenario's `baseline`, for example `micro` over
  `matrix`.
- **Code splitting.** Initial chunks are the entry and its static imports. Everything else is lazy.
  The report lists every chunk and the source files that end up in more than one chunk.
- **Inclusion check.** Optional code areas, such as an encoder, must only appear in scenarios that
  list them in `expect`. Any other appearance is a problem that fails the run.
- **esbuild and webpack** build the same apps without attribution. When a feature costs much more
  with one of them than with Vite, the report shows a warning; that usually means it cannot tree
  shake something.
- **Frameworks.** React and Vue apps use `createElement` and `h`, so they need no compiler plugin.
  Svelte uses `@sveltejs/vite-plugin-svelte`. Angular runs every dependency through the Angular
  CLI's JavaScript transformer, which links partially compiled libraries and applies the
  optimizations of `ng build`. Svelte and Angular build with Vite only.
- **Published packages.** `npm pack --dry-run` measures the install size of every package.

Sizes are minified, gzip at level 6, and Brotli at quality 11.

### Budget

`check:size` builds the scenarios with Vite and compares each total gzip size with
`baseline/size.json`. It fails when a scenario grows by more than 1% (at least 64 bytes), has an
inclusion problem, or is missing from the baseline. This is an optional local check. CI does not
enforce size budgets.

To accept a change, regenerate the baseline with every bundler and commit it:

```sh
pnpm turbo run report:size --filter=@repo/perf -- --update-baseline
```

Dependency updates of a bundler or framework can change sizes too. Update the local baseline when
you want the docs and local checks to use those new sizes.

### PR reports

Every PR gets one bot comment comparing its size report with `baseline/size.json` committed on `main`.
The report includes all scenarios and supported bundlers, Vite initial and lazy gzip sizes, and
packed and unpacked package sizes. Changed measurements appear first; unchanged measurements are
collapsed. New and removed scenarios and measurement problems are explicit. Full JSON reports are
attached to the measurement run for 14 days. Size changes are informational.

- `.github/workflows/size-baseline.yml` measures current `main` daily at 03:23 UTC, or manually on
  `main`. A separate job validates the source commit and commits only `baseline/size.json` through
  the GitHub Contents API. The build job has read-only permissions; the write job installs no
  packages and runs no build commands. Branch protection must permit the bot to update the file.
  If `main` moves during measurement, the workflow fails and can be rerun. No force push or branch
  protection bypass is attempted. Failed or delayed schedules leave the previous baseline intact.
- `.github/workflows/size.yml` uses ordinary `pull_request` events, so GitHub's fork approval rules
  apply. It builds the PR merged onto its target branch and uploads one size report. It does not
  rebuild `main`. Repository and cache permissions are read-only, with no supplied secrets.
- `.github/workflows/size-report.yml` runs trusted code and reads the baseline from `main`. It marks
  old results as outdated when a measurement starts and updates the same comment on completion.
  It associates runs with PRs using GitHub API repository, branch, and commit identities, validates
  artifact names and sizes before download, and parses reports as data. It never executes PR code
  or installs dependencies. PRs cannot replace the baseline by changing their own baseline file.
- The measurement environment is Ubuntu 24.04 and Node.js 26.13.1 for both daily and PR builds.
  Comments include the baseline's source commit and date so its age is visible. Baseline updates
  do not automatically rerun open PRs; the next PR measurement uses the new committed baseline.
- Old runs and attempts cannot replace newer comments. Superseded measurement runs are cancelled.
  Build failures, missing reports, and invalid baselines receive an explanatory comment. Merge
  conflicts can prevent GitHub from starting the normal PR workflow until resolved.

The workflows must first land on `main` to enable scheduled baseline updates and trusted publishing.
The bot uses `GITHUB_TOKEN`; its baseline commits do not trigger another push workflow. Existing
PRs receive reports on their next run. No speed baseline or speed report is updated in CI.

## Speed report

`src/speed/workloads/` holds the workload groups. They cover matrix generation per version, each
encoder stage, every mode and the segmenter, Micro QR and rMQR, the payload helpers, styler setup
and drawing, the SVG and text renderers, the Node.js raster renderers and encoders, Canvas and the
image renderers in the browser, and the docs explanation with its encoding trace.

- Vite bundles each group, so the measured code is what an app runs. Node.js bundles are not
  minified; browser bundles are.
- Each workload runs in its own Node.js process (`--expose-gc`) or a new Chromium page, so
  workloads cannot affect each other. Chromium pages are served cross-origin isolated, which gives
  `performance.now()` its finest resolution.
- `src/speed/sampler.ts` calibrates a batch size that takes at least 10 ms, warms up for 300 ms,
  then collects samples for at least 1 s. The report lists the median, p75, p99, minimum, maximum,
  operations per second, and the relative margin of error (RME) of the mean at 95% confidence.
- `--quick` samples much shorter. Use it to check that workloads run, not to measure them.
- `--only=<prefix>,<prefix>` runs workloads whose ids start with a prefix and merges them into the
  previous local report.

### Comparing speed

Timings depend on the machine, so the report only compares with the baseline when the CPU, OS,
Node.js, and Chromium versions all match. A change counts as faster or slower when the median moves
by more than 5% and more than both margins of error.

To compare with another commit on any machine, measure both builds in the same run:

```sh
pnpm turbo run report:speed --filter=@repo/perf -- --against=main
```

This checks out the ref in a worktree under `.cache/against/`, installs its dependencies, builds
`@qrcodesdk/core`, `@qrcodesdk/browser`, and `@qrcodesdk/node`, and bundles the same workloads
against it. The two builds alternate over three rounds (`--rounds=<n>`), which spreads drift such
as thermal throttling over both. Workload groups that do not build against the ref are skipped for
the comparison.

To update the baseline after a full run without other tasks competing for CPU time:

```sh
pnpm turbo run report:speed --filter=@repo/perf -- --update-baseline
pnpm turbo run report:speed:browser --filter=@repo/perf -- --update-baseline
```

Speed reports run only on developer machines. No speed measurements or comparisons run in CI.

## Adding a feature

1. Add the feature to `FEATURES` and its source files to `CODE_AREAS` in `src/areas.ts`. Mark the
   area `optional` when apps that do not use the feature must not bundle it.
2. Add a size scenario with the feature's `baseline` scenario and `expect` the new area.
3. Add speed workloads to a group in `src/speed/workloads/`, or a new group in `index.ts`.
4. Update both baselines.

## Notes

- `tsconfig.json` leaves `es2022.error` out of `lib`: the core source targets ES2020, and under the
  ES2022 `Error` type, `noImplicitOverride` rejects `QRCodeError.cause`. The matrix stage workloads
  import that source.
- `src/speed/workloads/explain.ts` imports the docs explanation by path. The docs type-check it, so
  it is excluded here.
- `src/report-types.ts`, `src/speed/statistics.ts`, and `src/size/budget.ts` are also imported by
  the docs. Keep their imports type-only and without file extensions.
