import {type MicroQRCodeScan, decodeMicroQRCode} from '@repo/core-testing/micro-decoder';
import {prepareZXingModule} from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

import {getCanvasContext} from './helper';

// Vite serves the local WebAssembly binary, so ZXing does not fetch it from a CDN.
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) =>
      path.endsWith('.wasm') ? wasmUrl : prefix + path,
  },
});

/**
 * Scans a Micro QR code as displayed on a white page. jsQR cannot read Micro QR codes, so this uses
 * ZXing.
 */
export function decodeCanvasMicroQRCode(source: HTMLCanvasElement): Promise<MicroQRCodeScan> {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = getCanvasContext(canvas);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0);
  const {data} = context.getImageData(0, 0, canvas.width, canvas.height);
  return decodeMicroQRCode(data, canvas.width, canvas.height);
}
