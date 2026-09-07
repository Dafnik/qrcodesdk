import {
  type PlaygroundOptions,
  type PlaygroundOutput,
  type PlaygroundPreparedImage,
} from '../playground-options.ts';

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
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  switch (playgroundOptionsValue.packageName) {
    case 'react':
      return generateReactCode(playgroundOptionsValue, preparedImage);
    case 'vue':
      return generateVueCode(playgroundOptionsValue, preparedImage);
    case 'svelte':
      return generateSvelteCode(playgroundOptionsValue, preparedImage);
    case 'angular':
      return generateAngularCode(playgroundOptionsValue, preparedImage);
  }
}

function generateSvelteCode(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[playgroundOptionsValue.output];
  const hasDownload = meta.downloadLabel !== undefined;
  const hasImage = preparedImage !== undefined;
  const componentImport = hasDownload
    ? `import {${meta.componentName}, type QRCodeDownloadHandle} from '@qrcodesdk/svelte';`
    : `import {${meta.componentName}} from '@qrcodesdk/svelte';`;
  const optionsTypes =
    hasImage && playgroundOptionsValue.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const qrcodeRef = hasDownload ? `let qrcode: QRCodeDownloadHandle | undefined;\n` : '';
  const optionsDeclaration = hasImage
    ? `let imageSource = $state<${
        playgroundOptionsValue.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
      }>();
const options: ${meta.optionsType} | undefined = $derived(
  imageSource ? ${formatOptions(playgroundOptionsValue, 1, {source: 'imageSource', preparedImage})} : undefined,
);

${svelteImagePreparation(playgroundOptionsValue.output)}`
    : `const options: ${meta.optionsType} = ${formatOptions(playgroundOptionsValue, 1)};`;
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
  const component = `<${meta.componentName}${bindProperty} {payload} {options} />`;
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

  const payload = ${quote(playgroundOptionsValue.payload)};
  ${qrcodeRef}${optionsDeclaration.replaceAll('\n', '\n  ')}
${hasImage ? `\n${indent(fileReaderHelper(playgroundOptionsValue.output === 'svg'), 1)}` : ''}
</script>

${body}`,
  };
}

function generateReactCode(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[playgroundOptionsValue.output];
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
    hasImage && playgroundOptionsValue.output === 'svg'
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
        playgroundOptionsValue.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
      }>();\n\n${reactImagePreparation(playgroundOptionsValue.output)}

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
        `      <${meta.componentName}${refProperty} payload={payload} options={options} />`,
        `    </>`,
      ].join('\n')
    : `    <${meta.componentName} payload={payload} options={options} />`;
  const imageInput = hasImage
    ? `      <input type="file" accept="image/*" onChange={selectImage} />\n`
    : '';

  return {
    lang: 'tsx',

    code: `${imports}

export function QRCodeExample() {
  const payload = ${quote(playgroundOptionsValue.payload)};

${refDeclaration}${imageDeclaration}  const options: ${meta.optionsType} = ${formatOptions(
      playgroundOptionsValue,
      2,
      preparedImage ? {source: 'imageSource', preparedImage} : undefined,
    )};

  return (
${hasImage ? `    <>\n${imageInput}${indent(body, 2)}\n    </>` : body}
  );
}
${hasImage ? `\n${fileReaderHelper(playgroundOptionsValue.output === 'svg')}` : ''}`,
  };
}

function generateVueCode(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[playgroundOptionsValue.output];
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
    hasImage && playgroundOptionsValue.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const qrcodeRef = hasDownload ? `const qrcode = ref<QRCodeDownloadHandle | null>(null);\n` : '';
  const optionsDeclaration = hasImage
    ? `const imageSource = shallowRef<${
        playgroundOptionsValue.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
      }>();
const options = computed<${meta.optionsType} | undefined>(() => {
  const source = imageSource.value;
  if (!source) return undefined;

  return ${formatOptions(playgroundOptionsValue, 1, {source: 'source', preparedImage})};
});

${vueImagePreparation(playgroundOptionsValue.output)}`
    : `const options: ${meta.optionsType} = ${formatOptions(playgroundOptionsValue, 1)};`;
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

const payload = ${quote(playgroundOptionsValue.payload)};
${qrcodeRef}${optionsDeclaration}
${hasImage ? `\n${fileReaderHelper(playgroundOptionsValue.output === 'svg')}` : ''}
</script>

<template>
${imageInput}${downloadButton}  <${meta.componentName}${conditional}${refProperty} :payload="payload" :options="options" />
</template>`,
  };
}

