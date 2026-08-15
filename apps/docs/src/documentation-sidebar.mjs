export const DOCUMENTATION_SIDEBAR = [
  {
    label: 'Start here',
    items: [
      {label: 'Overview', slug: ''},
      {label: 'Choose your setup', slug: 'getting-started/choose-your-setup'},
      {label: 'Playground', slug: 'playground'},
    ],
  },
  {
    label: 'Guides',
    items: [
      {label: 'Customize appearance', slug: 'guides/customize'},
      {label: 'Add a center image', slug: 'guides/center-images'},
      {label: 'Browser Usage', slug: 'guides/browser-usage'},
      {label: 'Download or save', slug: 'guides/download-or-save'},
      {label: 'Serve a QR code', slug: 'guides/server-output'},
    ],
  },
  {
    label: 'Packages',
    items: [
      {label: 'Core', slug: 'packages/core'},
      {label: 'Browser', slug: 'packages/browser'},
      {label: 'Node.js', slug: 'packages/node'},
      {label: 'React & Next.js', slug: 'packages/react'},
      {label: 'Vue', slug: 'packages/vue'},
      {label: 'Angular', slug: 'packages/angular'},
      {label: 'CLI', slug: 'packages/cli'},
    ],
  },
  {
    label: 'API and output reference',
    items: [
      {label: 'Builder and matrix', slug: 'reference/builder'},
      {
        label: 'Renderer outputs',
        items: [
          {label: 'Overview', slug: 'reference/renderers'},
          {label: 'SVG string', slug: 'reference/renderers/svg'},
          {label: 'Terminal text', slug: 'reference/renderers/text'},
          {label: 'Canvas element', slug: 'reference/renderers/canvas'},
          {label: 'PNG-backed Image element', slug: 'reference/renderers/image'},
          {label: 'Browser downloads', slug: 'reference/renderers/browser-downloads'},
          {label: 'PNG Buffer', slug: 'reference/renderers/png'},
        ],
      },
      {label: 'Custom renderers', slug: 'reference/custom-renderers'},
    ],
  },
  {
    label: 'Learn and project',
    items: [
      {label: 'How QR codes work', slug: 'learn/how-qr-codes-work'},
      {label: 'Performance', slug: 'learn/performance'},
      {label: 'Credits', slug: 'project/credits'},
    ],
  },
];
