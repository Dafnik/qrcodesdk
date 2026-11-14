import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {HlmBadge} from '@spartan-ng/helm/badge';

import {type DecodeResult, type DecoderId, decoderLabel} from '../rendering/decode';

@Component({
  selector: 'app-decode-badge',
  imports: [HlmBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Static classes per status: Helm merges a dynamic [class] binding after its variant classes.
  template: `
    @switch (result()?.status) {
      @case ('pass') {
        <span
          class="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
          [attr.aria-label]="label() + ': pass'"
          [attr.title]="title()"
          hlmBadge>
          {{ label() }} ✓
        </span>
      }
      @case ('fail') {
        <span
          [attr.aria-label]="label() + ': fail'"
          [attr.title]="title()"
          hlmBadge
          variant="destructive">
          {{ label() }} ✗
        </span>
      }
      @case ('known-fail') {
        <span
          class="text-amber-700 dark:text-amber-400"
          [attr.aria-label]="label() + ': known failure'"
          [attr.title]="title()"
          hlmBadge
          variant="outline">
          {{ label() }} !
        </span>
      }
      @default {
        <span
          [attr.aria-label]="label() + ': waiting'"
          [attr.title]="title()"
          hlmBadge
          variant="outline">
          {{ label() }} …
        </span>
      }
    }
  `,
})
export class DecodeBadge {
  readonly decoder = input.required<DecoderId>();
  readonly result = input<DecodeResult | undefined>();

  protected readonly label = computed(() => decoderLabel(this.decoder()));

  protected readonly title = computed(() => {
    const result = this.result();
    if (!result) return `Waiting for ${this.label()}`;
    const decoded =
      result.decoded !== undefined && result.status !== 'pass'
        ? `\nDecoded: ${result.decoded.slice(0, 200)}`
        : '';
    return `${this.label()}: ${result.message}${decoded}\n${result.durationMs.toFixed(1)} ms`;
  });
}
