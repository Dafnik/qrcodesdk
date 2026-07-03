---
title: Renderers
description: Choose between SVG, browser DOM, PNG, and text output depending on where you want to use your QR code.
---

`qrcodesdk` supports multiple renderers so you can generate the same QR code for different environments and output formats.

## Available renderers

| Renderer                | Output              | Best for                                              | Package              |
| ----------------------- | ------------------- | ----------------------------------------------------- | -------------------- |
| SVG Renderer            | `string`            | Web apps, emails, dashboards, HTML, static assets     | `@qrcodesdk/core`    |
| Text Renderer           | `string`            | CLIs, logs, terminals, snapshot tests                 | `@qrcodesdk/core`    |
| Browser Canvas Renderer | `HTMLCanvasElement` | Browser DOM, canvas workflows, client-side downloads  | `@qrcodesdk/browser` |
| Browser Image Renderer  | `HTMLImageElement`  | Browser DOM, CSS styling, accessible image elements   | `@qrcodesdk/browser` |
| Node PNG Renderer       | `Buffer`            | Servers, downloads, files, API responses, attachments | `@qrcodesdk/node`    |

## Choosing a renderer

### Use SVG by default

The SVG renderer is the best default for most user-facing surfaces.

It produces a scalable SVG string that stays sharp at any size and can be embedded directly into HTML, returned from a server, saved to disk, or used in email templates.

### Use PNG for bitmap image output

The Node PNG renderer is useful when the target system expects raster image bytes.

It returns a Node.js `Buffer`, which makes it easy to save a `.png` file, send an `image/png` HTTP response, attach a QR code to an email, or provide a downloadable image.

### Use browser renderers for DOM output

The Browser Canvas and Browser Image renderers are useful when you want a QR code element created directly in the browser.

They return DOM elements, so you can append a QR code to a page, style it with CSS, draw it into another canvas, or trigger a client-side `.png` download.

### Use text for terminals and tests

The text renderer is designed for developer-facing output.

It returns a plain string made from Unicode block characters, which makes it useful for CLIs, logs, terminal output, and deterministic test snapshots.
