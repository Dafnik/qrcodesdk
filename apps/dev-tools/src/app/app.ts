import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideMoon, lucideSun} from '@ng-icons/lucide';
import {HlmButton} from '@spartan-ng/helm/button';

import {ResultsView} from './results/results-view';
import {SelectionPanel} from './selection/selection-panel';

const THEME_KEY = 'qrcodesdk-dev-tools-theme';

@Component({
  selector: 'app-root',
  imports: [SelectionPanel, ResultsView, HlmButton, NgIcon],
  providers: [provideIcons({lucideMoon, lucideSun})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'flex h-dvh flex-col'},
  template: `
    <header class="border-border flex h-12 shrink-0 items-center gap-3 border-b px-4">
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
export class App {
  private readonly document = inject(DOCUMENT);

  protected readonly dark = signal(
    localStorage.getItem(THEME_KEY) === 'dark' ||
      (localStorage.getItem(THEME_KEY) === null &&
        matchMedia('(prefers-color-scheme: dark)').matches),
  );

  constructor() {
    effect(() => {
      const dark = this.dark();
      this.document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    });
  }
}
