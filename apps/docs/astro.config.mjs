// @ts-check
import angular from '@analogjs/astro-angular';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightPageContextAction from 'starlight-page-context-action';

import {includeContentPlugin} from './astro-content-plugin.mjs';
import {STARLIGHT_SIDEBAR} from './starlight-sidebar.mjs';

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
      description:
        'Build QR codes with a single TypeScript-first API, then render them in the format your app needs.',
      expressiveCode: {
        themes: ['github-light', 'github-dark'],
      },
      routeMiddleware: './src/routeData.ts',
      plugins: [
        starlightLinksValidator(),
        starlightLlmsTxt(),
        starlightPageContextAction({
          position: 'below-toc',
          actions: {
            viewMarkdown: true,
          },
        }),
      ],
      sidebar: STARLIGHT_SIDEBAR,
      components: {
        Footer: './src/components/footer.astro',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Dafnik/qrcodesdk',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/Dafnik/qrcodesdk/edit/main/apps/docs/',
      },
    }),
    react(),
    angular({
      useAngularHydration: true,
      vite: {
        transformFilter: (_code, id) => {
          return (
            id.includes('src/components/angular') ||
            id.includes('src/components/playground/qrcode-angular')
          ); // <- only transform Angular TypeScript files
        },
      },
    }),
  ],
});
