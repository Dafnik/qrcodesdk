import {useEffect, useMemo, useRef, useState} from 'react';

import {
  QRCodeCanvas,
  QRCodeImage,
  type QRCodeImageHandle,
  QRCodeSVG,
  type QRCodeSVGHandle,
} from '@qrcodesdk/react';

import {createPlaygroundSnapshot, readPlaygroundDraftFromUrl} from './qrcode-playground-state';
import {QR_CODE_PLAYGROUND_UPDATE_EVENT} from './qrcode-playground-types';

export default function QRCodeReactPlaygroundPreview() {
  const [snapshot, setSnapshot] = useState(() =>
    createPlaygroundSnapshot(readPlaygroundDraftFromUrl()),
  );
  const svgRef = useRef<QRCodeSVGHandle>(null);
  const imageRef = useRef<QRCodeImageHandle>(null);

  useEffect(() => {
    const handleUpdate = (event: WindowEventMap[typeof QR_CODE_PLAYGROUND_UPDATE_EVENT]) => {
      setSnapshot(event.detail);
    };

    window.addEventListener(QR_CODE_PLAYGROUND_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(QR_CODE_PLAYGROUND_UPDATE_EVENT, handleUpdate);
  }, []);

  const content = useMemo(() => {
    if (snapshot.draft.packageName !== 'react') return null;
    if (!snapshot.config) return <PreviewError message={snapshot.validation.error} />;

    if (snapshot.config.output === 'svg') {
      return (
        <>
          <div className="qrcode-playground__preview-output">
            <QRCodeSVG ref={svgRef} data={snapshot.config.data} options={snapshot.config.options} />
          </div>
          <DownloadButton
            label="Download SVG"
            onClick={() => svgRef.current?.download('qrcodesdk')}
          />
        </>
      );
    }

    if (snapshot.config.output === 'image') {
      return (
        <>
          <div className="qrcode-playground__preview-output">
            <QRCodeImage
              ref={imageRef}
              data={snapshot.config.data}
              options={snapshot.config.options}
            />
          </div>
          <DownloadButton
            label="Download PNG"
            onClick={() => imageRef.current?.download('qrcodesdk')}
          />
        </>
      );
    }

    return (
      <div className="qrcode-playground__preview-output">
        <QRCodeCanvas data={snapshot.config.data} options={snapshot.config.options} />
      </div>
    );
  }, [snapshot]);

  return <div data-active={snapshot.draft.packageName === 'react'}>{content}</div>;
}

function DownloadButton({label, onClick}: {label: string; onClick(): void}) {
  return (
    <button className="btn-primary btn-primary-wide" type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function PreviewError({message}: {message?: string}) {
  return (
    <div className="qrcode-playground__preview-error" role="status">
      {message ?? 'This QR code configuration is invalid.'}
    </div>
  );
}
