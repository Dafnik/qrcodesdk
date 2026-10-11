import {TitleCasePipe} from '@angular/common';
import {Component, DestroyRef, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';

import {NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideCheck, lucideCopy} from '@ng-icons/lucide';
import {HlmButton} from '@spartan-ng/helm/button';

import {cliPreview} from '../cli-playground.ts';
import {playgroundOptions, playgroundPreparedImage} from '../playground-options.ts';
import {createCodeHighlighter} from './code-highlighter.ts';
import {type CodePreview, generatePlaygroundCode} from './playground-code-generator.ts';

@Component({
  host: {
    class: 'playground-code-snippet block',
  },
  template: `
    <div class="border-border bg-card text-card-foreground overflow-hidden rounded-md border">
      <div
        class="border-border bg-muted/40 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-3 py-2">
        @let packageName =
          currentOptions().packageName === 'cli'
            ? 'CLI'
            : (currentOptions().packageName | titlecase);
        <h6 class="text-foreground text-sm font-semibold">
          {{ packageName }}
        </h6>
        <button
          [attr.aria-label]="copyLabel()"
          [attr.payload-copied]="copied()"
          [title]="copyLabel()"
          [disabled]="!preview()"
          (click)="copyCode()"
          hlmBtn
          variant="outline"
          size="icon-sm"
          type="button">
          <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideCopy'" />
        </button>
      </div>

      @if (preview()) {
        <div [innerHTML]="highlightedCode()"></div>
      } @else {
        <p class="text-muted-foreground p-4 text-sm">
          Fix the QR code options to generate a command.
        </p>
      }
      @if (copyError()) {
        <p class="text-destructive px-4 pb-4 text-sm" role="alert">{{ copyError() }}</p>
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

  private readonly codeHighlighter = createCodeHighlighter();

  protected readonly currentOptions = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });
  protected readonly preparedImage = toSignal(this.nanostores.useStore(playgroundPreparedImage), {
    requireSync: true,
  });
  private readonly cliResult = toSignal(this.nanostores.useStore(cliPreview), {requireSync: true});

  protected readonly preview = computed<CodePreview | undefined>(() => {
    if (this.currentOptions().packageName === 'cli') {
      const result = this.cliResult();
      return result?.state === 'ready' ? {code: result.command, lang: 'sh'} : undefined;
    }
    return generatePlaygroundCode(this.currentOptions(), this.preparedImage());
  });
  protected readonly copyLabel = computed(() =>
    this.currentOptions().packageName === 'cli'
      ? 'Copy CLI command'
      : `Copy ${this.currentOptions().packageName} code`,
  );
  protected readonly highlightedCode = computed(() => {
    const preview = this.preview();

    if (!preview) return '';

    const highlighted = this.codeHighlighter.codeToHtml(preview.code, {
      lang: preview.lang,
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-black',
      },
    });

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  });

  private readonly copiedCode = signal<string | undefined>(undefined);
  protected readonly copied = computed(
    () => this.preview() !== undefined && this.copiedCode() === this.preview()?.code,
  );
  protected readonly copyError = signal<string | undefined>(undefined);

  private copyResetTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyResetTimeout) {
        clearTimeout(this.copyResetTimeout);
      }
    });
  }

  protected async copyCode(): Promise<void> {
    const preview = this.preview();
    if (!preview) return;
    this.copyError.set(undefined);
    this.copiedCode.set(undefined);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(preview.code);
      this.copiedCode.set(preview.code);
      clearTimeout(this.copyResetTimeout);
      this.copyResetTimeout = setTimeout(() => {
        this.copiedCode.set(undefined);
        this.copyResetTimeout = undefined;
      }, 2000);
    } catch {
      this.copyError.set('Copying failed. Select and copy the snippet manually.');
    }
  }
}
