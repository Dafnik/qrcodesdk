import {captureDownloads, matrixFromRows} from '@repo/core-testing';
import {afterEach, describe, expect, test, vi} from 'vitest';

import {QRCodeDownloadImageRenderer, QRCodeDownloadSVGRenderer, QRCodeImageRenderer} from '../src';

describe('download QR code renderers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('downloads image QR output as a PNG file', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: QRCodeImageRenderer({style: {moduleSize: 1, quietZone: 0}}),
      filename: 'ticket',
    })(matrixFromRows([[1]]));

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
      renderer: QRCodeImageRenderer({style: {moduleSize: 1, quietZone: 0}}),
      filename: 'ticket.png',
    })(matrixFromRows([[1]]));

    expect(downloads[0]?.filename).toBe('ticket.png');
  });

  test('downloads SVG QR output before revoking its object URL on a later task', async () => {
    const downloads = captureDownloads(vi);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    QRCodeDownloadSVGRenderer({
      renderer: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      filename: 'ticket',
    })(matrixFromRows([[1]]));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(downloads).toEqual([
      {
        href: 'blob:qrcode-svg',
        filename: 'ticket.svg',
      },
    ]);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('does not duplicate an existing SVG extension', async () => {
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    QRCodeDownloadSVGRenderer({
      renderer: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      filename: 'ticket.svg',
    })(matrixFromRows([[1]]));

    expect(downloads[0]?.filename).toBe('ticket.svg');

    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  test('snapshots image download options and defaults blank filenames', () => {
    const downloads = captureDownloads(vi);
    const options = {
      renderer: () => ({src: 'data:image/png;base64,original'}) as HTMLImageElement,
      filename: '',
    };
    const render = QRCodeDownloadImageRenderer(options);
    options.filename = 'changed';
    options.renderer = () => ({src: 'data:image/png;base64,changed'}) as HTMLImageElement;
    render(matrixFromRows([[1]]));
    expect(downloads).toEqual([{href: 'data:image/png;base64,original', filename: 'qrcode.png'}]);
  });

  test('snapshots SVG download options and defaults whitespace-only filenames', async () => {
    const downloads = captureDownloads(vi);
    const renderer = vi.fn(() => '<svg/>');
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:original');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const options = {renderer, filename: '  '};
    const render = QRCodeDownloadSVGRenderer(options);
    options.filename = 'changed';
    options.renderer = vi.fn(() => '<svg id="changed"/>');
    render(matrixFromRows([[1]]));
    expect(renderer).toHaveBeenCalledOnce();
    expect(options.renderer).not.toHaveBeenCalled();
    expect(downloads).toEqual([{href: 'blob:original', filename: 'qrcode.svg'}]);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
