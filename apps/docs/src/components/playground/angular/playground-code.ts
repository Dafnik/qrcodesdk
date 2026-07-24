import {TitleCasePipe} from '@angular/common';
import {Component, DestroyRef, computed, inject, resource, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';

import {NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideCheck, lucideCopy} from '@ng-icons/lucide';
import {HlmButton} from '@spartan-ng/helm/button';

import {type PlaygroundConfig, type PlaygroundOutput, qrConfig} from '../playground-config.ts';
import {createCodeHighlighter} from './code-highlighter.ts';

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

@Component({
  host: {
    class: 'playground-code-snippet block',
  },
  template: `
    <div class="border-border bg-card text-card-foreground overflow-hidden rounded-md border">
      <div
        class="border-border bg-muted/40 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-3 py-2">
        @let packageName = currentConfig().packageName | titlecase;
        <h6 class="text-foreground text-sm font-semibold">
          {{ packageName | titlecase }}
        </h6>
        <button
          [attr.aria-label]="'Copy ' + packageName + ' code'"
          [attr.data-copied]="copied()"
          [title]="'Copy ' + packageName + ' code'"
          (click)="copyCode()"
          hlmBtn
          variant="outline"
          size="icon-sm"
          type="button">
          <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideCopy'" />
        </button>
      </div>

      @if (highlightedCode(); as highlighted) {
        <div [innerHTML]="highlighted"></div>
      } @else {
        <pre
          class="bg-muted/20 text-foreground m-0 max-h-96 overflow-auto p-4 text-sm leading-relaxed"><code>{{ preview().code }}</code></pre>
      }
    </div>
  `,
  providers: [provideIcons({lucideCheck, lucideCopy})],
  imports: [HlmButton, NgIcon, TitleCasePipe],
  selector: 'playground-code',
})
export class PlaygroundCode {
  private readonly destroyRef = inject(DestroyRef);
  private readonly nanostores = inject(NanostoresService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly codeHighlighter = resource({
    loader: createCodeHighlighter,
  });

  protected readonly currentConfig = toSignal(this.nanostores.useStore(qrConfig), {
    requireSync: true,
  });

  protected readonly preview = computed(() => generatePlaygroundCode(this.currentConfig()));
  protected readonly highlightedCode = computed(() => {
    const preview = this.preview();

    const codeHighlighter = this.codeHighlighter.value();

    if (!codeHighlighter) {
      return undefined;
    }

    const highlighted = codeHighlighter.codeToHtml(preview.code, {
      lang: preview.lang,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    });

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  });

  protected readonly copied = signal(false);

  private copyResetTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyResetTimeout) {
        clearTimeout(this.copyResetTimeout);
      }
    });
  }

  protected async copyCode(): Promise<void> {
    await navigator.clipboard?.writeText(this.preview().code);
    this.copied.set(true);

    if (this.copyResetTimeout) {
      clearTimeout(this.copyResetTimeout);
    }

    this.copyResetTimeout = setTimeout(() => {
      this.copied.set(false);
      this.copyResetTimeout = undefined;
    }, 2000);
  }
}

function generatePlaygroundCode(config: PlaygroundConfig): CodePreview {
  return config.packageName === 'react' ? generateReactCode(config) : generateAngularCode(config);
}

function generateReactCode(config: PlaygroundConfig): CodePreview {
  const meta = META_BY_OUTPUT[config.output];
  const hasDownload = meta.downloadLabel !== undefined;

  const reactImport = hasDownload ? `import {useRef} from 'react';\n\n` : '';

  const componentImport = hasDownload
    ? `import {${meta.componentName}, type QRCodeDownloadHandle} from '@qrcodesdk/react';`
    : `import {${meta.componentName}} from '@qrcodesdk/react';`;

  const imports =
    `${reactImport}` +
    `import type {${meta.optionsType}} from '${meta.optionsPackage}';\n` +
    componentImport;

  const refDeclaration = hasDownload
    ? `  const qrcode = useRef<QRCodeDownloadHandle>(null);\n\n`
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

  return {
    lang: 'tsx',

    code: `${imports}

export function QRCodeExample() {
  const data = ${quote(config.value)};

${refDeclaration}  const options: ${meta.optionsType} = ${formatOptions(config, 2)};

  return (
${body}
  );
}
`,
  };
}

function generateAngularCode(config: PlaygroundConfig): CodePreview {
  const meta = META_BY_OUTPUT[config.output];
  const hasDownload = meta.downloadLabel !== undefined;

  const downloadButton = hasDownload
    ? `    <button type="button" (click)="qrcode.download('qrcodesdk')">
      ${meta.downloadLabel}
    </button>
`
    : '';

  const template = hasDownload
    ? `${downloadButton}    <${meta.selector}
      #qrcode
      [data]="data"
      [options]="options"
    />`
    : `    <${meta.selector}
      [data]="data"
      [options]="options"
    />`;

  return {
    lang: 'angular-ts',

    code: `import {Component} from '@angular/core';

import {${meta.componentName}} from '@qrcodesdk/angular';
import type {${meta.optionsType}} from '${meta.optionsPackage}';

@Component({
  selector: 'qrcode-app-example',
  imports: [${meta.componentName}],
  template: \`
${template}
  \`,
})
export class QRCodeExample {
  readonly data = ${quote(config.value)};

  readonly options: ${meta.optionsType} = ${formatOptions(config, 2)};
}
`,
  };
}

function formatOptions(config: PlaygroundConfig, depth: number): string {
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

  return formatObject(entries, depth);
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
