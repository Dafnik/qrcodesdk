/** Vite resolves the `?url` import to the URL it serves the ZXing WebAssembly binary from. */
declare module 'zxing-wasm/reader/zxing_reader.wasm?url' {
  const url: string;
  export default url;
}
