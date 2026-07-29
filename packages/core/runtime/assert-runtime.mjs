const EXPECTED_MATRIX_SIZE = 29;
const EXPECTED_MATRIX_CHECKSUM = 321386907;

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

export function assertRuntime(core) {
  for (const exportName of ['qrcode', 'QRCodeSVGRenderer', 'QRCodeTextRenderer']) {
    assert(typeof core[exportName] === 'function', `Expected Core export ${exportName}`);
  }

  const builder = core.qrcode('Runtime ✅ 你好').mode('octet').errorCorrection('H').mask(3);
  const matrix = builder.matrix();
  assertMatrix(matrix);

  const svg = builder.render(
    core.QRCodeSVGRenderer({
      size: 2,
      margin: 1,
      title: 'Runtime smoke',
    }),
  );
  assert(svg.includes('width="62"'), 'Expected SVG width 62');
  assert(svg.includes('height="62"'), 'Expected SVG height 62');
  assert(svg.includes('viewBox="0 0 31 31"'), 'Expected SVG view box 31×31');
  assert(svg.includes('title="Runtime smoke"'), 'Expected the SVG title attribute');

  const text = builder.render(core.QRCodeTextRenderer({size: 1, margin: 1}));
  const lines = text.split('\n');
  assert(lines.length === 16, 'Expected terminal text to contain 16 lines');
  assert(
    lines.every((line) => line.length === 31),
    'Expected every terminal line to be 31 characters',
  );

  const renderedChecksum = builder.render((renderedMatrix) => {
    assertMatrix(renderedMatrix);
    return matrixChecksum(renderedMatrix);
  });
  assert(
    renderedChecksum === EXPECTED_MATRIX_CHECKSUM,
    'Expected the custom renderer to receive the same matrix',
  );
}
