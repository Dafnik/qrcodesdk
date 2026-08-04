import {makeChangelogsSidebarLinks} from 'starlight-changelogs';

export const STARLIGHT_SIDEBAR = [
  {
    label: 'Getting Started',
    items: [
      {label: 'Overview', slug: ''},
      {label: 'Playground', slug: 'playground'},
      {label: 'Explain QR Codes', slug: 'explain'},
      {label: 'Installation', slug: 'getting-started/installation'},
      {label: 'Credits', slug: 'getting-started/credits'},
    ],
  },
  {
    label: 'Choose Your Output',
    items: [
      {label: 'Render SVG', slug: 'renderers/core/svg'},
      {label: 'Render PNG in Node.js', slug: 'packages/node'},
      {label: 'Render to Canvas', slug: 'renderers/browser/canvas'},
      {label: 'Render to an Image Element', slug: 'renderers/browser/image'},
      {label: 'Render Terminal Text', slug: 'renderers/core/text'},
    ],
  },
  {
    label: 'Advanced',
    items: [
      {label: 'Builder API', slug: 'packages/core'},
      {label: 'Customize QR Codes', slug: 'advanced/customize'},
      {label: 'Custom Renderers', slug: 'advanced/custom-renderers'},
      {label: 'Performance', slug: 'advanced/performance'},
    ],
  },
  {
    label: 'Packages',
    items: [
      {label: 'Core', slug: 'packages/core'},
      {label: 'CLI', slug: 'packages/cli'},
      {label: 'Browser', slug: 'packages/browser'},
      {label: 'Node', slug: 'packages/node'},
      {label: 'React & Next.js', slug: 'packages/react'},
      {label: 'Angular', slug: 'packages/angular'},
    ],
  },
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
