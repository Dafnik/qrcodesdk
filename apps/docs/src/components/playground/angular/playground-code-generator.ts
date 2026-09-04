import {
  type PlaygroundConfig,
  type PlaygroundOutput,
  type PlaygroundPreparedImage,
} from '../playground-config.ts';

export type HighlighterLang = 'angular-ts' | 'svelte' | 'tsx' | 'vue';

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
  switch (config.packageName) {
    case 'react':
      return generateReactCode(config, preparedImage);
    case 'vue':
      return generateVueCode(config, preparedImage);
    case 'svelte':
      return generateSvelteCode(config, preparedImage);
    case 'angular':
      return generateAngularCode(config, preparedImage);
  }
}

function generateSvelteCode(
  config: PlaygroundConfig,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[config.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const hasImage = preparedImage !== undefined;
  const componentImport = hasDownload
    ? `import {${meta.componentName}, type QRCodeDownloadHandle} from '@qrcodesdk/svelte';`
    : `import {${meta.componentName}} from '@qrcodesdk/svelte';`;
  const optionsTypes =
    hasImage && config.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const qrcodeRef = hasDownload ? `let qrcode: QRCodeDownloadHandle | undefined;\n` : '';
  const optionsDeclaration = hasImage
    ? `let imageSource = $state<${
        config.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
      }>();
const options: ${meta.optionsType} | undefined = $derived(
  imageSource ? ${formatOptions(config, 1, {source: 'imageSource', preparedImage})} : undefined,
);

${svelteImagePreparation(config.output)}`
    : `const options: ${meta.optionsType} = ${formatOptions(config, 1)};`;
  const downloadButton = hasDownload
    ? `  <button type="button" onclick={() => qrcode?.download('qrcodesdk')}>
    ${meta.downloadLabel}
  </button>
`
    : '';
  const imageInput = hasImage
    ? `<input type="file" accept="image/*" onchange={selectImage} />\n`
    : '';
  const bindProperty = hasDownload ? ' bind:this={qrcode}' : '';
  const component = `<${meta.componentName}${bindProperty} {data} {options} />`;
  const body = hasImage
    ? `${imageInput}{#if options}
${downloadButton}  ${component}
{/if}`
    : `${downloadButton}${component}`;

  return {
    lang: 'svelte',
    code: `<script lang="ts">
  import type {${optionsTypes}} from '${meta.optionsPackage}';
  ${componentImport}

  const data = ${quote(config.data)};
  ${qrcodeRef}${optionsDeclaration.replaceAll('\n', '\n  ')}
${hasImage ? `\n${indent(fileReaderHelper(config.output === 'svg'), 1)}` : ''}
</script>

${body}`,
  };
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

function generateVueCode(
  config: PlaygroundConfig,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[config.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const hasImage = preparedImage !== undefined;
  const vueImports = [
    ...(hasImage ? ['computed', 'shallowRef'] : []),
    ...(hasDownload ? ['ref'] : []),
  ];
  const vueImport = vueImports.length > 0 ? `import {${vueImports.join(', ')}} from 'vue';\n` : '';
  const componentImport = hasDownload
    ? `import {${meta.componentName}, type QRCodeDownloadHandle} from '@qrcodesdk/vue';`
    : `import {${meta.componentName}} from '@qrcodesdk/vue';`;
  const optionsTypes =
    hasImage && config.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const qrcodeRef = hasDownload ? `const qrcode = ref<QRCodeDownloadHandle | null>(null);\n` : '';
  const optionsDeclaration = hasImage
    ? `const imageSource = shallowRef<${
        config.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
      }>();
const options = computed<${meta.optionsType} | undefined>(() => {
  const source = imageSource.value;
  if (!source) return undefined;

  return ${formatOptions(config, 1, {source: 'source', preparedImage})};
});

${vueImagePreparation(config.output)}`
    : `const options: ${meta.optionsType} = ${formatOptions(config, 1)};`;
  const downloadButton = hasDownload
    ? `  <button type="button" @click="qrcode?.download('qrcodesdk')">
    ${meta.downloadLabel}
  </button>
`
    : '';
  const imageInput = hasImage
    ? `  <input type="file" accept="image/*" @change="selectImage" />\n`
    : '';
  const conditional = hasImage ? ' v-if="options"' : '';
  const refProperty = hasDownload ? ' ref="qrcode"' : '';

  return {
    lang: 'vue',
    code: `<script setup lang="ts">
import type {${optionsTypes}} from '${meta.optionsPackage}';
${componentImport}
${vueImport}

const data = ${quote(config.data)};
${qrcodeRef}${optionsDeclaration}
${hasImage ? `\n${fileReaderHelper(config.output === 'svg')}` : ''}
</script>

<template>
${imageInput}${downloadButton}  <${meta.componentName}${conditional}${refProperty} :data="data" :options="options" />
</template>`,
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
${indent(qrcodeTemplate, 3)}
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
  const styleEntries: string[] = [];

  if (config.moduleSize !== undefined) {
    styleEntries.push(`moduleSize: ${config.moduleSize}`);
  }

  if (config.quietZone !== undefined) {
    styleEntries.push(`quietZone: ${config.quietZone}`);
  }

  if (config.foreground !== undefined) {
    styleEntries.push(`foreground: ${quote(config.foreground)}`);
  }
  if (config.background !== undefined) {
    styleEntries.push(`background: ${quote(config.background)}`);
  }
  if (shouldIncludeShapeOptions(config.modules, 'square')) {
    styleEntries.push(`modules: ${formatShapeOptions(config.modules, depth + 2)}`);
  }
  const finderEntries: string[] = [];
  if (shouldIncludeShapeOptions(config.finder?.outer, 'square')) {
    finderEntries.push(`outer: ${formatShapeOptions(config.finder?.outer, depth + 3)}`);
  }
  if (shouldIncludeShapeOptions(config.finder?.center, 'square')) {
    finderEntries.push(`center: ${formatShapeOptions(config.finder?.center, depth + 3)}`);
  }
  if (finderEntries.length > 0) {
    styleEntries.push(`finder: ${formatObject(finderEntries, depth + 2)}`);
  }
  if (styleEntries.length > 0) {
    entries.push(`style: ${formatObject(styleEntries, depth + 1)}`);
  }

  const matrixEntries: string[] = [];
  if (config.version !== undefined) {
    matrixEntries.push(`version: ${config.version}`);
  }

  if (config.mode !== undefined) {
    matrixEntries.push(`mode: ${quote(config.mode)}`);
  }

  if (config.errorCorrectionLevel !== undefined) {
    matrixEntries.push(`errorCorrectionLevel: ${quote(config.errorCorrectionLevel)}`);
  }

  if (config.mask !== undefined) {
    matrixEntries.push(`mask: ${config.mask}`);
  }

  if (config.eci === true) {
    matrixEntries.push('eci: true');
  }
  if (matrixEntries.length > 0) entries.push(`matrix: ${formatObject(matrixEntries, depth + 1)}`);

  const accessibilityEntries: string[] = [];
  if (config.output === 'image') {
    if (config.alt) {
      accessibilityEntries.push(`alt: ${quote(config.alt)}`);
    }
  }

  if (config.ariaLabel) {
    accessibilityEntries.push(`ariaLabel: ${quote(config.ariaLabel)}`);
  }

  if (config.title) {
    accessibilityEntries.push(`title: ${quote(config.title)}`);
  }
  if (accessibilityEntries.length > 0) {
    entries.push(`accessibility: ${formatObject(accessibilityEntries, depth + 1)}`);
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

function vueImagePreparation(output: PlaygroundOutput): string {
  const preparedSource =
    output === 'svg'
      ? `  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  imageSource.value = dataUrl;`
      : `  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  imageSource.value = image;`;

  return `async function selectImage(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const dataUrl = await readFileAsDataURL(file);
${preparedSource}
}`;
}

function svelteImagePreparation(output: PlaygroundOutput): string {
  const preparedSource =
    output === 'svg'
      ? `  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  imageSource = dataUrl;`
      : `  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  imageSource = image;`;

  return `async function selectImage(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
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

function shouldIncludeShapeOptions(
  options:
    | {
        readonly shape?: string;
        color?: string;
      }
    | undefined,
  defaultType: string,
): boolean {
  if (options === undefined) {
    return false;
  }

  return (
    options.color !== undefined || (options.shape !== undefined && options.shape !== defaultType)
  );
}

function formatShapeOptions(
  options:
    | {
        readonly shape?: string;
        color?: string;
      }
    | undefined,
  depth: number,
): string {
  const entries: string[] = [];

  if (options?.shape !== undefined) {
    entries.push(`shape: ${quote(options.shape)}`);
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
