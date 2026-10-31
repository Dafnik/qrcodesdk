import * as core from '@qrcodesdk/core';
import * as drawing from '@qrcodesdk/core/drawing';
import * as payload from '@qrcodesdk/core/payload';
import * as style from '@qrcodesdk/core/style';

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

  for (const module of matrix.modules) {
    hash ^= module;
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash;
}

function assertMatrix(matrix) {
  assert(matrix.size === EXPECTED_MATRIX_SIZE, 'Expected a 29×29 QR code matrix');
  const length = EXPECTED_MATRIX_SIZE * EXPECTED_MATRIX_SIZE;
  assert(
    Array.isArray(matrix.modules) &&
      Object.isFrozen(matrix.modules) &&
      matrix.modules.length === length,
    'Expected row-major QR code modules',
  );
  assert(
    Array.isArray(matrix.roles) && Object.isFrozen(matrix.roles) && matrix.roles.length === length,
    'Expected row-major QR code module roles',
  );
  assert(
    matrix.modules.every((module) => module === 0 || module === 1),
    'Expected light and dark modules',
  );
  assert(
    matrixChecksum(matrix) === EXPECTED_MATRIX_CHECKSUM,
    `Expected matrix checksum ${EXPECTED_MATRIX_CHECKSUM}`,
  );
}

globalThis.console.log('Testing the installed @qrcodesdk/core package');

assert(
  [
    ...Object.keys(core),
    ...Object.keys(drawing),
    ...Object.keys(payload),
    ...Object.keys(style),
  ].every((name) => !name.startsWith(String.fromCodePoint(0x275))),
  'Expected package entry points to contain no internal exports',
);
logSuccess(
  'root, drawing, payload, and style entry points resolve without internal runtime exports',
);

for (const exportName of ['qrcode', 'QRCodeSVGRenderer', 'QRCodeTextRenderer', 'svgCenterImage']) {
  assert(typeof core[exportName] === 'function', `Expected Core export ${exportName}`);
}
logSuccess('package exposes the qrcode builder and bundled renderers');

assert(typeof drawing.createQRCodeStyler === 'function', 'Expected the drawing styler factory');
assert(
  !('createQRCodeStyler' in core),
  'Expected createQRCodeStyler to be exported only from the drawing subpath',
);
logSuccess('drawing subpath exclusively exposes the styler factory');

for (const exportName of ['alignment', 'circle', 'diagonal', 'finder', 'rounded']) {
  assert(typeof style[exportName] === 'function', `Expected style export ${exportName}`);
  assert(
    !(exportName in core),
    `Expected ${exportName} to be exported only from the style subpath`,
  );
}
logSuccess('style subpath exposes the shapes and the finder and alignment parts');

for (const exportName of [
  'emailPayload',
  'geoPayload',
  'phonePayload',
  'smsPayload',
  'wifiPayload',
]) {
  assert(typeof payload[exportName] === 'function', `Expected payload export ${exportName}`);
  assert(
    !(exportName in core),
    `Expected ${exportName} to be exported only from the payload subpath`,
  );
}
logSuccess('payload subpath exposes the payload serializers');

const builder = core.qrcode('Runtime ✅ 你好').mode('octet').errorCorrection('H').mask(3);
const matrix = builder.matrix();
assertMatrix(matrix);
logSuccess('builder creates the expected 29×29 matrix and checksum');

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

const styledSVG = builder.render(
  core.QRCodeSVGRenderer({
    style: {
      modules: style.rounded(),
      finder: style.finder({ring: style.circle(), color: '#ff0000'}),
    },
  }),
);
assert(styledSVG.includes('fill="#ff0000"'), 'Expected a separate finder layer');
assert(styledSVG.includes('a.5.5 0 0 1'), 'Expected rounded module arcs');
logSuccess('SVG renderer draws imported shapes and the finder part');

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
