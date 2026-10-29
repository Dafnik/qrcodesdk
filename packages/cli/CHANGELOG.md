# @qrcodesdk/cli

## 0.0.4

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/core@0.0.4
  - @qrcodesdk/node@0.0.4

## 0.0.3

### Patch Changes

- Removed the `commander` and `@clack/prompts` dependencies in favor of `node:util` argument parsing and built-in prompts, which makes the CLI start faster.

  - `--eci` is now a flag: use `--eci` or `--no-eci` instead of `--eci true` / `--eci false`.
  - Option values that start with `-` must use the `--option=value` form.
  - Choose the output format in the interactive prompt with the arrow keys, `j`/`k`, or a number key. Press Escape or Ctrl+C to cancel.

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @qrcodesdk/core@0.0.3
  - @qrcodesdk/node@0.0.3

## 0.0.2

### Patch Changes

- 210c615: Replace the renderer and styling APIs with the new `matrix`, `style`, `accessibility`, and `image` option groups. Rename visual styling types, renderer image options, and CLI flags to match the new vocabulary. Add `@qrcodesdk/core/payload` for payload helpers, expose them from the core entry point, and improve rendering performance across SVG, canvas, and PNG output.
- 358292a: Generate smaller QR codes for mixed input by automatically splitting data into optimized numeric, alphanumeric, and byte segments. Add optional UTF-8 ECI encoding through the core options, builder API, and the CLI's `--eci` flag.
- 358292a: Refresh generated package READMEs with clearer setup, renderer, customization, download, and runtime guidance. Expand the Angular peer range to support Angular 20 through 22.
- 358292a: Reject contradictory ANSI color flags and use Node's built-in terminal styling for CLI status and error messages, removing the runtime dependency on Chalk.
- Updated dependencies [358292a]
  - @qrcodesdk/core@0.0.2
  - @qrcodesdk/node@0.0.2

## 0.0.1

### Patch Changes

- Initial release
- Updated dependencies
  - @qrcodesdk/core@0.0.1
  - @qrcodesdk/node@0.0.1
