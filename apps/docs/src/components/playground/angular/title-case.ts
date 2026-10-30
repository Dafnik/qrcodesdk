/** Format a lowercase, dash-separated option value (for example `extra-rounded`) as a label. */
export function titleCase(value: unknown): string {
  return String(value)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
