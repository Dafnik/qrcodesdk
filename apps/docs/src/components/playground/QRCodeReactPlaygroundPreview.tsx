import {useMemo, useRef} from 'react';

import {
  QRCodeCanvas,
  type QRCodeDownloadHandle,
  QRCodeGIF,
  QRCodeJPEG,
  QRCodePNG,
  QRCodeSVG,
  QRCodeWebP,
} from '@qrcodesdk/react';

import {useStore} from '@nanostores/react';
import {
  createPlaygroundCanvasOptions,
  createPlaygroundImageOptions,
  createPlaygroundSVGOptions,
  isPlaygroundImageOutput,
  playgroundOptions,
  playgroundPreparedImage,
} from './playground-options.ts';
import {hasQRCodeError} from './qrcode-error-checker.ts';

const IMAGE_COMPONENTS = {
  png: {component: QRCodePNG, label: 'Download PNG'},
  webp: {component: QRCodeWebP, label: 'Download WebP'},
  gif: {component: QRCodeGIF, label: 'Download GIF'},
  jpeg: {component: QRCodeJPEG, label: 'Download JPEG'},
} as const;

export default function QRCodeReactPlaygroundPreview() {
  const options = useStore(playgroundOptions);
  const preparedImage = useStore(playgroundPreparedImage);

  const svgRef = useRef<QRCodeDownloadHandle>(null);
  const imageRef = useRef<QRCodeDownloadHandle>(null);

  const content = useMemo(() => {
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

    if (isPlaygroundImageOutput(options.output)) {
      const {component: ImageComponent, label} = IMAGE_COMPONENTS[options.output];
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <ImageComponent
            key={options.output}
            ref={imageRef}
            payload={options.payload}
            options={createPlaygroundImageOptions(options, preparedImage)}
          />
          <DownloadButton label={label} onClick={() => imageRef.current?.download('qrcodesdk')} />
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

  return content;
}

function DownloadButton({label, onClick}: {label: string; onClick(): void}) {
  return (
    <button className="btn-primary large min-w-64" type="button" onClick={onClick}>
      {label}
    </button>
  );
}

/** Displays a generation error, with a fallback when no message is available. */
function PreviewError({message}: {message?: unknown}) {
  return (
    <div className="group/alert text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 relative grid w-full max-w-md gap-0.5 rounded-lg border px-2.5 py-2 text-start text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pe-18">
      <h4 className="[&_a]:hover:text-foreground font-medium [&_a]:underline [&_a]:underline-offset-3">
        QR code generation failed
      </h4>
      <p className="text-destructive/90 [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4">
        {message ? String(message) : 'These QR code options are invalid.'}
      </p>
    </div>
  );
}
