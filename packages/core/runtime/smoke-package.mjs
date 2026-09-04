import * as core from '@qrcodesdk/core';
import * as drawing from '@qrcodesdk/core/drawing';

const EXPECTED_MATRIX_SIZE = 29;
const EXPECTED_MATRIX_CHECKSUM = 321386907;

function logSuccess(message) {
  globalThis.console.log(`  ✓ ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function matrixChecksum(matrix) {
  let hash = 2166136261;

  for (const row of matrix) {
    for (const module of row) {
      hash ^= module;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
  }

  return hash;
}

function assertMatrix(matrix) {
  assert(Array.isArray(matrix), 'Expected a QR code matrix array');
  assert(matrix.length === EXPECTED_MATRIX_SIZE, 'Expected a 29×29 QR code matrix');

  for (const row of matrix) {
    assert(Array.isArray(row), 'Expected every QR code matrix row to be an array');
    assert(
      row.length === EXPECTED_MATRIX_SIZE,
      'Expected every QR code matrix row to have 29 modules',
    );
    assert(
      row.every((module) => module === 0 || module === 1),
      'Expected a binary QR code matrix',
    );
  }

  assert(
    matrixChecksum(matrix) === EXPECTED_MATRIX_CHECKSUM,
    `Expected matrix checksum ${EXPECTED_MATRIX_CHECKSUM}`,
  );
}

globalThis.console.log('Testing the installed @qrcodesdk/core package');

assert(
  [...Object.keys(core), ...Object.keys(drawing)].every(
    (name) => !name.startsWith(String.fromCodePoint(0x275)),
  ),
  'Expected package entry points to contain no internal exports',
);
logSuccess('root and drawing subpath resolve without internal runtime exports');

for (const exportName of ['qrcode', 'QRCodeSVGRenderer', 'QRCodeTextRenderer']) {
  assert(typeof core[exportName] === 'function', `Expected Core export ${exportName}`);
}
logSuccess('package exposes the qrcode builder and bundled renderers');

const builder = core.qrcode('Runtime ✅ 你好').mode('octet').errorCorrection('H').mask(3);
const matrix = builder.matrix();
assertMatrix(matrix);
logSuccess('builder creates the expected binary 29×29 matrix and checksum');

const svg = builder.render(
  core.QRCodeSVGRenderer({
    style: {moduleSize: 2, quietZone: 1},
    accessibility: {title: 'Runtime smoke'},
  }),
);
assert(svg.includes('width="62"'), 'Expected SVG width 62');
assert(svg.includes('height="62"'), 'Expected SVG height 62');
assert(svg.includes('viewBox="0 0 31 31"'), 'Expected SVG view box 31×31');
assert(svg.includes('role="img"'), 'Expected the SVG image role');
assert(svg.includes('<title>Runtime smoke</title>'), 'Expected the SVG title element');
logSuccess('SVG renderer produces the expected size, view box, role, and title');

const text = builder.render(core.QRCodeTextRenderer({style: {moduleSize: 1, quietZone: 1}}));
const lines = text.split('\n');
assert(lines.length === 16, 'Expected terminal text to contain 16 lines');
assert(
  lines.every((line) => line.length === 31),
  'Expected every terminal line to be 31 characters',
);
logSuccess('text renderer produces the expected 16×31 terminal output');

const renderedChecksum = builder.render((renderedMatrix) => {
  assertMatrix(renderedMatrix);
  return matrixChecksum(renderedMatrix);
});
assert(
  renderedChecksum === EXPECTED_MATRIX_CHECKSUM,
  'Expected the custom renderer to receive the same matrix',
);
logSuccess('custom renderer receives the unchanged QR matrix');

globalThis.console.log('@qrcodesdk/core installed-package smoke test passed');
