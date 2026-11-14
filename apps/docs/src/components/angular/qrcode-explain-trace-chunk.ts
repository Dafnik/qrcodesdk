/**
 * The lazily loaded part of the encoding trace: the analysis and its presentation load together the
 * first time the trace is shown. Import this module only with a dynamic `import()`.
 */
export {analyzeQRCodeEncoding} from '../explain/qrcode-trace.ts';
export {QRCodeExplainTrace} from './qrcode-explain-trace.ts';
