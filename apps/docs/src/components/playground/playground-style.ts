import type {QRCodeColor, QRCodeVisualStyle} from '@qrcodesdk/core';
import {
  type QRCodeShape,
  alignment,
  circle,
  diagonal,
  finder,
  rounded,
} from '@qrcodesdk/core/style';

/** Serializable shape names kept in playground state, URLs, and presets. */
export const PLAYGROUND_SHAPES = [
  'square',
  'rounded',
  'extra-rounded',
  'diagonal',
  'diagonal-rounded',
  'circle',
] as const;
export type PlaygroundShape = (typeof PLAYGROUND_SHAPES)[number];

export interface PlaygroundStyleState {
  moduleShape?: PlaygroundShape;
  finderRingShape?: PlaygroundShape;
  finderCenterShape?: PlaygroundShape;
  finderColor?: QRCodeColor;
  alignmentRingShape?: PlaygroundShape;
  alignmentCenterShape?: PlaygroundShape;
  alignmentColor?: QRCodeColor;
}

export type PlaygroundStyleFactory = 'alignment' | 'circle' | 'diagonal' | 'finder' | 'rounded';

type PatternPart = 'finder' | 'alignment';

interface PatternState {
  readonly ring: PlaygroundShape | undefined;
  readonly center: PlaygroundShape | undefined;
  readonly color: QRCodeColor | undefined;
}

const PATTERN_FACTORIES = {finder, alignment} as const;

type ShapeCall =
  | {readonly factory: 'rounded' | 'diagonal'; readonly radius?: number}
  | {readonly factory: 'circle'};

/** Square is the unstyled default, so it has no factory call. */
const SHAPE_CALLS: Record<Exclude<PlaygroundShape, 'square'>, ShapeCall> = {
  rounded: {factory: 'rounded'},
  'extra-rounded': {factory: 'rounded', radius: 1},
  diagonal: {factory: 'diagonal'},
  'diagonal-rounded': {factory: 'diagonal', radius: 1},
  circle: {factory: 'circle'},
};

const shapeCache = new Map<PlaygroundShape, QRCodeShape>();

function shapeCall(shape: PlaygroundShape | undefined): ShapeCall | undefined {
  return shape === undefined || shape === 'square' ? undefined : SHAPE_CALLS[shape];
}

function createShape(shape: PlaygroundShape | undefined): QRCodeShape | undefined {
  const call = shapeCall(shape);
  if (!call || shape === undefined) return undefined;

  let created = shapeCache.get(shape);
  if (!created) {
    const options =
      'radius' in call && call.radius !== undefined ? {radius: call.radius} : undefined;
    created =
      call.factory === 'circle'
        ? circle()
        : call.factory === 'rounded'
          ? rounded(options)
          : diagonal(options);
    shapeCache.set(shape, created);
  }
  return created;
}

function formatShape(shape: PlaygroundShape | undefined, used: Set<PlaygroundStyleFactory>) {
  const call = shapeCall(shape);
  if (!call) return undefined;

  used.add(call.factory);
  return 'radius' in call && call.radius !== undefined
    ? `${call.factory}({radius: ${call.radius}})`
    : `${call.factory}()`;
}

function patternState(state: PlaygroundStyleState, part: PatternPart): PatternState {
  return part === 'finder'
    ? {ring: state.finderRingShape, center: state.finderCenterShape, color: state.finderColor}
    : {
        ring: state.alignmentRingShape,
        center: state.alignmentCenterShape,
        color: state.alignmentColor,
      };
}

/**
 * Whether a pattern needs its own style part. Finders default to squares, so a square finder needs
 * no part. Alignment patterns default to the module shape, so any chosen shape, square included,
 * needs one.
 */
function hasPatternStyle(part: PatternPart, {ring, center, color}: PatternState): boolean {
  if (color !== undefined) return true;
  return part === 'finder'
    ? shapeCall(ring) !== undefined || shapeCall(center) !== undefined
    : ring !== undefined || center !== undefined;
}

function createPattern(state: PlaygroundStyleState, part: PatternPart) {
  const pattern = patternState(state, part);
  if (!hasPatternStyle(part, pattern)) return undefined;

  return PATTERN_FACTORIES[part]({
    ring: createShape(pattern.ring),
    center: createShape(pattern.center),
    color: pattern.color,
  });
}

export function createPlaygroundStyle(
  state: PlaygroundStyleState,
): Pick<QRCodeVisualStyle, 'modules' | 'finder' | 'alignment'> {
  return {
    modules: createShape(state.moduleShape),
    finder: createPattern(state, 'finder'),
    alignment: createPattern(state, 'alignment'),
  };
}

export function formatPlaygroundStyle(
  state: PlaygroundStyleState,
  formatObject: (entries: string[]) => string,
): {entries: string[]; factories: PlaygroundStyleFactory[]} {
  const used = new Set<PlaygroundStyleFactory>();
  const entries: string[] = [];

  const modules = formatShape(state.moduleShape, used);
  if (modules) entries.push(`modules: ${modules}`);

  for (const part of ['finder', 'alignment'] as const) {
    const pattern = patternState(state, part);
    if (!hasPatternStyle(part, pattern)) continue;

    used.add(part);
    const partEntries: string[] = [];
    const ring = formatShape(pattern.ring, used);
    const center = formatShape(pattern.center, used);
    if (ring) partEntries.push(`ring: ${ring}`);
    if (center) partEntries.push(`center: ${center}`);
    if (pattern.color !== undefined) partEntries.push(`color: ${JSON.stringify(pattern.color)}`);
    entries.push(`${part}: ${part}(${partEntries.length > 0 ? formatObject(partEntries) : ''})`);
  }

  return {entries, factories: [...used].sort()};
}
