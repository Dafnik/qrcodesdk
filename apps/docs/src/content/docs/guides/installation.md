---
title: Installation
description: Install QRCodeSDK packages and render your first QR codes.
---

qrcodesdk is split into small packages.

- @qrcodesdk/core (QRCodeBuilder, SVG & Text Renderer)
- @qrcodesdk/node (Node PNG Buffer Renderer)

**Install only the runtime and renderers your app needs.**

## Install core

`@qrcodesdk/core` contains the QR code builder, matrix generator, SVG renderer, and terminal text renderer.

```sh
pnpm add @qrcodesdk/core
npm install @qrcodesdk/core
yarn add @qrcodesdk/core
bun add @qrcodesdk/core
```

## Install Node renderers

Use `@qrcodesdk/node` when you need Node-specific output such as PNG buffers.

**Install it alongside `@qrcodesdk/core`.**

```sh
pnpm add @qrcodesdk/core @qrcodesdk/node
npm install @qrcodesdk/core @qrcodesdk/node
yarn add @qrcodesdk/core @qrcodesdk/node
bun add @qrcodesdk/core @qrcodesdk/node
```

## Choose a package

| Package           | Use it for                                                                | Renderers                                         |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `@qrcodesdk/core` | Runtime-neutral QR code generation in browsers, servers, CLIs, and tests. | SVG strings, terminal text strings, raw matrices. |
| `@qrcodesdk/node` | Node.js output that depends on Node or native server APIs.                | PNG `Buffer` output.                              |
