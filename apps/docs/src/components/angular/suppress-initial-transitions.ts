import {isPlatformBrowser} from '@angular/common';
import {DestroyRef, ElementRef, PLATFORM_ID, afterNextRender, inject} from '@angular/core';

const ATTRIBUTE = 'data-suppress-transitions';

/**
 * Disable CSS transitions inside an Astro island until its first client render has been painted.
 *
 * The Astro Angular renderer creates the island DOM before the first change detection applies
 * `[class]` bindings. Browsers can paint in between, so elements with `transition-*` classes would
 * animate from unstyled browser defaults (font size, borders, widths) to their real styles.
 * Call this from the constructor of every Angular component that is mounted as an island.
 */
export function suppressInitialTransitions(): void {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

  const host: HTMLElement = inject(ElementRef).nativeElement;
  host.setAttribute(ATTRIBUTE, '');

  let frame: number | undefined;
  afterNextRender(() => {
    // Wait two frames: the first paints the final classes without transitions, the second
    // re-enables them without any pending style change left to animate.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => host.removeAttribute(ATTRIBUTE));
    });
  });
  inject(DestroyRef).onDestroy(() => {
    if (frame !== undefined) cancelAnimationFrame(frame);
  });
}
