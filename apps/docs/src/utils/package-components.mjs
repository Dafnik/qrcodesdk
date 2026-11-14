/**
 * Component and prop tables for the framework package pages and their generated READMEs. Text in
 * backticks renders as inline code.
 */

/** @type {ReadonlyArray<{component: string, selector: string, output: string, download: string}>} */
export const PACKAGE_COMPONENTS = [
  {component: 'QRCodeSVG', selector: 'qrcode-svg', output: 'Inline SVG element', download: 'SVG'},
  {component: 'QRCodePNG', selector: 'qrcode-png', output: 'PNG-backed <img>', download: 'PNG'},
  {component: 'QRCodeWebP', selector: 'qrcode-webp', output: 'WebP-backed <img>', download: 'WebP'},
  {component: 'QRCodeGIF', selector: 'qrcode-gif', output: 'GIF-backed <img>', download: 'GIF'},
  {component: 'QRCodeJPEG', selector: 'qrcode-jpeg', output: 'JPEG-backed <img>', download: 'JPEG'},
  {
    component: 'QRCodeCanvas',
    selector: 'qrcode-canvas',
    output: '<canvas> element',
    download: 'None',
  },
];

const PAYLOAD_PROP = {
  prop: '`payload`',
  type: '`string | number`',
  description: 'Required QR code payload.',
};

const OPTIONS_PROP = {
  prop: '`options`',
  type: 'Component-specific options',
  description:
    'Optional `matrix` options and renderer options, such as `QRCodeSVGOptions` for `QRCodeSVG`.',
};

/** @type {Readonly<Record<string, ReadonlyArray<{prop: string, type: string, description: string}>>>} */
const FRAMEWORK_PROPS = {
  '@qrcodesdk/react': [
    PAYLOAD_PROP,
    OPTIONS_PROP,
    {
      prop: '`className`, `style`, other `<div>` props',
      type: "`ComponentPropsWithoutRef<'div'>`",
      description:
        'Passed to the wrapper `<div>` that contains the output element. `children` and `dangerouslySetInnerHTML` are not accepted.',
    },
    {
      prop: '`ref`',
      type: '`Ref<QRCodeDownloadHandle>`',
      description:
        'Receives `download(filename?)`, not the wrapper element. `QRCodeCanvas` does not accept a `ref`.',
    },
  ],
  '@qrcodesdk/vue': [
    PAYLOAD_PROP,
    OPTIONS_PROP,
    {
      prop: '`class`, `style`, other attributes and listeners',
      type: 'Fallthrough attributes',
      description:
        'Applied to the wrapper `<div>` that contains the output element. `innerHTML`, `innerText`, and `textContent` are dropped.',
    },
    {
      prop: 'Template `ref`',
      type: '`QRCodeDownloadHandle`',
      description:
        'Exposes `download(filename?)` on every component except `QRCodeCanvas`, which exposes nothing.',
    },
  ],
  '@qrcodesdk/svelte': [
    PAYLOAD_PROP,
    OPTIONS_PROP,
    {
      prop: '`class`, `style`, other `<div>` attributes',
      type: '`HTMLAttributes<HTMLDivElement>`',
      description:
        'Spread onto the wrapper `<div>` that contains the output element. `children` is not accepted.',
    },
    {
      prop: '`bind:this`',
      type: '`QRCodeDownloadHandle`',
      description:
        'Exposes `download(filename?)` on every component except `QRCodeCanvas`, which exports nothing.',
    },
  ],
  '@qrcodesdk/angular': [
    {...PAYLOAD_PROP, prop: '`payload` input'},
    {...OPTIONS_PROP, prop: '`options` input'},
    {
      prop: '`class`, `style`, other host attributes',
      type: 'Host element attributes',
      description:
        'Apply to the `<qrcode-*>` host element. There is no wrapper `<div>`. The output element is a direct child of the host, which is inline by default.',
    },
    {
      prop: 'Template reference variable or `viewChild()`',
      type: 'Component instance',
      description:
        'Every component except `QRCodeCanvas` implements `QRCodeDownloadHandle` and has `download(filename?)`.',
    },
  ],
};

/**
 * Returns the prop rows for a framework package.
 *
 * @param {string | undefined} packageName
 */
export function getPackageComponentProps(packageName) {
  const props = packageName ? FRAMEWORK_PROPS[packageName] : undefined;

  if (!props) {
    throw new Error(`No component props are defined for ${packageName ?? 'this page'}.`);
  }

  return props;
}

/**
 * Splits text at backticks into plain and inline-code parts.
 *
 * @param {string} text
 * @returns {Array<{code: boolean, text: string}>}
 */
export function splitInlineCode(text) {
  return text
    .split('`')
    .map((part, index) => ({code: index % 2 === 1, text: part}))
    .filter(({text: part}) => part.length > 0);
}
