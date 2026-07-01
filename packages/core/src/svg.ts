import type {
  QRCodeAccessibilityOptions,
  QRCodeMatrix,
  QRCodeRenderer,
  QRCodeStylingOptions,
} from './types';

export type QRCodeSVGRendererOptions = QRCodeStylingOptions & QRCodeAccessibilityOptions;

export function SVGQRCodeRenderer(options?: QRCodeSVGRendererOptions): QRCodeRenderer<string> {
  return (matrix: QRCodeMatrix) => {
    const modSize = options?.size ?? 5;
    const margin = options?.margin ?? 4;
    const fgColor = options?.colors?.colorLight ?? '#ffffff';
    const bgColor = options?.colors?.colorDark ?? '#000000';
    const n = matrix.length;
    const size = modSize * (n + 2 * margin);

    const xml = [
      '<svg xmlns="http://www.w3.org/2000/svg"',
      `width="${size}" height="${size}" ${options?.alt ? `alt="${options.alt}"` : ''} ${options?.ariaLabel ? `aria-label="${options.ariaLabel}"` : ''} ${options?.title ? `title="${options.title}"` : ''}>`,
    ];
    xml.push(`<rect width="${size}" height="${size}" fill="${fgColor}" />`);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j]) {
          xml.push(
            `<rect x="${modSize * (margin + j)}" y="${modSize * (margin + i)}" width="${modSize + 0.3}" height="${modSize + 0.3}" fill="${bgColor}" />`,
          );
        }
      }
    }

    xml.push('</svg>');

    return xml.join('\n');
  };
}
