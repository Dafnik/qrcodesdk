import {
  type PlaygroundConfig,
  type PlaygroundOutput,
  type PlaygroundPreparedImage,
} from '../playground-config.ts';

export type HighlighterLang = 'angular-ts' | 'tsx';

export type CodePreview = {
  code: string;
  lang: HighlighterLang;
};

type ComponentMeta = {
  componentName: string;
  optionsPackage: '@qrcodesdk/browser' | '@qrcodesdk/core';
  optionsType: string;
  selector: string;
  downloadLabel?: string;
};

const META_BY_OUTPUT: Record<PlaygroundOutput, ComponentMeta> = {
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

export function generatePlaygroundCode(
  config: PlaygroundConfig,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  return config.packageName === 'react'
    ? generateReactCode(config, preparedImage)
    : generateAngularCode(config, preparedImage);
}

function generateReactCode(
  config: PlaygroundConfig,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[config.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const hasImage = preparedImage !== undefined;

  const reactImports = [
    ...(hasImage ? ['type ChangeEvent', 'useState'] : []),
    ...(hasDownload ? ['useRef'] : []),
  ];
  const reactImport =
    reactImports.length > 0 ? `import {${reactImports.join(', ')}} from 'react';\n\n` : '';

  const componentImport = hasDownload
    ? `import {${meta.componentName}, type QRCodeDownloadHandle} from '@qrcodesdk/react';`
    : `import {${meta.componentName}} from '@qrcodesdk/react';`;

  const optionsTypes =
    hasImage && config.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const imports =
    `${reactImport}` +
    `import type {${optionsTypes}} from '${meta.optionsPackage}';\n` +
    componentImport;

  const refDeclaration = hasDownload
    ? `  const qrcode = useRef<QRCodeDownloadHandle>(null);\n\n`
    : '';
  const imageDeclaration = hasImage
    ? `  const [imageSource, setImageSource] = useState<${
        config.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
      }>();\n\n${reactImagePreparation(config.output)}

  if (!imageSource) {
    return <input type="file" accept="image/*" onChange={selectImage} />;
  }

`
    : '';

  const refProperty = hasDownload ? ' ref={qrcode}' : '';

  const downloadButton = hasDownload
    ? [
        `      <button`,
        `        type="button"`,
        `        onClick={() => qrcode.current?.download('qrcodesdk')}`,
        `      >`,
        `        ${meta.downloadLabel}`,
        `      </button>`,
        '',
      ].join('\n')
    : '';

  const body = hasDownload
    ? [
        `    <>`,
        downloadButton,
        `      <${meta.componentName}${refProperty} data={data} options={options} />`,
        `    </>`,
      ].join('\n')
    : `    <${meta.componentName} data={data} options={options} />`;
  const imageInput = hasImage
    ? `      <input type="file" accept="image/*" onChange={selectImage} />\n`
    : '';

  return {
    lang: 'tsx',

    code: `${imports}

export function QRCodeExample() {
  const data = ${quote(config.data)};

${refDeclaration}${imageDeclaration}  const options: ${meta.optionsType} = ${formatOptions(
      config,
      2,
      preparedImage ? {source: 'imageSource', preparedImage} : undefined,
    )};

  return (
${hasImage ? `    <>\n${imageInput}${indent(body, 2)}\n    </>` : body}
  );
}
${hasImage ? `\n${fileReaderHelper(config.output === 'svg')}` : ''}`,
  };
}

function generateAngularCode(
  config: PlaygroundConfig,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[config.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const hasImage = preparedImage !== undefined;

  const downloadButton = hasDownload
    ? `    <button type="button" (click)="qrcode.download('qrcodesdk')">
      ${meta.downloadLabel}
    </button>
`
    : '';

  const qrcodeTemplate = hasDownload
    ? `${downloadButton}    <${meta.selector}
      #qrcode
      [data]="data"
      [options]="options"
    />`
    : `    <${meta.selector}
      [data]="data"
      [options]="options"
    />`;
  const template = hasImage
    ? `    <input type="file" accept="image/*" (change)="selectImage($event)" />
    @if (options(); as options) {
${indent(qrcodeTemplate.replaceAll('[options]="options"', '[options]="options"'), 3)}
    }`
    : qrcodeTemplate;
  const angularImports = hasImage ? 'Component, computed, signal' : 'Component';
  const optionsTypes =
    hasImage && config.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const imageMembers = hasImage
    ? `
  readonly imageSource = signal<${
    config.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
  }>();
  readonly options = computed<${meta.optionsType} | undefined>(() => {
    const source = this.imageSource();
    if (!source) return undefined;

    return ${formatOptions(config, 2, {source: 'source', preparedImage})};
  });

${indent(angularImagePreparation(config.output), 1)}
`
    : `
  readonly options: ${meta.optionsType} = ${formatOptions(config, 2)};
`;

  return {
    lang: 'angular-ts',

    code: `import {${angularImports}} from '@angular/core';

import {${meta.componentName}} from '@qrcodesdk/angular';
import type {${optionsTypes}} from '${meta.optionsPackage}';

@Component({
  selector: 'qrcode-app-example',
  imports: [${meta.componentName}],
  template: \`
${template}
  \`,
})
export class QRCodeExample {
  readonly data = ${quote(config.data)};
${imageMembers}
}
${hasImage ? `\n${fileReaderHelper(config.output === 'svg')}` : ''}`,
  };
}

function formatOptions(
  config: PlaygroundConfig,
  depth: number,
  image?: {source: string; preparedImage: PlaygroundPreparedImage},
): string {
  const entries: string[] = [];

  if (config.size !== undefined) {
    entries.push(`size: ${config.size}`);
  }

  if (config.margin !== undefined) {
    entries.push(`margin: ${config.margin}`);
  }

  if (config.colors !== undefined) {
    const colorEntries: string[] = [];

    if (config.colors.colorDark !== undefined) {
      colorEntries.push(`colorDark: ${quote(config.colors.colorDark)}`);
    }

    if (config.colors.colorLight !== undefined) {
      colorEntries.push(`colorLight: ${quote(config.colors.colorLight)}`);
    }

    if (colorEntries.length > 0) {
      entries.push(`colors: ${formatObject(colorEntries, depth + 1)}`);
    }
  }

  if (shouldIncludeStyleOptions(config.dotsOptions, 'square')) {
    entries.push(`dotsOptions: ${formatStyleOptions(config.dotsOptions, depth + 1)}`);
  }

  if (shouldIncludeStyleOptions(config.cornersSquareOptions, 'square')) {
    entries.push(
      `cornersSquareOptions: ${formatStyleOptions(config.cornersSquareOptions, depth + 1)}`,
    );
  }

  if (shouldIncludeStyleOptions(config.cornersDotOptions, 'square')) {
    entries.push(`cornersDotOptions: ${formatStyleOptions(config.cornersDotOptions, depth + 1)}`);
  }

  if (config.version !== undefined) {
    entries.push(`version: ${config.version}`);
  }

  if (config.mode !== undefined) {
    entries.push(`mode: ${quote(config.mode)}`);
  }

  if (config.errorCorrectionLevel !== undefined) {
    entries.push(`errorCorrectionLevel: ${quote(config.errorCorrectionLevel)}`);
  }

  if (config.mask !== undefined) {
    entries.push(`mask: ${config.mask}`);
  }

  if (config.output !== 'canvas') {
    if (config.alt) {
      entries.push(`alt: ${quote(config.alt)}`);
    }

    if (config.ariaLabel) {
      entries.push(`ariaLabel: ${quote(config.ariaLabel)}`);
    }

    if (config.title) {
      entries.push(`title: ${quote(config.title)}`);
    }
  }

  if (image) {
    entries.push(
      `image: ${formatObject(
        [
          `source: ${image.source}`,
          `size: ${image.preparedImage.size}`,
          `padding: ${image.preparedImage.padding}`,
          `clearBackground: ${image.preparedImage.clearBackground}`,
        ],
        depth + 1,
      )}`,
    );
  }

  return formatObject(entries, depth);
}

function reactImagePreparation(output: PlaygroundOutput): string {
  const preparedSource =
    output === 'svg'
      ? `    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    setImageSource(dataUrl);`
      : `    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    setImageSource(image);`;

  return `  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataURL(file);
${preparedSource}
  }`;
}

function angularImagePreparation(output: PlaygroundOutput): string {
  const preparedSource =
    output === 'svg'
      ? `  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  this.imageSource.set(dataUrl);`
      : `  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  this.imageSource.set(image);`;

  return `async selectImage(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const dataUrl = await readFileAsDataURL(file);
${preparedSource}
}`;
}

function fileReaderHelper(typedDataUrl: boolean): string {
  const returnType = typedDataUrl ? 'QRCodeDataImageURL' : 'string';
  const result = typedDataUrl ? 'reader.result as QRCodeDataImageURL' : 'reader.result';

  return `function readFileAsDataURL(file: File): Promise<${returnType}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') resolve(${result});
      else reject(new Error('Image preparation failed'));
    });
    reader.addEventListener('error', () => reject(new Error('Image preparation failed')));
    reader.readAsDataURL(file);
  });
}`;
}

function indent(value: string, depth: number): string {
  const indentation = '  '.repeat(depth);
  return value
    .split('\n')
    .map((line) => `${indentation}${line}`)
    .join('\n');
}

function shouldIncludeStyleOptions(
  options:
    | {
        type?: string;
        color?: string;
      }
    | undefined,
  defaultType: string,
): boolean {
  if (options === undefined) {
    return false;
  }

  return (
    options.color !== undefined || (options.type !== undefined && options.type !== defaultType)
  );
}

function formatStyleOptions(
  options:
    | {
        type?: string;
        color?: string;
      }
    | undefined,
  depth: number,
): string {
  const entries: string[] = [];

  if (options?.type !== undefined) {
    entries.push(`type: ${quote(options.type)}`);
  }

  if (options?.color !== undefined) {
    entries.push(`color: ${quote(options.color)}`);
  }

  return formatObject(entries, depth);
}

function formatObject(entries: string[], depth: number): string {
  if (entries.length === 0) {
    return '{}';
  }

  const indentation = '  '.repeat(depth);
  const closingIndentation = '  '.repeat(Math.max(0, depth - 1));

  return `{
${entries.map((entry) => `${indentation}${entry},`).join('\n')}
${closingIndentation}}`;
}

function quote(value: string): string {
  return JSON.stringify(value);
}
