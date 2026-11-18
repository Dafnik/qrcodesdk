import {type ReactNode, createElement} from 'react';

/** Creates a host component that renders its name and JSON props as data attributes. */
export function host(name: string) {
  function HostComponent({children, ...props}: {children?: ReactNode}) {
    return createElement('div', {'data-host': name, 'data-props': JSON.stringify(props)}, children);
  }
  HostComponent.displayName = name;
  return HostComponent;
}

/** Reads the props of every rendered host component with this name. */
export function hostProps(container: ParentNode, name: string): Record<string, unknown>[] {
  return [...container.querySelectorAll(`[data-host="${name}"]`)].map(
    (element) => JSON.parse(element.getAttribute('data-props')!) as Record<string, unknown>,
  );
}
