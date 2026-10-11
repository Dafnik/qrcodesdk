import {Component, input, model} from '@angular/core';

import {SimColorPickerImports} from '@sim/color-picker';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmPopoverImports} from '@spartan-ng/helm/popover';

export const DARK_COLOR_PRESETS = [
  '#0A0A0A',
  '#171717',
  '#262626',
  '#404040',
  '#102a43',
  '#17365d',
  '#1f2937',
  '#4c285e',
  '#2d3748',
  '#111827',
  '#3f1d1d',
] as const;
export const LIGHT_COLOR_PRESETS = ['#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0'] as const;

@Component({
  template: `
    <hlm-popover sideOffset="8">
      <button
        class="h-10 w-full justify-start gap-3 px-3 font-mono text-xs"
        [id]="buttonId()"
        [disabled]="disabled()"
        hlmBtn
        hlmPopoverTrigger
        type="button"
        variant="outline"
        aria-label="Open color palette">
        <span class="size-5 rounded-sm border shadow-xs" [style.background]="color()"></span>
        <span class="truncate">{{ color() }}</span>
      </button>

      <div
        class="w-auto max-w-[calc(100vw-1rem)] bg-transparent p-0 shadow-none ring-0"
        *hlmPopoverPortal="let ctx">
        <sim-color-picker
          class="w-[380px] max-w-[calc(100vw-1rem)] gap-4 rounded-2xl p-5"
          [(value)]="color"
          [format]="'hex'"
          [presets]="presets()">
          <sim-color-palette />

          <sim-color-value-editor class="gap-0 [&>label]:sr-only" [showFormat]="showFormat()" />

          <sim-color-presets
            class="**:data-[slot=color-preset]:size-5 **:data-[slot=color-preset]:rounded-full"
            label="Saved" />
        </sim-color-picker>
      </div>
    </hlm-popover>
  `,
  selector: 'playground-color-input',
  imports: [HlmButtonImports, HlmPopoverImports, SimColorPickerImports],
})
export class PlaygroundColorInput {
  buttonId = input.required<string>();
  color = model<string>();
  presets = input.required<readonly string[]>();
  disabled = input<boolean>(false);
  showFormat = input(true);
}
