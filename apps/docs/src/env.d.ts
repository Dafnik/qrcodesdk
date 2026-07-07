/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*?includeContent' {
  import type {Type} from '@angular/core';
  import type {ComponentType} from 'react';
  const component: Type<any> | ComponentType<any>;
  export const content: string;
  export default component;
}
