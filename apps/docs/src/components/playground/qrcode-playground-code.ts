import type {QRCodePlaygroundDraft, QRCodePlaygroundOutput} from './qrcode-playground-types';

type CodePreview = {
  code: string;
  lang: 'angular-ts' | 'tsx';
};

type ComponentMeta = {
  componentName: string;
  optionsPackage: '@qrcodesdk/browser' | '@qrcodesdk/core';
  optionsType: string;
  selector: string;
  downloadLabel?: string;
};

const META_BY_OUTPUT: Record<QRCodePlaygroundOutput, ComponentMeta> = {
  svg: {
    componentName: 'QRCodeSVG',
    optionsPackage: '@qrcodesdk/core',
    optionsType: 'QRCodeSVGOptions',
    selector: 'qrcode-svg',
    downloadLabel: 'Download SVG',
  },
  image: {
    componentName: 'QRCodeImage',
    optionsPackage: '@qrcodesdk/browser',
    optionsType: 'QRCodeImageOptions',
    selector: 'qrcode-image',
    downloadLabel: 'Download PNG',
  },
  canvas: {
    componentName: 'QRCodeCanvas',
    optionsPackage: '@qrcodesdk/browser',
    optionsType: 'QRCodeCanvasOptions',
    selector: 'qrcode-canvas',
  },
};

export function generatePlaygroundCode(draft: QRCodePlaygroundDraft): CodePreview {
  return draft.packageName === 'react' ? generateReactCode(draft) : generateAngularCode(draft);
}

function generateReactCode(draft: QRCodePlaygroundDraft): CodePreview {
  const meta = META_BY_OUTPUT[draft.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const componentImport = hasDownload
    ? `import {${meta.componentName}, type QRCodeDownloadHandle} from '@qrcodesdk/react';`
    : `import {${meta.componentName}} from '@qrcodesdk/react';`;
  const imports = `${hasDownload ? "import {useRef} from 'react';\n\n" : ''}import type {${meta.optionsType}} from '${meta.optionsPackage}';\n${componentImport}`;
  const refLine = hasDownload ? '  const qrcode = useRef<QRCodeDownloadHandle>(null);\n\n' : '';
  const refProp = hasDownload ? ' ref={qrcode}' : '';
  const downloadButton = hasDownload
    ? `      <button type="button" onClick={() => qrcode.current?.download('qrcodesdk')}>\n        ${meta.downloadLabel}\n      </button>\n`
    : '';
  const body = hasDownload
    ? `    <>\n${downloadButton}      <${meta.componentName}${refProp} data={data} options={options} />\n    </>`
    : `    <${meta.componentName} data={data} options={options} />`;

  return {
    lang: 'tsx',
    code: `${imports}\n\nexport function QRCodeExample() {\n  const data = ${quote(draft.data)};\n${refLine}  const options: ${meta.optionsType} = ${formatOptions(draft, 2)};\n\n  return (\n${body}\n  );\n}\n`,
  };
}

function generateAngularCode(draft: QRCodePlaygroundDraft): CodePreview {
  const meta = META_BY_OUTPUT[draft.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const downloadButton = hasDownload
    ? `    <button type="button" (click)="qrcode.download('qrcodesdk')">${meta.downloadLabel}</button>\n`
    : '';
  const template = hasDownload
    ? `${downloadButton}    <${meta.selector} #qrcode [data]="data" [options]="options" />`
    : `    <${meta.selector} [data]="data" [options]="options" />`;

  return {
    lang: 'angular-ts',
    code: `import {Component} from '@angular/core';\n\nimport {${meta.componentName}} from '@qrcodesdk/angular';\nimport type {${meta.optionsType}} from '${meta.optionsPackage}';\n\n@Component({\n  selector: 'qrcode-app-example',\n  imports: [${meta.componentName}],\n  template: \`\n${template}\n  \`,\n})\nexport class QRCodeExample {\n  data = ${quote(draft.data)};\n\n  options: ${meta.optionsType} = ${formatOptions(draft, 2)};\n}\n`,
  };
}

function formatOptions(draft: QRCodePlaygroundDraft, depth: number): string {
  const entries: string[] = [
    `size: ${draft.size}`,
    `margin: ${draft.margin}`,
    `colors: ${formatObject(
      [`colorDark: ${quote(draft.colorDark)}`, `colorLight: ${quote(draft.colorLight)}`],
      depth + 1,
    )}`,
  ];

  if (draft.version !== 'auto') entries.push(`version: ${draft.version}`);
  if (draft.mode !== 'auto') entries.push(`mode: ${quote(draft.mode)}`);
  if (draft.errorCorrectionLevel !== 'auto') {
    entries.push(`errorCorrectionLevel: ${quote(draft.errorCorrectionLevel)}`);
  }
  if (draft.mask !== 'auto') entries.push(`mask: ${draft.mask}`);

  if (draft.output !== 'canvas') {
    if (draft.alt) entries.push(`alt: ${quote(draft.alt)}`);
    if (draft.ariaLabel) entries.push(`ariaLabel: ${quote(draft.ariaLabel)}`);
    if (draft.title) entries.push(`title: ${quote(draft.title)}`);
  }

  return formatObject(entries, depth);
}

function formatObject(entries: string[], depth: number): string {
  const indent = '  '.repeat(depth);
  const closingIndent = '  '.repeat(depth - 1);

  return `{\n${entries.map((entry) => `${indent}${entry},`).join('\n')}\n${closingIndent}}`;
}

function quote(value: string): string {
  return JSON.stringify(value);
}
