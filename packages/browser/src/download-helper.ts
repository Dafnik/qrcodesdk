import type {QRCodeDownloadRendererOptions} from './types';

export function resolveDownloadOptions<T>(
  options: QRCodeDownloadRendererOptions<T>,
): Required<QRCodeDownloadRendererOptions<T>> {
  return {
    renderer: options.renderer,
    filename: options.filename?.trim() || 'qrcode',
  };
}

export function downloadQRCode(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

export function ensureExtension(filename: string, extension: string): string {
  return filename.toLowerCase().endsWith(extension) ? filename : `${filename}${extension}`;
}
