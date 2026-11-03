import {captureDownloads, matrixFromRows} from '@repo/core-testing';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

import {
  QRCodeDownloadImageRenderer,
  QRCodeDownloadSVGRenderer,
  QRCodeGIFImageRenderer,
  QRCodeJPEGImageRenderer,
  QRCodePNGImageRenderer,
  QRCodeWebPImageRenderer,
} from '../src';

describe('download QR code renderers', () => {
  beforeEach(() => {
    vi.useFakeTimers({toFake: ['setTimeout']});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('downloads image QR output as a PNG file', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: QRCodePNGImageRenderer({style: {moduleSize: 1, quietZone: 0}}),
      filename: 'ticket',
    })(matrixFromRows([[1]]));

    expect(downloads).toEqual([
      {
        href: expect.stringMatching(/^data:image\/png;base64,/),
        filename: 'ticket.png',
      },
    ]);
  });

  test.each([
    {format: 'WebP', createRenderer: QRCodeWebPImageRenderer, mimeType: 'webp', extension: 'webp'},
    {format: 'GIF', createRenderer: QRCodeGIFImageRenderer, mimeType: 'gif', extension: 'gif'},
    {format: 'JPEG', createRenderer: QRCodeJPEGImageRenderer, mimeType: 'jpeg', extension: 'jpg'},
  ])(
    'downloads $format image output with its extension',
    ({createRenderer, mimeType, extension}) => {
      const downloads = captureDownloads(vi);

      QRCodeDownloadImageRenderer({
        renderer: createRenderer({style: {moduleSize: 1, quietZone: 0}}),
        filename: 'ticket',
      })(matrixFromRows([[1]]));

      expect(downloads).toEqual([
        {
          href: expect.stringMatching(new RegExp(`^data:image/${mimeType};base64,`)),
          filename: `ticket.${extension}`,
        },
      ]);
    },
  );

  test('keeps the filename of image output with an unknown type', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: () => ({src: 'blob:qrcode-image'}) as HTMLImageElement,
      filename: 'ticket',
    })(matrixFromRows([[1]]));

    expect(downloads).toEqual([{href: 'blob:qrcode-image', filename: 'ticket'}]);
  });

  test('does not duplicate an existing PNG extension', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: QRCodePNGImageRenderer({style: {moduleSize: 1, quietZone: 0}}),
      filename: 'ticket.png',
    })(matrixFromRows([[1]]));

    expect(downloads[0]?.filename).toBe('ticket.png');
  });

  test.each(['ticket.jpg', 'ticket.jpeg', 'ticket.JPEG'])(
    'does not add a JPEG extension to %s',
    (filename) => {
      const downloads = captureDownloads(vi);

      QRCodeDownloadImageRenderer({
        renderer: QRCodeJPEGImageRenderer({style: {moduleSize: 1, quietZone: 0}}),
        filename,
      })(matrixFromRows([[1]]));

      expect(downloads[0]?.filename).toBe(filename);
    },
  );

  test('downloads SVG QR output before revoking its object URL after a delay', () => {
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

    vi.advanceTimersByTime(39_999);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:qrcode-svg');
  });

  test('does not duplicate an existing SVG extension', () => {
    const downloads = captureDownloads(vi);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qrcode-svg');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    QRCodeDownloadSVGRenderer({
      renderer: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      filename: 'ticket.svg',
    })(matrixFromRows([[1]]));

    expect(downloads[0]?.filename).toBe('ticket.svg');
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

  test('snapshots SVG download options and defaults whitespace-only filenames', () => {
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
  });

  test('trims surrounding whitespace from filenames', () => {
    const downloads = captureDownloads(vi);

    QRCodeDownloadImageRenderer({
      renderer: () => ({src: 'data:image/png;base64,a'}) as HTMLImageElement,
      filename: ' ticket ',
    })(matrixFromRows([[1]]));

    expect(downloads[0]?.filename).toBe('ticket.png');
  });
});
