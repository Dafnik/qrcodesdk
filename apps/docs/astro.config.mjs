// @ts-check
import angular from '@analogjs/astro-angular';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';



import { includeContentPlugin } from './astro-content-plugin.mjs';
import { STARLIGHT_SIDEBAR } from './starlight-sidebar.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://qrcodesdk.dev',
  cacheDir: process.env.ASTRO_CACHE_DIR ?? './node_modules/.astro',
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    cacheDir: process.env.VITE_CACHE_DIR ?? './node_modules/.vite',
    plugins: [includeContentPlugin(), tailwindcss()],
  },
  integrations: [
    starlight({
      customCss: ['./src/styles/global.css'],
      title: 'QRCodeSDK',
      expressiveCode: {
        themes: ['github-light', 'github-dark'],
      },
      plugins: [starlightLinksValidator()],
      sidebar: STARLIGHT_SIDEBAR,
    }),
    react(),
    angular({
      useAngularHydration: true,
      vite: {
        transformFilter: (_code, id) => {
          return (
            id.includes('src/components/angular') ||
            id.includes('src/components/playground/angular')
          ); // <- only transform Angular TypeScript files
        },
      },
    }),
  ],
});
