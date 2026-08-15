---
'@qrcodesdk/angular': patch
'@qrcodesdk/browser': patch
'@qrcodesdk/core': patch
---

Improve rendered output accessibility and browser reliability. SVG output now uses valid title and ARIA markup, canvases can receive accessible labels, images default to an empty alt attribute, SVG download URLs remain alive until the download starts, and Angular SVG downloads safely no-op during server rendering.
