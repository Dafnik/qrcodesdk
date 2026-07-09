import {
  DownloadImageQRCodeRenderer,
  ImageQRCodeRenderer,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';
import {type QRCodeMatrixOptions} from '@qrcodesdk/core';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef} from 'react';

import {replaceElementChildren} from './replace-children';
import type {QRCodeBaseProps} from './types';
import {qrcode} from '@qrcodesdk/core';

export type QRCodeImageOptions = QRCodeMatrixOptions & QRCodeImageRendererOptions;

export type ImageQRCodeHandle = {
  download(filename?: string): void;
};

export type ImageQRCodeProps = QRCodeBaseProps<QRCodeImageOptions>;

export const ImageQRCode = forwardRef<ImageQRCodeHandle, ImageQRCodeProps>(function ImageQRCode(
  {data, options, className},
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRenderer = useMemo(() => ImageQRCodeRenderer(options), [options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    replaceElementChildren(container, qrcode(data).config(options).render(imageRenderer));
  }, [data, imageRenderer, options]);

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        qrcode(data)
          .config(options)
          .render(
            DownloadImageQRCodeRenderer({
              renderer: imageRenderer,
              filename,
            }),
          );
      },
    }),
    [data, imageRenderer, options],
  );

  return <div className={className} ref={containerRef} />;
});
