// @ts-check
import angular from '@analogjs/astro-angular';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import mermaidIntegration from 'astro-mermaid';
import {defineConfig} from 'astro/config';
import starlightChangelogs from 'starlight-changelogs';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightPageContextAction from 'starlight-page-context-action';

import {STARLIGHT_SIDEBAR} from './src/starlight-sidebar.mjs';
import {includeContentPlugin} from './src/utils/index.js';

/** @returns {import('vite').Plugin} */
function suppressAngularSourcemapWarnings() {
  return {
    name: 'suppress-angular-sourcemap-warnings',
    enforce: 'post',

    configResolved(config) {
      const originalWarn = config.logger.warn.bind(config.logger);
      const originalWarnOnce = config.logger.warnOnce.bind(config.logger);

      /**
       * @param {string} message - The message to evaluate.
       * @returns {boolean} `true` when the message is a sourcemap warning related to
       * `@angular+platform-server`; otherwise, `false`.
       */
      const shouldIgnore = (message) =>
        message.includes('Sourcemap for') && message.includes('@angular+platform-server');

      config.logger.warn = (message, options) => {
        if (shouldIgnore(message)) return;
        originalWarn(message, options);
      };

      config.logger.warnOnce = (message, options) => {
        if (shouldIgnore(message)) return;
        originalWarnOnce(message, options);
      };
    },
  };
}

/** Needs to be done as plugin so that it wins against @analogjs-astrojs integration
 * @returns {import('astro').AstroIntegration}
 */
function useProductionJsx() {
  return {
    name: 'use-production-jsx',
    hooks: {
      'astro:config:setup': ({updateConfig}) => {
        updateConfig({
          vite: {
            oxc: {
              jsx: {
                development: false,
              },
            },
          },
        });
      },
    },
  };
}

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
      noExternal: [
        '@spartan-ng/brain',
        '@spartan-ng/brain/**',
        '@spartan-ng/helm',
        '@spartan-ng/helm/**',
        '@ng-icons/**',
        '@sim/**',
      ],
    },
    plugins: [includeContentPlugin(), tailwindcss(), suppressAngularSourcemapWarnings()],
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
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: true,
      },
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
        starlightLlmsTxt({
          rawContent: true,
        }),
        starlightChangelogs(),
      ],
      sidebar: STARLIGHT_SIDEBAR,
      components: {
        Footer: './src/components/footer.astro',
        PageTitle: './src/components/PageTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        TableOfContents: './src/components/TableOfContents.astro',
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
    vue(),
    angular({
      useAngularHydration: false,
      vite: {
        tailwindCss: {
          rootStylesheet: 'src/styles/global.css',
        },
        fastCompile: true,
        transformFilter: (_code, id) => {
          return (
            id.includes('src/components/angular') ||
            id.includes('src/components/playground/angular') ||
            id.includes('src/libs/ui') ||
            id.includes('src/libs/sim')
          ); // <- only transform Angular TypeScript files
        },
      },
    }),
    useProductionJsx(),
  ],
});
