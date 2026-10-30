import {NgTemplateOutlet} from '@angular/common';
import {Component, computed, inject, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {NanostoresService} from '@nanostores/angular';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideDices} from '@ng-icons/lucide';
import {simpleSignal, simpleTelegram, simpleWhatsapp} from '@ng-icons/simple-icons';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmSelectImports} from '@spartan-ng/helm/select';

import {cliPlaygroundOptions} from '../cli-playground.ts';
import {playgroundOptions} from '../playground-options.ts';
import {
  type PlaygroundPreset,
  applyCliPreset,
  applyQrPreset,
  cliPlaygroundPresets,
  findCliPreset,
  findQrPreset,
  pickRandomPreset,
  playgroundPresets,
} from '../playground-presets.ts';

@Component({
  selector: 'playground-preset-controls',
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmFieldImports,
    HlmSelectImports,
    NgIcon,
    NgTemplateOutlet,
  ],
  providers: [provideIcons({lucideDices, simpleSignal, simpleTelegram, simpleWhatsapp})],
  template: `
    <div hlmField>
      <label [for]="idPrefix() + 'preset'" hlmFieldLabel>Style preset</label>
      <div class="flex items-center gap-2">
        <hlm-select
          class="min-w-0 flex-1"
          [disabled]="disabled()"
          [ngModel]="activePreset()?.id"
          (ngModelChange)="applyPreset($event)">
          <hlm-select-trigger class="w-full" [buttonId]="idPrefix() + 'preset'">
            <span class="flex items-center gap-2" *hlmSelectValueTemplate="let value">
              <ng-container
                [ngTemplateOutlet]="presetOption"
                [ngTemplateOutletContext]="{$implicit: activePreset()}" />
            </span>
            @if (!activePreset()) {
              <span class="text-muted-foreground">Custom preset</span>
            }
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            @for (group of groups(); track group.label) {
              <hlm-select-group>
                <hlm-select-label>{{ group.label }}</hlm-select-label>
                @for (preset of group.presets; track preset.id) {
                  <hlm-select-item [value]="preset.id">
                    <ng-container
                      [ngTemplateOutlet]="presetOption"
                      [ngTemplateOutletContext]="{$implicit: preset}" />
                  </hlm-select-item>
                }
              </hlm-select-group>
            }
          </hlm-select-content>
        </hlm-select>

        <button
          [disabled]="disabled()"
          (click)="applyRandomPreset()"
          title="Random preset"
          type="button"
          hlmBtn
          variant="outline"
          size="icon"
          aria-label="Random preset">
          <ng-icon name="lucideDices" />
        </button>
      </div>
    </div>

    <ng-template #presetOption let-preset>
      @if (appLogos[preset.id]; as logo) {
        <ng-icon [name]="logo.icon" [color]="logo.color" size="14px" aria-hidden="true" />
      }
      {{ preset.label }}
    </ng-template>
  `,
})
export class PlaygroundPresetControls {
  public readonly disabled = input(false);
  public readonly idPrefix = input('');

  private readonly nanostores = inject(NanostoresService);
  private readonly options = toSignal(this.nanostores.useStore(playgroundOptions), {
    requireSync: true,
  });
  private readonly cliOptions = toSignal(this.nanostores.useStore(cliPlaygroundOptions), {
    requireSync: true,
  });
  protected readonly appLogos: Record<string, {icon: string; color: string}> = {
    whatsapp: {icon: 'simpleWhatsapp', color: '#25D366'},
    telegram: {icon: 'simpleTelegram', color: '#26A5E4'},
    signal: {icon: 'simpleSignal', color: '#3A76F0'},
  };
  private readonly isCli = computed(() => this.options().packageName === 'cli');

  protected readonly activePreset = computed(() =>
    this.isCli() ? findCliPreset(this.cliOptions()) : findQrPreset(this.options()),
  );
  protected readonly groups = computed(() => {
    const presets = this.isCli() ? cliPlaygroundPresets : playgroundPresets;
    return [
      {label: 'Styles', presets: presets.filter(({group}) => group === 'style')},
      {label: 'Apps', presets: presets.filter(({group}) => group === 'app')},
    ] satisfies {label: string; presets: PlaygroundPreset[]}[];
  });

  protected applyPreset(id: string | undefined): void {
    if (!id || id === this.activePreset()?.id) return;
    if (this.isCli()) applyCliPreset(id);
    else applyQrPreset(id);
  }

  protected applyRandomPreset(): void {
    const presets = this.isCli() ? cliPlaygroundPresets : playgroundPresets;
    const preset = pickRandomPreset(presets, this.activePreset()?.id);
    if (preset) this.applyPreset(preset.id);
  }
}
