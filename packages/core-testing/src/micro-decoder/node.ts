/// <reference types="node" />
// Node.js-only entry; the rest of `src` stays runtime-neutral for browser tests.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {prepareZXingModule} from 'zxing-wasm/reader';

// Load the local WebAssembly binary instead of fetching it from a CDN.
const wasmBinary = readFileSync(
  createRequire(import.meta.url).resolve('zxing-wasm/reader/zxing_reader.wasm'),
);
prepareZXingModule({
  overrides: {
    wasmBinary: wasmBinary.buffer.slice(
      wasmBinary.byteOffset,
      wasmBinary.byteOffset + wasmBinary.byteLength,
    ) as ArrayBuffer,
  },
});

export {decodeMicroQRCode, decodeMicroQRCodeMatrix, type MicroQRCodeScan} from './index';
