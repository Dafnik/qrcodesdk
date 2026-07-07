import {
  DownloadImageQRCodeRenderer,
  ImageQRCodeRenderer,
  type QRCodeImageRendererOptions,
} from '@qrcodesdk/browser';
import {type QRCodeMatrixOptions} from '@qrcodesdk/core';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef} from 'react';

import {renderQRCode} from './qrcode-builder';
import {replaceElementChildren} from './replace-children';
import type {QRCodeBaseProps} from './types';

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

    replaceElementChildren(container, renderQRCode(data, options, imageRenderer));
  }, [data, imageRenderer, options]);

  useImperativeHandle(
    ref,
    () => ({
      download(filename?: string) {
        renderQRCode(
          data,
          options,
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
