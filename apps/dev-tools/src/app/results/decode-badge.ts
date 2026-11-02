import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {HlmBadge} from '@spartan-ng/helm/badge';

import type {DecodeResult} from '../rendering/decode';

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
          [attr.title]="title()"
          hlmBadge>
          pass
        </span>
      }
      @case ('fail') {
        <span [attr.title]="title()" hlmBadge variant="destructive">fail</span>
      }
      @case ('known-fail') {
        <span
          class="text-amber-700 dark:text-amber-400"
          [attr.title]="title()"
          hlmBadge
          variant="outline">
          known
        </span>
      }
      @default {
        <span [attr.title]="title()" hlmBadge variant="outline">…</span>
      }
    }
  `,
})
export class DecodeBadge {
  readonly result = input<DecodeResult | undefined>();

  protected readonly title = computed(() => {
    const result = this.result();
    if (!result) return 'Waiting for jsQR';
    const decoded =
      result.decoded !== undefined && result.status !== 'pass'
        ? `\nDecoded: ${result.decoded.slice(0, 200)}`
        : '';
    return `${result.message}${decoded}\n${result.durationMs.toFixed(1)} ms`;
  });
}
