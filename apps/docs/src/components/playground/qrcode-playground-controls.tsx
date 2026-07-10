import {useEffect, useMemo, useState} from 'react';

import {generatePlaygroundCode} from './qrcode-playground-code';
import {
  QR_CODE_PLAYGROUND_DEFAULT_DRAFT,
  createPlaygroundSnapshot,
  normalizeHexColorInput,
  readPlaygroundDraftFromUrl,
  writePlaygroundDraftToUrl,
} from './qrcode-playground-state';
import {
  QR_CODE_PLAYGROUND_UPDATE_EVENT,
  type QRCodePlaygroundDraft,
  type QRCodePlaygroundOutput,
  type QRCodePlaygroundPackage,
} from './qrcode-playground-types';

const VERSION_OPTIONS = Array.from({length: 40}, (_, index) => index + 1);
const MASK_OPTIONS = Array.from({length: 8}, (_, index) => index);

export default function QRCodePlaygroundControls() {
  const [draft, setDraft] = useState(readPlaygroundDraftFromUrl);
  const [copied, setCopied] = useState(false);
  const snapshot = useMemo(() => createPlaygroundSnapshot(draft), [draft]);
  const codePreview = useMemo(() => generatePlaygroundCode(draft), [draft]);

  useEffect(() => {
    writePlaygroundDraftToUrl(draft);
    window.dispatchEvent(new CustomEvent(QR_CODE_PLAYGROUND_UPDATE_EVENT, {detail: snapshot}));
  }, [draft, snapshot]);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const updateDraft = <TKey extends keyof QRCodePlaygroundDraft>(
    key: TKey,
    value: QRCodePlaygroundDraft[TKey],
  ) => {
    setDraft((current) => ({...current, [key]: value}));
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(codePreview.code);
    setCopied(true);
  };

  const resetDraft = () => {
    setCopied(false);
    setDraft({...QR_CODE_PLAYGROUND_DEFAULT_DRAFT});
  };

  return (
    <div className="qrcode-playground__controls">
      <section className="qrcode-playground__panel" aria-labelledby="playground-config-heading">
        <div className="qrcode-playground__section-heading qrcode-playground__section-heading--inline">
          <div>
            <h2 id="playground-config-heading">Configure</h2>
            <p>Choose a package, output, matrix, and renderer options.</p>
          </div>
          <button className="qrcode-playground__button" type="button" onClick={resetDraft}>
            Reset
          </button>
        </div>

        <FieldGroup label="Package">
          <SegmentedControl
            name="package"
            options={[
              {label: 'React', value: 'react'},
              {label: 'Angular', value: 'angular'},
            ]}
            value={draft.packageName}
            onChange={(value) => updateDraft('packageName', value as QRCodePlaygroundPackage)}
          />
        </FieldGroup>

        <FieldGroup label="Output">
          <SegmentedControl
            name="output"
            options={[
              {label: 'SVG', value: 'svg'},
              {label: 'PNG image', value: 'image'},
              {label: 'Canvas', value: 'canvas'},
            ]}
            value={draft.output}
            onChange={(value) => updateDraft('output', value as QRCodePlaygroundOutput)}
          />
        </FieldGroup>

        <label className="qrcode-playground__field qrcode-playground__field--full">
          <span>Data</span>
          <textarea
            rows={4}
            value={draft.data}
            onChange={(event) => updateDraft('data', event.currentTarget.value)}
          />
        </label>

        <div className="qrcode-playground__grid">
          <label className="qrcode-playground__field">
            <span>Mode</span>
            <select
              value={draft.mode}
              onChange={(event) =>
                updateDraft('mode', event.currentTarget.value as QRCodePlaygroundDraft['mode'])
              }>
              <option value="auto">Auto</option>
              <option value="numeric">numeric</option>
              <option value="alphanumeric">alphanumeric</option>
              <option value="octet">octet</option>
            </select>
          </label>

          <label className="qrcode-playground__field">
            <span>Version</span>
            <select
              value={draft.version}
              onChange={(event) =>
                updateDraft(
                  'version',
                  event.currentTarget.value === 'auto'
                    ? 'auto'
                    : (Number(event.currentTarget.value) as QRCodePlaygroundDraft['version']),
                )
              }>
              <option value="auto">Auto</option>
              {VERSION_OPTIONS.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </label>

          <label className="qrcode-playground__field">
            <span>Error correction</span>
            <select
              value={draft.errorCorrectionLevel}
              onChange={(event) =>
                updateDraft(
                  'errorCorrectionLevel',
                  event.currentTarget.value as QRCodePlaygroundDraft['errorCorrectionLevel'],
                )
              }>
              <option value="auto">Auto</option>
              <option value="L">L</option>
              <option value="M">M</option>
              <option value="Q">Q</option>
              <option value="H">H</option>
            </select>
          </label>

          <label className="qrcode-playground__field">
            <span>Mask</span>
            <select
              value={draft.mask}
              onChange={(event) =>
                updateDraft(
                  'mask',
                  event.currentTarget.value === 'auto'
                    ? 'auto'
                    : (Number(event.currentTarget.value) as QRCodePlaygroundDraft['mask']),
                )
              }>
              <option value="auto">Auto</option>
              {MASK_OPTIONS.map((mask) => (
                <option key={mask} value={mask}>
                  {mask}
                </option>
              ))}
            </select>
          </label>

          <NumberField
            error={snapshot.validation.fieldErrors.size}
            label="Size"
            min={1}
            value={draft.size}
            onChange={(value) => updateDraft('size', value)}
          />

          <NumberField
            error={snapshot.validation.fieldErrors.margin}
            label="Margin"
            min={0}
            value={draft.margin}
            onChange={(value) => updateDraft('margin', value)}
          />
        </div>

        <div className="qrcode-playground__color-row">
          <ColorField
            error={snapshot.validation.fieldErrors.colorDark}
            label="Dark color"
            value={draft.colorDark}
            onChange={(value) => updateDraft('colorDark', value)}
          />
          <ColorField
            error={snapshot.validation.fieldErrors.colorLight}
            label="Light color"
            value={draft.colorLight}
            onChange={(value) => updateDraft('colorLight', value)}
          />
        </div>

        {draft.output !== 'canvas' ? (
          <div className="qrcode-playground__grid">
            <label className="qrcode-playground__field">
              <span>Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => updateDraft('title', event.currentTarget.value)}
              />
            </label>
            <label className="qrcode-playground__field">
              <span>Aria label</span>
              <input
                type="text"
                value={draft.ariaLabel}
                onChange={(event) => updateDraft('ariaLabel', event.currentTarget.value)}
              />
            </label>
            <label className="qrcode-playground__field">
              <span>Alt</span>
              <input
                type="text"
                value={draft.alt}
                onChange={(event) => updateDraft('alt', event.currentTarget.value)}
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="qrcode-playground__panel" aria-labelledby="playground-code-heading">
        <div className="qrcode-playground__section-heading qrcode-playground__section-heading--inline">
          <div>
            <h2 id="playground-code-heading">Copy Code</h2>
            <p>
              {snapshot.validation.valid
                ? codePreview.lang
                : `${codePreview.lang} - invalid config`}
            </p>
          </div>
          <button className="qrcode-playground__button" type="button" onClick={copyCode}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="qrcode-playground__code" tabIndex={0}>
          <code>{codePreview.code}</code>
        </pre>
      </section>
    </div>
  );
}

function FieldGroup({children, label}: {children: React.ReactNode; label: string}) {
  return (
    <div className="qrcode-playground__field-group">
      <span>{label}</span>
      {children}
    </div>
  );
}

function SegmentedControl({
  name,
  onChange,
  options,
  value,
}: {
  name: string;
  onChange(value: string): void;
  options: Array<{label: string; value: string}>;
  value: string;
}) {
  return (
    <div className="qrcode-playground__segments">
      {options.map((option) => (
        <label key={option.value} className="qrcode-playground__segment">
          <input
            checked={value === option.value}
            name={name}
            type="radio"
            value={option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function NumberField({
  error,
  label,
  min,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  min: number;
  onChange(value: number): void;
  value: number;
}) {
  return (
    <label className="qrcode-playground__field">
      <span>{label}</span>
      <input
        min={min}
        step={1}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      {error ? <em>{error}</em> : null}
    </label>
  );
}

function ColorField({
  error,
  label,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  onChange(value: string): void;
  value: string;
}) {
  const isValidColor = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <label className="qrcode-playground__field qrcode-playground__field--color">
      <span>{label}</span>
      <span className="qrcode-playground__color-inputs">
        <input
          aria-label={`${label} picker`}
          type="color"
          value={isValidColor ? value : '#000000'}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <input
          type="text"
          value={value}
          onBlur={(event) => onChange(normalizeHexColorInput(event.currentTarget.value))}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </span>
      {error ? <em>{error}</em> : null}
    </label>
  );
}
