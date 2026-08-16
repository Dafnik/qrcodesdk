/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.ts?includeContent' {
  import type {Type} from '@angular/core';
  const component: Type<any>;
  export const content: string;
  export default component;
}

declare module '*.tsx?includeContent' {
  import type {ComponentType} from 'react';
  const component: ComponentType<any>;
  export const content: string;
  export default component;
}

declare module '*.svelte?includeContent' {
  import type {Component} from 'svelte';
  const component: Component & ((props: Record<string, unknown>) => ReturnType<Component>);
  export const content: string;
  export default component;
}

declare module '*.vue?includeContent' {
  import type {DefineComponent} from 'vue';
  const component: DefineComponent;
  export const content: string;
  export default component;
}
