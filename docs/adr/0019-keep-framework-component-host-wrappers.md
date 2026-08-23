# Keep framework component host wrappers

Framework QR code components permanently render their output inside a framework-owned host element;
Angular uses the component host and the other frameworks render an explicit wrapper. Classes,
layout, and host attributes therefore target the wrapper instead of the nested SVG, Image, or Canvas
element, providing one consistent component structure across output types. Each framework forwards
its ordinary host attributes; React accepts normal `div` props rather than limiting its wrapper to
`className`.
