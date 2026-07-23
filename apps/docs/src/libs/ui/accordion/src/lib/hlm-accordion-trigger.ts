import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideChevronDown} from '@ng-icons/lucide';
import {BrnAccordionHeader, BrnAccordionTrigger} from '@spartan-ng/brain/accordion';
import {hlm} from '@spartan-ng/helm/utils';
import type {ClassValue} from 'clsx';

@Component({
  selector: 'hlm-accordion-trigger',
  imports: [BrnAccordionHeader, BrnAccordionTrigger, NgIcon],
  providers: [provideIcons({lucideChevronDown})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="flex" brnAccordionHeader>
      <button [class]="_computedTriggerClass()" brnAccordionTrigger data-slot="accordion-trigger">
        <ng-content />
        <ng-icon
          class="pointer-events-none shrink-0 transition-transform group-aria-expanded/accordion-trigger:rotate-180"
          name="lucideChevronDown"
          data-slot="accordion-trigger-icon" />
      </button>
    </h3>
  `,
})
export class HlmAccordionTrigger {
  public readonly triggerClass = input<ClassValue>('');

  protected readonly _computedTriggerClass = computed(() =>
    hlm(
      'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground! rounded-lg py-2.5 text-start text-sm font-medium hover:underline focus-visible:ring-3 **:data-[slot=accordion-trigger-icon]:ms-auto **:data-[slot=accordion-trigger-icon]:text-[length:--spacing(4)] group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50',
      this.triggerClass(),
    ),
  );
}
