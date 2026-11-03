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

// Other spellings of an extension that a filename may already end with.
const EXTENSION_ALIASES: Readonly<Record<string, readonly string[]>> = {'.jpg': ['.jpeg']};

export function ensureExtension(filename: string, extension: string): string {
  const lowercase = filename.toLowerCase();
  return [extension, ...(EXTENSION_ALIASES[extension] ?? [])].some((candidate) =>
    lowercase.endsWith(candidate),
  )
    ? filename
    : `${filename}${extension}`;
}
