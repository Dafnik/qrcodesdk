// Generates rMQR reference symbols with zint, through the zxing-wasm writer, for the core rMQR
// tests. It never calls the QRCodeSDK encoder, so the references stay independent of it.
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {prepareZXingModule, writeBarcode} from 'zxing-wasm/writer';

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('zxing-wasm/writer/zxing_writer.wasm');
const wasmBinary = readFileSync(wasmPath);
prepareZXingModule({
  overrides: {
    wasmBinary: wasmBinary.buffer.slice(
      wasmBinary.byteOffset,
      wasmBinary.byteOffset + wasmBinary.byteLength,
    ),
  },
});

const OUTPUT = new globalThis.URL(
  '../../core/tests/rmqr/__fixtures__/zint-rmqr.txt',
  import.meta.url,
);
// The package does not export its package.json; the binary is in dist/writer.
const {version: zxingVersion} = JSON.parse(
  readFileSync(new globalThis.URL('../../package.json', `file://${wasmPath}`), 'utf8'),
);

// Version names in version-indicator order. zint numbers them from 1, and 33 to 38 select a height
// with an automatic width.
const HEIGHTS = [
  [7, [43, 59, 77, 99, 139]],
  [9, [43, 59, 77, 99, 139]],
  [11, [27, 43, 59, 77, 99, 139]],
  [13, [27, 43, 59, 77, 99, 139]],
  [15, [43, 59, 77, 99, 139]],
  [17, [43, 59, 77, 99, 139]],
];
const VERSIONS = HEIGHTS.flatMap(([height, widths]) =>
  widths.map((width) => `R${height}x${width}`),
);

// Characters that each mode encodes on its own: zint optimizes mixed content into several
// segments, while these payloads stay in one mode.
const ALPHABETS = {
  numeric: '0123456789',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:0123456789',
  octet: 'abcdefghijklmnopqrstuvwxyz',
  kanji: '点茗漢字日本語東京',
};
const MODES = Object.keys(ALPHABETS);

function payloadOf(mode, length, offset = 0) {
  const alphabet = ALPHABETS[mode];
  let payload = '';
  for (let index = 0; index < length; index++) {
    payload += alphabet[(index * 7 + offset) % alphabet.length];
  }
  return payload;
}

async function write(payload, zintVersion, errorCorrectionLevel) {
  const result = await writeBarcode(payload, {
    format: 'RMQRCode',
    options: `version=${zintVersion},ecLevel=${errorCorrectionLevel}`,
    scale: 1,
    addQuietZones: false,
  });
  if (result.error) return undefined;
  const {width, height, data} = result.symbol;
  const rows = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    // zint marks dark modules with 0 in the symbol image.
    for (let x = 0; x < width; x++) row += data[y * width + x] ? '0' : '1';
    rows.push(row);
  }
  return {symbol: `R${height}x${width}`, rows};
}

/** The longest payload of a mode that fits the zint version, found by binary search. */
async function longest(mode, zintVersion, errorCorrectionLevel) {
  let low = 0,
    high = 400;
  while (low < high) {
    const length = (low + high + 1) >> 1;
    if (await write(payloadOf(mode, length), zintVersion, errorCorrectionLevel)) low = length;
    else high = length - 1;
  }
  return low;
}

const cases = [];
async function add(payload, mode, version, errorCorrectionLevel) {
  const zintVersion =
    version === null
      ? 0
      : version.includes('x')
        ? VERSIONS.indexOf(version) + 1
        : 33 + [7, 9, 11, 13, 15, 17].indexOf(Number(version.slice(1)));
  const result = await write(payload, zintVersion, errorCorrectionLevel);
  if (!result) throw new Error(`zint cannot encode ${payload} in ${version}`);
  cases.push({payload, mode, version, errorCorrectionLevel, ...result});
}

// Every version and level, filled to capacity in a mode that rotates with the version, plus a
// short numeric payload that exercises the pad codewords.
for (const [index, version] of VERSIONS.entries()) {
  for (const errorCorrectionLevel of ['M', 'H']) {
    const mode = MODES[(index + (errorCorrectionLevel === 'H' ? 2 : 0)) % MODES.length];
    const length = await longest(mode, index + 1, errorCorrectionLevel);
    await add(payloadOf(mode, length, index), mode, version, errorCorrectionLevel);
    await add(
      payloadOf('numeric', 1 + (index % 5), index),
      'numeric',
      version,
      errorCorrectionLevel,
    );
  }
}

// Automatic selection: the smallest area, including the R7x99 and R9x77 tie.
for (const [mode, length] of [
  ['numeric', 1],
  ['numeric', 13],
  ['alphanumeric', 20],
  ['octet', 30],
  ['octet', 41],
  ['kanji', 12],
  ['numeric', 361],
]) {
  await add(payloadOf(mode, length), mode, null, 'M');
}
await add(payloadOf('octet', 22), 'octet', null, 'H');

// A height with an automatic width.
for (const [height, mode, length] of [
  ['R7', 'numeric', 20],
  ['R9', 'alphanumeric', 40],
  ['R11', 'octet', 12],
  ['R13', 'kanji', 20],
  ['R15', 'octet', 90],
  ['R17', 'numeric', 200],
]) {
  await add(payloadOf(mode, length), mode, height, 'M');
}

const header = [
  `# rMQR reference symbols from zint, through the zxing-wasm ${zxingVersion} writer`,
  '# (https://github.com/zint/zint, https://github.com/Sec-ant/zxing-wasm), one block per case:',
  "# a JSON line with the options and zint's selected symbol, then the modules. `version` is an",
  '# exact version, a height with an automatic width, or null for automatic selection.',
  '# Regenerate with `pnpm turbo run generate:rmqr-fixtures --filter=@repo/core-testing`.',
  '# cspell:disable',
];
const blocks = cases.map(({rows, ...options}) => [JSON.stringify(options), ...rows].join('\n'));
writeFileSync(OUTPUT, `${header.join('\n')}\n\n${blocks.join('\n\n')}\n`);
globalThis.console.log(`Wrote ${cases.length} rMQR references to ${OUTPUT.pathname}`);
