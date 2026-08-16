import {makeChangelogsSidebarLinks} from 'starlight-changelogs';

import {DOCUMENTATION_SIDEBAR} from './documentation-sidebar.mjs';

export const STARLIGHT_SIDEBAR = [
  ...DOCUMENTATION_SIDEBAR,
  {
    label: 'Changelogs',
    collapsed: true,
    items: [
      {
        label: '@qrcodesdk/core',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('core'),
      },
      {
        label: '@qrcodesdk/browser',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('browser'),
      },
      {
        label: '@qrcodesdk/node',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('node'),
      },
      {
        label: '@qrcodesdk/react',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('react'),
      },
      {
        label: '@qrcodesdk/angular',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('angular'),
      },
      {
        label: '@qrcodesdk/vue',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('vue'),
      },
      {
        label: '@qrcodesdk/svelte',
        collapsed: true,
        items: getPackageChangelogsSidebarLinks('svelte'),
      },
    ],
  },
];

/**
 *
 * @param {string} packageName
 */
function getPackageChangelogsSidebarLinks(packageName) {
  return makeChangelogsSidebarLinks([
    {
      type: 'all',
      base: `changelog/${packageName}`,
      label: 'All versions',
    },
    {
      type: 'recent',
      base: `changelog/${packageName}`,
      count: 10,
    },
  ]);
}
