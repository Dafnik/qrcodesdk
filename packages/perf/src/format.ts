export function formatBytes(bytes: number): string {
  const sign = bytes < 0 ? '-' : '';
  const value = Math.abs(bytes);
  if (value < 1024) return `${sign}${value} B`;
  return `${sign}${(value / 1024).toFixed(2)} kB`;
}

export function formatDelta(bytes: number): string {
  if (bytes === 0) return '±0 B';
  return `${bytes > 0 ? '+' : ''}${formatBytes(bytes)}`;
}

/** Formats nanoseconds with a unit that keeps three significant digits. */
export function formatDuration(nanoseconds: number): string {
  if (nanoseconds < 1_000) return `${nanoseconds.toPrecision(3)} ns`;
  if (nanoseconds < 1_000_000) return `${(nanoseconds / 1_000).toPrecision(3)} µs`;
  if (nanoseconds < 1_000_000_000) return `${(nanoseconds / 1_000_000).toPrecision(3)} ms`;
  return `${(nanoseconds / 1_000_000_000).toPrecision(3)} s`;
}

export function formatPercent(ratio: number): string {
  return `${ratio > 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`;
}

export function printTable(header: readonly string[], rows: readonly (readonly string[])[]): void {
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row[column]?.length ?? 0)),
  );
  const line = (cells: readonly string[]) =>
    cells
      .map((cell, column) =>
        column === 0 ? cell.padEnd(widths[column]!) : cell.padStart(widths[column]!),
      )
      .join('  ');
  console.log(line(header));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) console.log(line(row));
}

/**
 * Pretty-prints a report but keeps flat objects, such as one module's size, on a single line.
 * The committed baselines stay readable in diffs without growing to tens of thousands of lines.
 */
export function stringifyReport(value: unknown): string {
  return `${JSON.stringify(value, null, 2).replace(
    /\{\n\s+([^{}[\]]*?)\n\s+\}/g,
    (_match, body: string) => `{${body.split(/,\n\s+/).join(', ')}}`,
  )}\n`;
}
