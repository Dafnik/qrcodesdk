import {type CliPlaygroundOptions, defaultCliOptions} from './cli-playground.ts';

const fields = {
  payload: 'payload',
  launcher: 'launcher',
  format: 'format',
  'output-path': 'outputPath',
  'module-size': 'moduleSize',
  'quiet-zone': 'quietZone',
  layout: 'layout',
  ansi: 'ansi',
  foreground: 'foreground',
  background: 'background',
  'aria-label': 'ariaLabel',
  title: 'title',
  mode: 'mode',
  level: 'errorCorrectionLevel',
  version: 'version',
  mask: 'mask',
  eci: 'eci',
} as const satisfies Record<string, keyof CliPlaygroundOptions>;

const enums = {
  launcher: ['npm', 'installed', 'pnpm', 'viteplus', 'bun', 'yarn'],
  format: ['text', 'svg'],
  layout: ['compact', 'full'],
  ansi: ['off', 'blocks', 'background'],
  mode: ['numeric', 'alphanumeric', 'octet'],
  errorCorrectionLevel: ['L', 'M', 'Q', 'H'],
} as const;

export function readCliOptionsFromSearchParams(params: URLSearchParams): CliPlaygroundOptions {
  const options = {...defaultCliOptions};
  for (const [queryKey, field] of Object.entries(fields)) {
    const raw = params.get(`cli-${queryKey}`);
    if (raw === null || raw.includes('\0')) continue;
    if (field in enums) {
      const allowed: readonly string[] = enums[field as keyof typeof enums];
      if (allowed.includes(raw)) Object.assign(options, {[field]: raw});
    } else if (field === 'eci') {
      if (raw === 'true' || raw === 'false') options.eci = raw === 'true';
    } else if (['moduleSize', 'quietZone', 'version', 'mask'].includes(field)) {
      const number = Number(raw);
      const minimum = field === 'mask' || field === 'quietZone' ? 0 : 1;
      const maximum = field === 'version' ? 40 : field === 'mask' ? 7 : Number.MAX_SAFE_INTEGER;
      if (
        /^\d+$/.test(raw) &&
        Number.isSafeInteger(number) &&
        number >= minimum &&
        number <= maximum
      )
        Object.assign(options, {[field]: number});
    } else if (field === 'foreground' || field === 'background') {
      if (/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(raw)) Object.assign(options, {[field]: raw});
    } else {
      Object.assign(options, {[field]: raw});
    }
  }
  return options;
}

export function writeCliOptionsToSearchParams(
  params: URLSearchParams,
  options: CliPlaygroundOptions,
  omitDefaults = true,
): void {
  for (const [queryKey, field] of Object.entries(fields)) {
    const value = options[field];
    if (value === undefined || (omitDefaults && value === defaultCliOptions[field]))
      params.delete(`cli-${queryKey}`);
    else params.set(`cli-${queryKey}`, String(value));
  }
}
