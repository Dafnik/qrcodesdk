import type {QRCodeKanji, QRCodeMode} from '@qrcodesdk/core';

let table: QRCodeKanji | undefined;
let loading: Promise<QRCodeKanji> | undefined;
let queue: Promise<void> | undefined;

/**
 * Whether the matrix needs the Kanji table: the Kanji switch is on, or Kanji mode is forced, which
 * the CLI also loads the table for.
 */
export function playgroundUsesKanji(options: {
  readonly kanji?: boolean;
  readonly mode?: QRCodeMode;
}): boolean {
  return options.kanji === true || options.mode === 'kanji';
}

/** The Kanji table once it has loaded, or `undefined` before. */
export function playgroundKanjiTable(): QRCodeKanji | undefined {
  return table;
}

/** Loads the Kanji table in its own chunk, so the playground only downloads it when needed. */
export function loadPlaygroundKanji(): Promise<QRCodeKanji> {
  loading ??= import('@qrcodesdk/core/kanji').then(
    (module) => (table = module.kanji),
    (error: unknown) => {
      // Allow a later attempt after a failed download.
      loading = undefined;
      throw error;
    },
  );
  return loading;
}

/**
 * Applies a playground store update once the Kanji table is available if the new options need it,
 * so the preview never renders Kanji options without the table. Updates run in call order: while a
 * load is pending, later updates wait behind it. A failed load still applies the update, so the
 * preview reports the error.
 */
export function applyWithPlaygroundKanji(needsKanji: boolean, apply: () => void): void {
  if (!queue && (!needsKanji || table)) {
    apply();
    return;
  }

  const current: Promise<void> = (queue ?? Promise.resolve())
    .then(() => (needsKanji ? loadPlaygroundKanji() : undefined))
    .catch(() => undefined)
    .then(apply)
    .finally(() => {
      if (queue === current) queue = undefined;
    });
  queue = current;
}

/** Resolves once every queued playground update has been applied. */
export function playgroundKanjiSettled(): Promise<void> {
  return queue ?? Promise.resolve();
}