function generateAngularCode(
  playgroundOptionsValue: PlaygroundOptions,
  preparedImage?: PlaygroundPreparedImage,
): CodePreview {
  const meta = META_BY_OUTPUT[playgroundOptionsValue.output];
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
      [payload]="payload"
      [options]="options"
    />`
    : `    <${meta.selector}
      [payload]="payload"
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
    hasImage && playgroundOptionsValue.output === 'svg'
      ? `QRCodeDataImageURL, ${meta.optionsType}`
      : meta.optionsType;
  const imageMembers = hasImage
    ? `
  readonly imageSource = signal<${
    playgroundOptionsValue.output === 'svg' ? 'QRCodeDataImageURL' : 'HTMLImageElement'
  }>();
  readonly options = computed<${meta.optionsType} | undefined>(() => {
    const source = this.imageSource();
    if (!source) return undefined;

    return ${formatOptions(playgroundOptionsValue, 2, {source: 'source', preparedImage})};
  });

${indent(angularImagePreparation(playgroundOptionsValue.output), 1)}
`
    : `
  readonly options: ${meta.optionsType} = ${formatOptions(playgroundOptionsValue, 2)};
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
  readonly payload = ${quote(playgroundOptionsValue.payload)};
${imageMembers}
}
${hasImage ? `\n${fileReaderHelper(playgroundOptionsValue.output === 'svg')}` : ''}`,
  };
}

function formatOptions(
  playgroundOptionsValue: PlaygroundOptions,
  depth: number,
  image?: {source: string; preparedImage: PlaygroundPreparedImage},
): string {
  const entries: string[] = [];
  const styleEntries: string[] = [];

  if (playgroundOptionsValue.moduleSize !== undefined) {
    styleEntries.push(`moduleSize: ${playgroundOptionsValue.moduleSize}`);
  }

  if (playgroundOptionsValue.quietZone !== undefined) {
    styleEntries.push(`quietZone: ${playgroundOptionsValue.quietZone}`);
  }

  if (playgroundOptionsValue.foreground !== undefined) {
    styleEntries.push(`foreground: ${quote(playgroundOptionsValue.foreground)}`);
  }
  if (playgroundOptionsValue.background !== undefined) {
    styleEntries.push(`background: ${quote(playgroundOptionsValue.background)}`);
  }
  if (shouldIncludeShapeOptions(playgroundOptionsValue.modules, 'square')) {
    styleEntries.push(`modules: ${formatShapeOptions(playgroundOptionsValue.modules, depth + 2)}`);
  }
  const finderEntries: string[] = [];
  if (shouldIncludeShapeOptions(playgroundOptionsValue.finder?.outer, 'square')) {
    finderEntries.push(
      `outer: ${formatShapeOptions(playgroundOptionsValue.finder?.outer, depth + 3)}`,
    );
  }
  if (shouldIncludeShapeOptions(playgroundOptionsValue.finder?.center, 'square')) {
    finderEntries.push(
      `center: ${formatShapeOptions(playgroundOptionsValue.finder?.center, depth + 3)}`,
    );
  }
  if (finderEntries.length > 0) {
    styleEntries.push(`finder: ${formatObject(finderEntries, depth + 2)}`);
  }
  if (styleEntries.length > 0) {
    entries.push(`style: ${formatObject(styleEntries, depth + 1)}`);
  }

  const matrixEntries: string[] = [];
  if (playgroundOptionsValue.version !== undefined) {
    matrixEntries.push(`version: ${playgroundOptionsValue.version}`);
  }

  if (playgroundOptionsValue.mode !== undefined) {
    matrixEntries.push(`mode: ${quote(playgroundOptionsValue.mode)}`);
  }

  if (playgroundOptionsValue.errorCorrectionLevel !== undefined) {
    matrixEntries.push(
      `errorCorrectionLevel: ${quote(playgroundOptionsValue.errorCorrectionLevel)}`,
    );
  }

  if (playgroundOptionsValue.mask !== undefined) {
    matrixEntries.push(`mask: ${playgroundOptionsValue.mask}`);
  }

  if (playgroundOptionsValue.eci === true) {
    matrixEntries.push('eci: true');
  }
  if (matrixEntries.length > 0) entries.push(`matrix: ${formatObject(matrixEntries, depth + 1)}`);

  const accessibilityEntries: string[] = [];
  if (playgroundOptionsValue.output === 'image') {
    if (playgroundOptionsValue.alt) {
      accessibilityEntries.push(`alt: ${quote(playgroundOptionsValue.alt)}`);
    }
  }

  if (playgroundOptionsValue.ariaLabel) {
    accessibilityEntries.push(`ariaLabel: ${quote(playgroundOptionsValue.ariaLabel)}`);
  }

  if (playgroundOptionsValue.title) {
    accessibilityEntries.push(`title: ${quote(playgroundOptionsValue.title)}`);
  }
  if (accessibilityEntries.length > 0) {
    entries.push(`accessibility: ${formatObject(accessibilityEntries, depth + 1)}`);
  }

  if (image) {
    entries.push(
      `centerImage: ${formatObject(
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
