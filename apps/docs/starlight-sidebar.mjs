export const STARLIGHT_SIDEBAR = [
  {
    label: 'Start Here',
    items: [
      {label: 'Overview', slug: ''},
      {label: 'Playground', slug: 'playground'},
      {label: 'Installation', slug: 'guides/installation'},
      {label: 'CLI', slug: 'guides/cli'},
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
      {label: 'API Reference', slug: 'reference/api'},
    ],
  },
  {
    label: 'Packages',
    items: [
      {label: '@qrcodesdk/angular', slug: 'libs/angular'},
      {label: '@qrcodesdk/browser', slug: 'libs/browser'},
      {label: '@qrcodesdk/core', slug: 'libs/core'},
      {label: '@qrcodesdk/node', slug: 'libs/node'},
      {label: '@qrcodesdk/react', slug: 'libs/react'},
    ],
  },
];
