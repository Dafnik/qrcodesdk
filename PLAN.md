# CLI playground in the docs

## Goal and agreed behavior

Add a CLI choice beside React, Vue, Svelte, and Angular in the playground's existing package selector. Selecting CLI shows a terminal command builder and a live QR code preview.

- Make the command launcher selectable. Default to `npx @qrcodesdk/cli`.
- Support text and SVG output. Exclude PNG from the CLI playground because its renderer requires Node APIs.
- Render SVG with Angular's `QRCodeSVG` component.
- Render text inside a terminal-style panel, with the actual block characters, spacing, and ANSI colors produced by the text renderer.
- Generate commands for users to copy and run locally. Generate previews in the browser without executing commands.

This plan covers the docs feature. The CLI continues to support PNG locally.

## Repository findings

- `apps/docs/src/components/astro/qrcode-playground.astro` arranges controls, framework previews, and generated code in two columns.
- `angular/playground-controls.ts` owns the four-choice package selector. Its fixed grid and selection indicator need to support a fifth choice and narrow screens.
- `playground-options.ts` holds framework options in Nanostores. Framework defaults are module size `8` and quiet zone `4`.
- `query-sync.ts` synchronizes framework settings with the URL and handles Back/Forward navigation.
- `packages/cli/src/run-cli.ts` defines the current flags and resolution rules. CLI defaults are text output, compact layout, module size `1`, quiet zone `2`, and ECI disabled.
- ANSI defaults depend on stdout being a TTY and `NO_COLOR` being absent. Explicit `--ansi` overrides that behavior.
- `--ansi background` cannot be combined with `--layout`. Text cannot use `--output`; SVG requires it.
- `@qrcodesdk/core` exports browser-compatible `qrcode`, `QRCodeTextRenderer`, and `QRCodeSVGRenderer` APIs. The CLI runner imports filesystem, process, and PNG APIs and cannot enter the browser bundle.
- The docs use Angular 22, signals, Nanostores, existing Helm controls, and Node's test runner for playground helpers.

Use the current CLI source and tests as the flag contract.

## Controls and command builder

Keep the existing two-column layout. In CLI mode, show dedicated controls on the left, a preview on the right, and the generated command in the shared code panel with its existing Copy button below the preview.

Launcher choices are `npx @qrcodesdk/cli`, installed `qrc`, `pnpm dlx @qrcodesdk/cli`, `vp dlx @qrcodesdk/cli`, `bunx @qrcodesdk/cli`, and `yarn dlx @qrcodesdk/cli`. Reuse the docs package-manager command utility where applicable. Its arguments must already be shell-quoted.

| Control | Behavior |
| --- | --- |
| Payload | Default to `https://qrcodesdk.dev`. Preserve the exact text, including Unicode and newlines. |
| Format | Text by default; SVG as the other choice. |
| Output path | SVG only, default `qrcode.svg`. Include `--format svg` and `--output` explicitly. |
| Matrix options | Mode, error correction, version, mask, and UTF-8 ECI. Match the current CLI values and automatic selection rules. |
| Module size / quiet zone | Start at `1` / `2`. Validate positive / non-negative safe integers. |
| Text layout | Compact or full. Hide or disable it for ANSI background mode and omit `--layout` in that mode. |
| ANSI | Blocks by default, plus off and background. Omit the default `--ansi blocks` flag. The command follows the CLI's TTY and `NO_COLOR` detection; the browser preview assumes a color-enabled terminal. |
| Colors | Reuse the framework color picker and presets, emitting RGB/RGBA hex values supported by the CLI. For text, disable color controls when ANSI is off and omit the unused flags. |
| SVG accessibility | Optional title and aria-label. Omit these flags for text. |
| Reset | Restore CLI defaults while keeping CLI selected. |

Do not show component-only controls such as center images, module/finder shapes, canvas output, or PNG downloads in CLI mode. Retain those settings when the user returns to a framework.

Build the command and renderer options from one validated CLI configuration. Use a pure command generator with stable flag ordering. Keep required payload and SVG output arguments. Omit flags whose values match CLI defaults, automatic matrix options, and flags irrelevant to the selected format. Use the same command in the shared code panel and terminal prompt.

Use `--payload` rather than a positional value so payloads starting with a hyphen remain valid. Quote string arguments for POSIX shells, including apostrophes, whitespace, `$`, backticks, and shell metacharacters. Reject NUL characters because shell arguments cannot represent them. The initial version labels commands for POSIX shells; PowerShell and cmd quoting are outside this scope.

Examples of the default command and an SVG command:

```sh
npx @qrcodesdk/cli --payload 'https://qrcodesdk.dev'
npx @qrcodesdk/cli --payload 'https://qrcodesdk.dev' --format svg --output 'qrcode.svg'
```

The Copy button copies only the command, without a prompt character or preview output. Show success only after a successful clipboard write, and show a useful failure message if copying is unavailable.

## Preview behavior

### SVG

Pass the CLI payload, matrix options, visual options, and accessibility options to Angular's `<qrcode-svg>`. Use CLI defaults rather than `createPlaygroundSVGOptions`, which can attach framework center images.

The native SVG dimensions must match the CLI output. Enlarge the small default SVG visually with CSS so it is easy to inspect, without changing module size or generated-file dimensions. Label this as a browser preview. The output path belongs to the copied command and does not write a local file from the page.

Validate generation before mounting the SVG component so invalid payload/options produce an inline error instead of an Angular rendering failure.

### Text terminal

Generate text with `qrcode(payload).options(matrixOptions).render(QRCodeTextRenderer(...))`, using the same resolved options as the command. Preserve the CLI's final newline too.

