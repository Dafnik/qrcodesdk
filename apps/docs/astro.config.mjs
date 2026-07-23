// @ts-check
import angular from '@analogjs/astro-angular';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import mermaidIntegration from 'astro-mermaid';
import {defineConfig} from 'astro/config';
import starlightLinksValidator from 'starlight-links-validator';
import starlightPageContextAction from 'starlight-page-context-action';

import {STARLIGHT_SIDEBAR} from './src/starlight-sidebar.mjs';
import {includeContentPlugin} from './src/utils/index.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://qrcodesdk.dev',
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['math', 'mermaid'],
    },
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    ssr: {
      // transform these packages during SSR. Globs supported
      noExternal: ['@spartan-ng/brain', '@spartan-ng/helm', '@spartan-ng/helm/**'],
    },
    plugins: [includeContentPlugin(), tailwindcss()],
  },
  integrations: [
    mermaidIntegration({
      autoTheme: true,
      enableLog: false,
      mermaidConfig: {
        xyChart: {
          width: 760,
          height: 340,
          titleFontSize: 16,
          titlePadding: 6,
          plotReservedSpacePercent: 72,
          xAxis: {
            showTitle: false,
            showTick: false,
            showAxisLine: false,
            labelFontSize: 13,
            labelPadding: 8,
          },
          yAxis: {
            showTitle: false,
            tickLength: 3,
            tickWidth: 1,
            axisLineWidth: 1,
            labelFontSize: 12,
          },
        },
      },
    }),
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
        fastCompile: true,
        transformFilter: (_code, id) => {
          return (
            id.includes('src/components/angular') ||
            id.includes('src/components/playground/angular') ||
            id.includes('src/libs/ui')
          ); // <- only transform Angular TypeScript files
        },
      },
    }),
  ],
});
