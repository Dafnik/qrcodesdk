import type {QRCodeColor} from '@qrcodesdk/core';

import {cliPlaygroundOptions} from './cli-playground.ts';
import {
  type PlaygroundOptions,
  playgroundOptions,
  setPlaygroundSectionOpen,
} from './playground-options.ts';
import type {PlaygroundShape, PlaygroundStyleState} from './playground-style.ts';

export type PlaygroundPresetGroup = 'style' | 'app';

export interface PlaygroundPreset extends PlaygroundStyleState {
  id: string;
  label: string;
  group: PlaygroundPresetGroup;
  foreground?: QRCodeColor;
  background?: QRCodeColor;
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
    moduleShape: 'rounded',
    finderRingShape: 'rounded',
    finderCenterShape: 'rounded',
    alignmentRingShape: 'rounded',
    alignmentCenterShape: 'rounded',
  },
  {
    id: 'dots',
    label: 'Dots',
    group: 'style',
    moduleShape: 'circle',
    finderRingShape: 'circle',
    finderCenterShape: 'circle',
    alignmentRingShape: 'circle',
    alignmentCenterShape: 'circle',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    group: 'style',
    foreground: '#0B3C5D',
    background: '#F2F8FC',
    moduleShape: 'diagonal-rounded',
    finderRingShape: 'extra-rounded',
    finderCenterShape: 'rounded',
    finderColor: '#1D6A96',
  },
  {
    id: 'forest',
    label: 'Forest',
    group: 'style',
    foreground: '#1B4332',
    background: '#F1F8F4',
    moduleShape: 'extra-rounded',
    finderRingShape: 'extra-rounded',
    finderCenterShape: 'extra-rounded',
    finderColor: '#2D6A4F',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    group: 'style',
    foreground: '#7C2D12',
    background: '#FFF7ED',
    moduleShape: 'rounded',
    finderRingShape: 'rounded',
    finderCenterShape: 'circle',
    finderColor: '#C2410C',
  },
  {
    id: 'grape',
    label: 'Grape',
    group: 'style',
    foreground: '#4C1D95',
    background: '#F5F3FF',
    moduleShape: 'diagonal',
    finderColor: '#6D28D9',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    group: 'app',
    foreground: '#075E54',
    background: '#FFFFFF',
    moduleShape: 'rounded',
    finderRingShape: 'extra-rounded',
    finderCenterShape: 'extra-rounded',
    finderColor: '#128C7E',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    group: 'app',
    foreground: '#1C5D8C',
    background: '#FFFFFF',
    moduleShape: 'circle',
    finderRingShape: 'extra-rounded',
    finderCenterShape: 'circle',
    finderColor: '#1E88C8',
  },
  {
    id: 'signal',
    label: 'Signal',
    group: 'app',
    foreground: '#2C5CC5',
    background: '#FFFFFF',
    moduleShape: 'extra-rounded',
    finderRingShape: 'rounded',
    finderCenterShape: 'rounded',
    finderColor: '#3A76F0',
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
    moduleShape: preset.moduleShape,
    finderRingShape: preset.finderRingShape,
    finderCenterShape: preset.finderCenterShape,
    finderColor: preset.finderColor,
    alignmentRingShape: preset.alignmentRingShape,
    alignmentCenterShape: preset.alignmentCenterShape,
    alignmentColor: preset.alignmentColor,
  });
  setPlaygroundSectionOpen('styling', true);
}

/** Apply a preset's colors to the CLI, which has no module, finder, or alignment shape options. */
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

function shapesKey(style: PlaygroundStyleState) {
  const shape = (value: PlaygroundShape | undefined) => (value === 'square' ? undefined : value);
  // Square alignment shapes stay distinct from unset ones, which take the module shape.
  return JSON.stringify([
    shape(style.moduleShape),
    shape(style.finderRingShape),
    shape(style.finderCenterShape),
    style.finderColor?.toUpperCase(),
    style.alignmentRingShape,
    style.alignmentCenterShape,
    style.alignmentColor?.toUpperCase(),
  ]);
}
