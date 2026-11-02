import {QRCodeDownloadImageRenderer} from '@qrcodesdk/browser/image';
import {type QRCodeMatrixOptions, type QRCodeRenderer, qrcode} from '@qrcodesdk/core';
import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import type {QRCodeBaseProps, QRCodeDownloadHandle} from './types';
import {splitOptions} from './split-options';

/** Creates an image component for one image format, so each format loads only its own encoder. */
export function createQRCodeImageComponent<
  TOptions extends {readonly matrix?: QRCodeMatrixOptions},
>(
  displayName: string,
  createRenderer: (options?: Omit<TOptions, 'matrix'>) => QRCodeRenderer<HTMLImageElement>,
): ForwardRefExoticComponent<QRCodeBaseProps<TOptions> & RefAttributes<QRCodeDownloadHandle>> {
  const component = forwardRef<QRCodeDownloadHandle, QRCodeBaseProps<TOptions>>(
    function QRCodeImage({payload, options, ...wrapperProps}, ref) {
      const containerRef = useRef<HTMLDivElement>(null);
      const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
      const imageRenderer = useMemo(() => createRenderer(rendererOptions), [rendererOptions]);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.replaceChildren(qrcode(payload).options(matrixOptions).render(imageRenderer));
      }, [payload, imageRenderer, matrixOptions]);

      useImperativeHandle(
        ref,
        () => ({
          download(filename?: string) {
            qrcode(payload)
              .options(matrixOptions)
              .render(
                QRCodeDownloadImageRenderer({
                  renderer: imageRenderer,
                  filename,
                }),
              );
          },
        }),
        [payload, imageRenderer, matrixOptions],
      );

      return <div {...wrapperProps} ref={containerRef} />;
    },
  );
  component.displayName = displayName;
  return component;
}
