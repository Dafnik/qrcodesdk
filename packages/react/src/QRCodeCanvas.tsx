import {type QRCodeCanvasOptions, QRCodeCanvasRenderer} from '@qrcodesdk/browser';
import {qrcode} from '@qrcodesdk/core';
import {useEffect, useMemo, useRef} from 'react';

import type {QRCodeBaseProps} from './types';
import {splitOptions} from './split-options';

export type QRCodeCanvasProps = QRCodeBaseProps<QRCodeCanvasOptions>;

export function QRCodeCanvas({data, options, ...wrapperProps}: QRCodeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [matrixOptions, rendererOptions] = useMemo(() => splitOptions(options), [options]);
  const canvasRenderer = useMemo(() => QRCodeCanvasRenderer(rendererOptions), [rendererOptions]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren(qrcode(data).config(matrixOptions).render(canvasRenderer));
  }, [canvasRenderer, data, matrixOptions]);

  return <div {...wrapperProps} ref={containerRef} />;
}
