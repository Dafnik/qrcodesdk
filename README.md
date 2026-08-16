<div align="center"><img src="https://qrcodesdk.dev/favicon.svg" alt="QRCodeSDK logo" width="240"></div>

# QRCodeSDK

Build QR codes with a single TypeScript-first API, then render them in the format your app needs.

## Install

```sh
npm install @qrcodesdk/core
```

```sh
pnpm add @qrcodesdk/core
```

<details>
<summary>Other package managers</summary>

**vp**

```sh
vp add @qrcodesdk/core
```

**deno**

```sh
deno add @qrcodesdk/core
```

**bun**

```sh
bun add @qrcodesdk/core
```

**yarn**

```sh
yarn add @qrcodesdk/core
```

</details>

Render a scalable SVG string with the runtime-neutral Core package:

```ts
import {QRCodeSVGRenderer, qrcode} from '@qrcodesdk/core';

const svg = qrcode('https://qrcodesdk.dev').render(QRCodeSVGRenderer());
```

SVG is the recommended default for most user-facing QR codes: it stays sharp at any size and works
in browsers, servers and static assets. See the [SVG renderer reference](https://qrcodesdk.dev/reference/renderers/svg/)
when you need its options or exact return contract.

## Choose by runtime and output

| Where will it run?               | Output you need                                    | Start here                                                      |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| Any supported JavaScript runtime | SVG or terminal text strings                       | [`@qrcodesdk/core`](https://qrcodesdk.dev/packages/core/)       |
| Browser DOM                      | Canvas, PNG-backed Image element, or file download | [`@qrcodesdk/browser`](https://qrcodesdk.dev/packages/browser/) |
| Node.js-compatible runtime       | PNG `Buffer` for files or responses                | [`@qrcodesdk/node`](https://qrcodesdk.dev/packages/node/)       |
| React or Next.js                 | SVG, Image, or Canvas component                    | [`@qrcodesdk/react`](https://qrcodesdk.dev/packages/react/)     |
| Vue                              | SVG, Image, or Canvas component                    | [`@qrcodesdk/vue`](https://qrcodesdk.dev/packages/vue/)         |
| Svelte                           | SVG, Image, or Canvas component                    | [`@qrcodesdk/svelte`](https://qrcodesdk.dev/packages/svelte/)   |
| Angular                          | SVG, Image, or Canvas component                    | [`@qrcodesdk/angular`](https://qrcodesdk.dev/packages/angular/) |
| Terminal, shell script, or CI    | Terminal text, SVG file, or PNG file               | [`@qrcodesdk/cli`](https://qrcodesdk.dev/packages/cli/)         |

[Choose your setup](https://qrcodesdk.dev/getting-started/choose-your-setup/) for the matching install command, or compare
every built-in return type in [Renderer outputs](https://qrcodesdk.dev/reference/renderers/).

## Next step

Try the [Playground](https://qrcodesdk.dev/playground/) to explore appearance visually, or follow
[Customize appearance](https://qrcodesdk.dev/guides/customize/) to style the SVG you just rendered.
