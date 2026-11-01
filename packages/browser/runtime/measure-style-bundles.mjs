import assert from 'node:assert/strict';
import {Buffer} from 'node:buffer';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {brotliCompressSync, gzipSync} from 'node:zlib';
import {build} from 'tsdown';

const directory = path.resolve('.turbo/style-bundles');
await mkdir(directory, {recursive: true});
const generation = "import {qrcode} from '@qrcodesdk/core/matrix';";
const svg = "import {QRCodeSVGRenderer} from '@qrcodesdk/core/svg';";
const styles = "import {rounded, finder, alignment, circle} from '@qrcodesdk/core/style';";
const cases = {
  matrix: `${generation} export default qrcode('bundle').matrix();`,
  text: `${generation} import {QRCodeTextRenderer} from '@qrcodesdk/core/text'; export default qrcode('bundle').render(QRCodeTextRenderer());`,
  svg: `${generation} ${svg} export default qrcode('bundle').render(QRCodeSVGRenderer());`,
  rounded: `${generation} ${svg} ${styles} export default qrcode('bundle').render(QRCodeSVGRenderer({style:{modules:rounded()}}));`,
  circle: `${generation} ${svg} ${styles} export default qrcode('bundle').render(QRCodeSVGRenderer({style:{modules:circle()}}));`,
  styled: `${generation} ${svg} ${styles} export default qrcode('bundle').render(QRCodeSVGRenderer({style:{modules:rounded(),finder:finder({ring:rounded({radius:1}),center:circle()})}}));`,
  hexagon: `${generation} ${svg} import {customShape} from '@qrcodesdk/core/style'; export default qrcode('bundle').render(QRCodeSVGRenderer({style:{modules:customShape({module:'m.5 0 .5 .25v.5l-.5 .25-.5-.25v-.5z'})}}));`,
  patterns: `${generation} ${svg} ${styles} export default qrcode('bundle').render(QRCodeSVGRenderer({style:{finder:finder({center:circle()}),alignment:alignment()}}));`,
  image: `${generation} ${svg} import {svgCenterImage} from '@qrcodesdk/core/svg'; export default qrcode('bundle').render(QRCodeSVGRenderer({centerImage:svgCenterImage('data:image/png;base64,AA==')}));`,
  canvas: `${generation} import {QRCodeCanvasRenderer} from '@qrcodesdk/browser/canvas'; export default qrcode('bundle').render(QRCodeCanvasRenderer());`,
};
const measurements = {};
for (const [name, source] of Object.entries(cases)) {
  const entry = path.join(directory, `${name}.mjs`);
  await writeFile(entry, source);
  const result = await build({
    config: false,
    entry,
    outDir: path.join(directory, 'output'),
    clean: false,
    write: false,
    dts: false,
    exports: false,
    deps: {alwaysBundle: [/^@qrcodesdk\//]},
    minify: true,
    platform: 'browser',
    target: 'es2020',
    logLevel: 'silent',
  });
  const chunks = result.bundles.flatMap((bundle) => bundle.chunks);
  assert.equal(chunks.length, 1, `${name} must be a standalone consumer bundle`);
  const [{code}] = chunks;
  assert.ok(code.length > 0, `${name} must contain bundled consumer code`);
  measurements[name] = {
    bytes: Buffer.byteLength(code),
    gzip: gzipSync(code).byteLength,
    brotli: brotliCompressSync(code).byteLength,
  };
}
await writeFile(
  path.join(directory, 'measurements.json'),
  `${JSON.stringify(measurements, null, 2)}\n`,
);
globalThis.console.log(JSON.stringify(measurements, null, 2));
