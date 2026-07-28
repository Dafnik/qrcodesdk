import {makeChangelogsSidebarLinks} from 'starlight-changelogs';

export const STARLIGHT_SIDEBAR = [
  {
    label: 'Getting Started',
    items: [
      {label: 'Overview', slug: ''},
      {label: 'Playground', slug: 'playground'},
      {label: 'Installation', slug: 'guides/installation'},
    ],
  },
  {
    label: 'Choose Your Output',
    items: [
      {label: 'Render SVG', slug: 'renderers/core/svg'},
      {label: 'Render PNG in Node.js', slug: 'renderers/node/png'},
      {label: 'Render to Canvas', slug: 'renderers/browser/canvas'},
      {label: 'Render to an Image Element', slug: 'renderers/browser/image'},
      {label: 'Render Terminal Text', slug: 'renderers/core/text'},
    ],
  },
  {
    label: 'Customize',
    items: [{label: 'Customize QR Codes', slug: 'guides/customize'}],
  },
  {
    label: 'Advanced',
    items: [
      {label: 'Builder API', slug: 'libs/core'},
      {label: 'Custom Renderers', slug: 'renderers/custom'},
      {label: 'Performance', slug: 'guides/performance'},
    ],
  },
  {
    label: 'Packages',
    items: [
      {label: 'Core', slug: 'libs/core'},
      {label: 'CLI', slug: 'libs/cli'},
      {label: 'Browser', slug: 'libs/browser'},
      {label: 'Node', slug: 'libs/node'},
      {label: 'React & Next.js', slug: 'libs/react'},
      {label: 'Angular', slug: 'libs/angular'},
    ],
  },
  {
    label: 'Changelogs',
    collapsed: true,
    items: [
      {
        label: '@qrcodesdk/core',
        items: getPackageChangelogsSidebarLinks('core'),
      },
      {
        label: '@qrcodesdk/browser',
        items: getPackageChangelogsSidebarLinks('browser'),
      },
      {
        label: '@qrcodesdk/node',
        items: getPackageChangelogsSidebarLinks('node'),
      },
      {
        label: '@qrcodesdk/react',
        items: getPackageChangelogsSidebarLinks('react'),
      },
      {label: '@qrcodesdk/angular', items: getPackageChangelogsSidebarLinks('angular')},
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
