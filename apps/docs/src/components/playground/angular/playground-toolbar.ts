import {NgTemplateOutlet} from '@angular/common';
import {Component, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NANOSTORES, NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {
  lucideBrush,
  lucideCode,
  lucideCodeXml,
  lucideImage,
  lucideScanQrCode,
  lucideSquareTerminal,
  lucideText,
} from '@ng-icons/lucide';
import {simpleAngular, simpleReact, simpleSvelte, simpleVuedotjs} from '@ng-icons/simple-icons';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmButtonGroupImports} from '@spartan-ng/helm/button-group';
import {HlmSelectImports} from '@spartan-ng/helm/select';

import {suppressInitialTransitions} from '../../angular/suppress-initial-transitions.ts';
import {
  type CliLauncher,
  type CliPlaygroundOptions,
  cliPlaygroundOptions,
  updateCliOptions,
} from '../cli-playground.ts';
import {
  type PlaygroundOutput,
  type PlaygroundPackage,
  type PlaygroundView,
  playgroundOptions,
  playgroundView,
  updateQrOptions,
} from '../playground-options.ts';

interface PlaygroundToolbarOption<T extends string> {
  value: T;
  label: string;
  icon: string;
  color?: string;
}

@Component({
  selector: 'playground-toolbar',
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmSelectImports,
    NgIcon,
    NgTemplateOutlet,
  ],
  providers: [
    {provide: NANOSTORES, useClass: NanostoresService},
    provideIcons({
      lucideBrush,
      lucideCode,
      lucideCodeXml,
      lucideImage,
      lucideScanQrCode,
      lucideSquareTerminal,
      lucideText,
      simpleAngular,
      simpleReact,
      simpleSvelte,
      simpleVuedotjs,
    }),
  ],
  host: {class: 'block min-w-0'},
  template: `
    <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Playground settings">
      <label class="sr-only" for="toolbar-package">Package</label>
      <hlm-select
        [ngModel]="options().packageName"
        (ngModelChange)="updateQrOptions({packageName: $event})">
        <hlm-select-trigger size="sm" buttonId="toolbar-package">
          <span class="flex items-center gap-1.5" *hlmSelectValueTemplate="let value">
            <ng-container
              [ngTemplateOutlet]="packageOption"
              [ngTemplateOutletContext]="{$implicit: packageByValue[value]}" />
          </span>
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-group>
            <hlm-select-label>Package</hlm-select-label>
            @for (package of packages; track package.value) {
              <hlm-select-item [value]="package.value">
                <ng-container
                  [ngTemplateOutlet]="packageOption"
                  [ngTemplateOutletContext]="{$implicit: package}" />
              </hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select>

      @if (options().packageName === 'cli') {
        <div hlmButtonGroup aria-label="Output">
          @for (output of cliOutputs; track output.value) {
            <button
              class="text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground dark:aria-pressed:bg-input/80"
              [attr.aria-pressed]="cliOptions().format === output.value"
              (click)="updateCliOptions({format: output.value})"
              type="button"
              hlmBtn
              variant="outline"
              size="sm">
              <ng-icon [name]="output.icon" />
              {{ output.label }}
            </button>
          }
          <button
            class="text-muted-foreground"
            title="PNG output requires Node APIs and is available when you run the CLI locally."
            type="button"
            hlmBtn
            variant="outline"
            size="sm"
            disabled>
            <ng-icon name="lucideImage" />
            PNG
          </button>
        </div>

        <label class="sr-only" for="toolbar-launcher">Command launcher</label>
        <hlm-select
          [ngModel]="cliOptions().launcher"
          [itemToString]="launcherLabel"
          (ngModelChange)="updateCliOptions({launcher: $event})">
          <hlm-select-trigger size="sm" buttonId="toolbar-launcher">
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              <hlm-select-label>Command launcher</hlm-select-label>
              @for (launcher of launchers; track launcher.value) {
                <hlm-select-item [value]="launcher.value">{{ launcher.label }}</hlm-select-item>
              }
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select>
      } @else {
        <div hlmButtonGroup aria-label="Output">
          @for (output of outputs; track output.value) {
            <button
              class="text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground dark:aria-pressed:bg-input/80"
              [attr.aria-pressed]="options().output === output.value"
              (click)="updateQrOptions({output: output.value})"
              type="button"
              hlmBtn
              variant="outline"
              size="sm">
              <ng-icon [name]="output.icon" />
              {{ output.label }}
            </button>
          }
        </div>
      }

      <div class="ms-auto" hlmButtonGroup aria-label="View">
        @for (view of views; track view.value) {
          <button
            class="text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground dark:aria-pressed:bg-input/80"
            [attr.aria-pressed]="currentView() === view.value"
            (click)="playgroundView.set(view.value)"
            type="button"
            hlmBtn
            variant="outline"
            size="sm">
            <ng-icon [name]="view.icon" />
            {{ view.label }}
          </button>
        }
      </div>
    </div>

    <ng-template #packageOption let-package>
      <ng-icon [name]="package.icon" [color]="package.color" size="14px" aria-hidden="true" />
      {{ package.label }}
    </ng-template>
  `,
})
export class PlaygroundToolbar {
  private readonly nanostores = inject(NanostoresService);
  protected readonly options = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });
  protected readonly cliOptions = toSignal(this.nanostores.useStore(cliPlaygroundOptions), {
    requireSync: true,
  });
  protected readonly currentView = toSignal(this.nanostores.useStore(playgroundView), {
    requireSync: true,
  });
  protected readonly playgroundView = playgroundView;
  protected readonly updateQrOptions = updateQrOptions;
  protected readonly updateCliOptions = updateCliOptions;

  protected readonly packages: PlaygroundToolbarOption<PlaygroundPackage>[] = [
    {value: 'react', label: 'React', icon: 'simpleReact', color: '#61DAFB'},
    {value: 'vue', label: 'Vue', icon: 'simpleVuedotjs', color: '#4FC08D'},
    {value: 'svelte', label: 'Svelte', icon: 'simpleSvelte', color: '#FF3E00'},
    {value: 'angular', label: 'Angular', icon: 'simpleAngular', color: '#DD0031'},
    {value: 'cli', label: 'CLI', icon: 'lucideSquareTerminal'},
  ];
  protected readonly packageByValue = Object.fromEntries(
    this.packages.map((option) => [option.value, option]),
  ) as Record<PlaygroundPackage, PlaygroundToolbarOption<PlaygroundPackage>>;
  protected readonly outputs: PlaygroundToolbarOption<PlaygroundOutput>[] = [
    {value: 'svg', label: 'SVG', icon: 'lucideCodeXml'},
    {value: 'image', label: 'PNG', icon: 'lucideImage'},
    {value: 'canvas', label: 'Canvas', icon: 'lucideBrush'},
  ];
  protected readonly cliOutputs: PlaygroundToolbarOption<CliPlaygroundOptions['format']>[] = [
    {value: 'text', label: 'Text', icon: 'lucideText'},
    {value: 'svg', label: 'SVG', icon: 'lucideCodeXml'},
  ];
  protected readonly views: PlaygroundToolbarOption<PlaygroundView>[] = [
    {value: 'preview', label: 'Preview', icon: 'lucideScanQrCode'},
    {value: 'code', label: 'Code', icon: 'lucideCode'},
  ];
  protected readonly launchers: {value: CliLauncher; label: string}[] = [
    {value: 'installed', label: 'qrc (installed)'},
    {value: 'npm', label: 'npx'},
    {value: 'pnpm', label: 'pnpm dlx'},
    {value: 'viteplus', label: 'vp dlx'},
    {value: 'bun', label: 'bunx'},
    {value: 'yarn', label: 'yarn dlx'},
  ];
  protected readonly launcherLabel = (value: CliLauncher): string =>
    this.launchers.find((launcher) => launcher.value === value)?.label ?? value;

  constructor() {
    suppressInitialTransitions();
  }
}
