import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideArrowLeft, lucideMoon, lucideSun} from '@ng-icons/lucide';
import {HlmButton} from '@spartan-ng/helm/button';
import {provideSpartanHlm} from '@spartan-ng/helm/utils';

import {ResultsView} from './results/results-view';
import {SelectionPanel} from './selection/selection-panel';

/** The key Starlight stores its theme under, so the dev tools and the docs share one theme. */
const THEME_KEY = 'starlight-theme';

function prefersDark(document: Document): boolean {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored === 'dark';
  return document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * Renders the `@repo/core-testing` fixtures with the `@qrcodesdk/angular` components.
 * Mounted client-only by `src/pages/devtools.astro`.
 */
@Component({
  selector: 'dev-tools',
  imports: [SelectionPanel, ResultsView, HlmButton, NgIcon],
  providers: [provideIcons({lucideArrowLeft, lucideMoon, lucideSun})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-border flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <a hlmBtn href="/" size="sm" variant="ghost">
        <ng-icon name="lucideArrowLeft" />
        Docs
      </a>
      <h1 class="text-sm font-semibold">QRCodeSDK Dev Tools</h1>
      <span class="text-muted-foreground text-xs">
        &#64;repo/core-testing fixtures rendered with &#64;qrcodesdk/angular
      </span>
      <button
        class="ms-auto"
        [attr.aria-label]="dark() ? 'Use light theme' : 'Use dark theme'"
        (click)="dark.set(!dark())"
        hlmBtn
        size="icon-sm"
        variant="ghost">
        <ng-icon [name]="dark() ? 'lucideSun' : 'lucideMoon'" />
      </button>
    </header>
    <div class="flex min-h-0 flex-1">
      <app-selection-panel class="border-border w-80 shrink-0 border-e" />
      <app-results-view />
    </div>
  `,
})
export class DevTools {
  static clientProviders = [provideSpartanHlm()];

  private readonly document = inject(DOCUMENT);

  protected readonly dark = signal(prefersDark(this.document));

  constructor() {
    effect(() => {
      const theme = this.dark() ? 'dark' : 'light';
      this.document.documentElement.dataset['theme'] = theme;
      localStorage.setItem(THEME_KEY, theme);
    });
  }
}
