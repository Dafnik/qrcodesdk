import {useMemo, useRef} from 'react';

import {QRCodeCanvas, type QRCodeDownloadHandle, QRCodeImage, QRCodeSVG} from '@qrcodesdk/react';

import {useStore} from '@nanostores/react';
import {
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  playgroundConfig,
  playgroundPreparedImage,
} from './playground-config.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

export default function QRCodeReactPlaygroundPreview() {
  const config = useStore(playgroundConfig);
  const preparedImage = useStore(playgroundPreparedImage);

  const svgRef = useRef<QRCodeDownloadHandle>(null);
  const imageRef = useRef<QRCodeDownloadHandle>(null);

  const content = useMemo(() => {
    if (config.packageName !== 'react') return null;
    const hasError = hasQRCodeError(config, preparedImage);
    if (hasError) return <PreviewError message={hasError} />;

    if (config.output === 'svg') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeSVG
            ref={svgRef}
            data={config.data}
            options={createPlaygroundSVGOptions(config, preparedImage)}
          />
          <DownloadButton
            label="Download SVG"
            onClick={() => svgRef.current?.download('qrcodesdk')}
          />
        </div>
      );
    }

    if (config.output === 'image') {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <QRCodeImage
            ref={imageRef}
            data={config.data}
            options={createPlaygroundImageOptions(config, preparedImage)}
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
        data={config.data}
        options={createPlaygroundCanvasOptions(config, preparedImage)}
      />
    );
  }, [config, preparedImage]);

  return <div data-active={config.packageName === 'react'}>{content}</div>;
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
        {message ? String(message) : 'This QR code configuration is invalid.'}
      </p>
    </div>
  );
}
