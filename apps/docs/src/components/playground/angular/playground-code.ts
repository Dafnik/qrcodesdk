import {TitleCasePipe} from '@angular/common';
import {Component, DestroyRef, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {DomSanitizer} from '@angular/platform-browser';

import {NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideCheck, lucideCopy} from '@ng-icons/lucide';
import {HlmButton} from '@spartan-ng/helm/button';

import {playgroundConfig, playgroundPreparedImage} from '../playground-config.ts';
import {createCodeHighlighter} from './code-highlighter.ts';
import {generatePlaygroundCode} from './playground-code-generator.ts';

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

      <div [innerHTML]="highlightedCode()"></div>
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

  protected readonly currentConfig = toSignal(this.nanostores.useStore(playgroundConfig), {
    requireSync: true,
  });
  protected readonly preparedImage = toSignal(this.nanostores.useStore(playgroundPreparedImage), {
    requireSync: true,
  });

  protected readonly preview = computed(() =>
    generatePlaygroundCode(this.currentConfig(), this.preparedImage()),
  );
  protected readonly highlightedCode = computed(() => {
    const preview = this.preview();

    const highlighted = this.codeHighlighter.codeToHtml(preview.code, {
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
