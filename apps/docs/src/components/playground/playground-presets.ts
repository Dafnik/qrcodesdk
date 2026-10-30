import type {QRCodeColor, QRCodeVisualStyle} from '@qrcodesdk/core';

import {cliPlaygroundOptions} from './cli-playground.ts';
import {
  type PlaygroundOptions,
  playgroundOptions,
  setPlaygroundSectionOpen,
} from './playground-options.ts';

export type PlaygroundPresetGroup = 'style' | 'app';

export interface PlaygroundPreset {
  id: string;
  label: string;
  group: PlaygroundPresetGroup;
  foreground?: QRCodeColor;
  background?: QRCodeColor;
  modules?: QRCodeVisualStyle['modules'];
  finder?: QRCodeVisualStyle['finder'];
}

const DEFAULT_FOREGROUND: QRCodeColor = '#000000';
const DEFAULT_BACKGROUND: QRCodeColor = '#FFFFFF';

/**
 * Visual presets for the playground. App presets are inspired by the brand palettes but use darker
 * shades where needed so the QR code keeps enough contrast to scan reliably.
 */
export const playgroundPresets: readonly PlaygroundPreset[] = [
  {id: 'classic', label: 'Classic', group: 'style'},
  {
    id: 'rounded',
    label: 'Rounded',
    group: 'style',
    modules: {shape: 'rounded'},
    finder: {outer: {shape: 'rounded'}, center: {shape: 'rounded'}},
  },
  {
    id: 'dots',
    label: 'Dots',
    group: 'style',
    modules: {shape: 'circle'},
    finder: {outer: {shape: 'circle'}, center: {shape: 'circle'}},
  },
  {
    id: 'ocean',
    label: 'Ocean',
    group: 'style',
    foreground: '#0B3C5D',
    background: '#F2F8FC',
    modules: {shape: 'diagonal-rounded'},
    finder: {
      outer: {shape: 'extra-rounded', color: '#1D6A96'},
      center: {shape: 'rounded'},
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    group: 'style',
    foreground: '#1B4332',
    background: '#F1F8F4',
    modules: {shape: 'extra-rounded'},
    finder: {
      outer: {shape: 'extra-rounded', color: '#2D6A4F'},
      center: {shape: 'extra-rounded'},
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    group: 'style',
    foreground: '#7C2D12',
    background: '#FFF7ED',
    modules: {shape: 'rounded'},
    finder: {
      outer: {shape: 'rounded', color: '#C2410C'},
      center: {shape: 'circle'},
    },
  },
  {
    id: 'grape',
    label: 'Grape',
    group: 'style',
    foreground: '#4C1D95',
    background: '#F5F3FF',
    modules: {shape: 'diagonal'},
    finder: {
      outer: {shape: 'square', color: '#6D28D9'},
      center: {shape: 'square'},
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    group: 'app',
    foreground: '#075E54',
    background: '#FFFFFF',
    modules: {shape: 'rounded'},
    finder: {
      outer: {shape: 'extra-rounded', color: '#128C7E'},
      center: {shape: 'extra-rounded'},
    },
  },
  {
    id: 'telegram',
    label: 'Telegram',
    group: 'app',
    foreground: '#1C5D8C',
    background: '#FFFFFF',
    modules: {shape: 'circle'},
    finder: {
      outer: {shape: 'extra-rounded', color: '#1E88C8'},
      center: {shape: 'circle'},
    },
  },
  {
    id: 'signal',
    label: 'Signal',
    group: 'app',
    foreground: '#2C5CC5',
    background: '#FFFFFF',
    modules: {shape: 'extra-rounded'},
    finder: {
      outer: {shape: 'rounded', color: '#3A76F0'},
      center: {shape: 'rounded'},
    },
  },
];

/** Presets that only differ in shape collapse to one entry for the CLI, which only supports colors. */
export const cliPlaygroundPresets: readonly PlaygroundPreset[] = playgroundPresets.filter(
  (preset, index) =>
    playgroundPresets.findIndex((other) => colorsKey(other) === colorsKey(preset)) === index,
);

/**
 * Apply a preset's colors and shapes while keeping the payload, matrix, and output settings, and
 * open the advanced styling section so the applied shapes are visible.
 */
export function applyQrPreset(id: string): void {
  const preset = playgroundPresets.find((candidate) => candidate.id === id);
  if (!preset) return;

  playgroundOptions.set({
    ...playgroundOptions.get(),
    foreground: preset.foreground,
    background: preset.background,
    modules: preset.modules,
    finder: preset.finder,
  });
  setPlaygroundSectionOpen('styling', true);
}

/** Apply a preset's colors to the CLI, which has no module or finder shape options. */
export function applyCliPreset(id: string): void {
  const preset = cliPlaygroundPresets.find((candidate) => candidate.id === id);
  if (!preset) return;

  cliPlaygroundOptions.set({
    ...cliPlaygroundOptions.get(),
    foreground: preset.foreground,
    background: preset.background,
  });
}

/** Pick a random preset that differs from the current one, so every pick visibly changes the code. */
export function pickRandomPreset(
  presets: readonly PlaygroundPreset[],
  currentId: string | undefined,
  random: () => number = Math.random,
): PlaygroundPreset | undefined {
  const candidates = presets.filter(({id}) => id !== currentId);
  return candidates[Math.floor(random() * candidates.length)];
}

/** Find the preset that matches the current framework style, if any. */
export function findQrPreset(options: PlaygroundOptions): PlaygroundPreset | undefined {
  return playgroundPresets.find(
    (preset) =>
      colorsKey(preset) === colorsKey(options) && shapesKey(preset) === shapesKey(options),
  );
}

/** Find the preset that matches the current CLI colors, if any. */
export function findCliPreset(
  options: Pick<PlaygroundPreset, 'foreground' | 'background'>,
): PlaygroundPreset | undefined {
  return cliPlaygroundPresets.find((preset) => colorsKey(preset) === colorsKey(options));
}

function colorsKey({foreground, background}: Pick<PlaygroundPreset, 'foreground' | 'background'>) {
  return [foreground ?? DEFAULT_FOREGROUND, background ?? DEFAULT_BACKGROUND]
    .map((color) => color.toUpperCase())
    .join('|');
}

function shapesKey({modules, finder}: Pick<PlaygroundPreset, 'modules' | 'finder'>) {
  return JSON.stringify([
    modules?.shape,
    modules?.color?.toUpperCase(),
    finder?.outer?.shape,
    finder?.outer?.color?.toUpperCase(),
    finder?.center?.shape,
    finder?.center?.color?.toUpperCase(),
  ]);
}
