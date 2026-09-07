import {useMemo, useRef} from 'react';

import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

import {useStore} from '@nanostores/react';
import {
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundOptions,
  playgroundPreparedImage,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

export default function QRCodeReactPlaygroundPreview() {
  const options = useStore(playgroundOptions);
  const preparedImage = useStore(playgroundPreparedImage);

  const svgRef = useRef<QRCodeDownloadHandle>(null);
  const imageRef = useRef<QRCodeDownloadHandle>(null);

  const content = useMemo(() => {
    if (options.packageName !== 'react') return null;
    const hasError = hasQRCodeError(options, preparedImage);
    if (hasError) return <PreviewError message={hasError} />;

    if (options.output === 'svg') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeSVG
            ref={svgRef}
            payload={options.payload}
            options={createPlaygroundSVGOptions(options, preparedImage)}
          />
          <DownloadButton
            label="Download SVG"
            onClick={() => svgRef.current?.download('qrcodesdk')}
          />
        </div>
      );
    }

    if (options.output === 'image') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeImage
            ref={imageRef}
            payload={options.payload}
            options={createPlaygroundImageOptions(options, preparedImage)}
          />
          <DownloadButton
            label="Download PNG"
            onClick={() => imageRef.current?.download('qrcodesdk')}
          />
        </div>
      );
    }

    return (
      <QRCodeCanvas
        payload={options.payload}
        options={createPlaygroundCanvasOptions(options, preparedImage)}
      />
    );
  }, [options, preparedImage]);

  return <div data-active={options.packageName === 'react'}>{content}</div>;
}

function DownloadButton({label, onClick}: {label: string; onClick(): void}) {
  return (
    <button className="btn-primary large min-w-64" type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function PreviewError({message}: {message?: unknown}) {
  return (
    <div className="group/alert text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 relative grid w-full max-w-md gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18">
      <h4 className="[&_a]:hover:text-foreground font-medium [&_a]:underline [&_a]:underline-offset-3">
        QR code generation failed
      </h4>
      <p className="text-destructive/90 [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
        {message ? String(message) : 'This QR code options is invalid.'}
      </p>
    </div>
  );
}
