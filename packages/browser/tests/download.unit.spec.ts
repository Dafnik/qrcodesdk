import {captureDownloads} from '@repo/core-testing';
import {afterEach, describe, expect, test, vi} from 'vitest';

import {QRCodeDownloadImageRenderer, QRCodeDownloadSVGRenderer, QRCodeImageRenderer} from '../src';

describe('download QR code renderers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('downloads image QR output as a PNG file', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: QRCodeImageRenderer({size: 1, margin: 0}),
      filename: 'ticket',
    })([[1]]);

    expect(downloads).toEqual([
      {
        href: expect.stringMatching(/^data:image\/png;base64,/),
        filename: 'ticket.png',
      },
    ]);
  });

  test('does not duplicate an existing PNG extension', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: QRCodeImageRenderer({size: 1, margin: 0}),
      filename: 'ticket.png',
    })([[1]]);

    expect(downloads[0]?.filename).toBe('ticket.png');
  });

  test('downloads SVG QR output as a revocable object URL', () => {
    const downloads = captureDownloads(vi);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    QRCodeDownloadSVGRenderer({
      renderer: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      filename: 'ticket',
    })([[1]]);

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(downloads).toEqual([
      {
        href: 'blob:qrcode-svg',
        filename: 'ticket.svg',
      },
    ]);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('does not duplicate an existing SVG extension', () => {
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    QRCodeDownloadSVGRenderer({
      renderer: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      filename: 'ticket.svg',
    })([[1]]);

    expect(downloads[0]?.filename).toBe('ticket.svg');
  });
});
