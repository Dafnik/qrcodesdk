import {decodeKanjiTable} from './kanji/decode-table';
import {KANJI_TABLE} from './kanji/table';
import {createKanji} from './matrix/kanji';
import type {QRCodeKanji} from './types';

export type {QRCodeKanji} from './types';

let values: Uint16Array | undefined;

/**
 * The Shift JIS table for QR code Kanji mode. Pass it as the `kanji` matrix option to enable the
 * `kanji` mode, Kanji segments, and Kanji detection in `auto` mode and `automaticSegmenter`.
 *
 * It covers every double-byte Shift JIS character that Kanji mode can encode, as decoded by the
 * WHATWG Shift_JIS decoder, including kana, full-width Latin, Greek, Cyrillic, and symbols. The
 * table is decoded on first use.
 */
export const kanji: QRCodeKanji = /* @__PURE__ */ createKanji(
  (codeUnit) => (values ??= decodeKanjiTable(KANJI_TABLE))[codeUnit]! - 1,
);