Use one rounded terminal window with a subtle border and `#0d1117` background. Its header has three decorative macOS dots and a centered terminal title. Show the command with a green arrow and blue working directory, the generated output below it, and a new prompt with a blinking block cursor. Respect reduced-motion preferences. Keep this a read-only preview. A terminal emulator and an editable shell are unnecessary.

- Preserve every space, trailing space, and newline with preformatted output. Disable wrapping, ligatures, and letter spacing. Use a monospace font that supports `█`, `▀`, and `▄`.
- Choose font metrics and line height that join adjacent cells without gaps. Compact output uses half-block glyphs; full output uses double-width blocks; ANSI background output uses colored double spaces.
- Parse only the SGR sequences emitted by `QRCodeTextRenderer`: true-color foreground, true-color background, and reset. Convert them to styled text runs, preserving spaces even when they are the only content.
- Bind runs as text and style properties in Angular. Do not inject generated output as HTML or expose escape sequences as visible characters.
- Use the colors resolved by the core renderer, including RGBA compositing. Do not recreate color resolution separately in the docs.
- ANSI off uses the terminal's default foreground/background. Explain that it ignores configured QR colors. ANSI blocks and background use the renderer's explicit colors.
- Allow horizontal scrolling for wide output. Bound the preview height and allow vertical scrolling for large QR codes. Keep the surrounding page within the viewport.
- Keep decorative terminal chrome out of the accessibility tree. Give the output an accessible label and keep errors readable without announcing the entire QR character grid after every edit.

Errors replace the previous successful output so a stale QR code cannot appear to match the current command. Disable copying a command when its configuration is invalid. Use a short debounced update if generation affects typing responsiveness, and discard stale results.

## State and integration

Keep CLI options separate from framework options so switching packages preserves both configurations and does not transfer framework defaults or styling into the command.

1. Extend the package selection to include `cli`. Keep framework output types and framework code generation restricted to the four framework packages.
2. Extract the package selector into a shared control, or keep it above the conditional controls inside `PlaygroundControls`. Make its five choices responsive and retain keyboard selection and visible focus.
3. Add a CLI Nanostore with dedicated defaults, updates, and reset. Follow the existing signal/Nanostores integration and form conventions.
4. Show CLI controls and preview/command components only in CLI mode. Guard framework code generation so it never receives CLI as a framework. Avoid QR generation work for inactive previews.
5. Refactor `QrMatrixControls` to accept options, update callbacks, defaults, and an ID prefix if reusing it. It currently reads and writes the framework store directly, with framework placeholders and fixed IDs.
6. Extend URL synchronization to support `package=cli` and validated `cli-*` parameters for the CLI configuration. Keep existing framework URLs working. Preserve unrelated query parameters and use one coordinator for initial restoration, debounced writes, and Back/Forward handling.
7. Preserve both configurations when switching packages. A CLI URL round-trip must restore the format, launcher, payload, matrix/style settings, output path, and applicable text/SVG settings.

Keep helpers in the docs package. Do not add dependencies on `@qrcodesdk/cli` or `@qrcodesdk/node` to browser code. No new dependency is expected for ANSI display. If a dependency becomes necessary and only docs uses it, add it only to the docs package. Any new library exports used solely between SDK packages must use the `ɵ` prefix. Do not create a changeset.

## Implementation sequence

1. Add CLI state, validation, pure command generation, renderer-option mapping, and ANSI text-run parsing under `apps/docs/src/components/playground/`.
2. Add focused helper tests for the CLI contract, shell quoting, state reset, and ANSI output.
3. Extend the package selector and add Angular CLI controls, the command panel, SVG preview, and terminal text preview.
4. Integrate conditional controls/previews and URL synchronization. Add `sh` highlighting to the existing highlighter if the command panel uses it.
5. Update the playground page description/introduction to mention CLI commands and terminal output. Add a link from the CLI package page to the playground in CLI mode.
6. Run the checks below. Leave browser inspection to the user, who requested no computer or Playwright usage for this feature.

## Validation and completion criteria

Test meaningful behavior in the existing playground test suite:

- Default command and every launcher; switching text/SVG; deterministic flags and required SVG output.
- Quotes, newlines, Unicode, shell metacharacters, and payloads starting with `-` survive command serialization as literal argument values.
- Invalid version, mask, module size, quiet zone, color, output path, and incompatible matrix/payload settings produce useful errors.
- ANSI background never includes layout; text never includes output paths or SVG metadata; no CLI command offers PNG.
- Renderer options match the current CLI rules. Compare text results with the core renderer, including its trailing newline, and check SVG options against the CLI's renderer mapping.
- ANSI parsing preserves glyphs, spaces, newlines, foreground/background transitions, RGBA-resolved colors, and resets. Escape sequences do not appear in the display.
- CLI reset and package switching preserve the intended settings. URL round-trips, malformed parameters, existing framework URLs, and Back/Forward navigation work.

Run from the workspace root through Turbo:

```sh
pnpm turbo run test --filter=docs --filter=@qrcodesdk/cli
pnpm turbo run check-types --filter=docs
pnpm turbo run lint --filter=docs
pnpm turbo run build --filter=docs
pnpm turbo run format:check cspell
pnpm turbo run start --filter=docs
```

Compare representative copied commands with real CLI output through the workspace's Turbo docs test task, including color-enabled terminals, non-TTY output, and `NO_COLOR`. Automated browser validation is excluded at the user's request.

The feature is complete when a user can select CLI, configure text or SVG, choose a launcher, copy a runnable command, and see the corresponding QR code without Node APIs entering the browser bundle.
