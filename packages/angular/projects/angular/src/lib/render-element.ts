import type {ElementRef, Renderer2} from '@angular/core';

export function replaceElementChildren<TElement extends HTMLElement>(
  renderer: Renderer2,
  element: ElementRef<TElement>,
  child: Element,
): void {
  const nativeElement = element.nativeElement;

  while (nativeElement.firstChild) {
    renderer.removeChild(nativeElement, nativeElement.firstChild);
  }

  renderer.appendChild(nativeElement, child);
}
