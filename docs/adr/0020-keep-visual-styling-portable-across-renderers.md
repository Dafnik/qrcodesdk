# Keep visual styling portable across renderers

All visual renderers expose one styling model with equivalent geometry and color behavior. QRCodeSDK
therefore prefers portable opaque colors and shared shapes over SVG-only CSS variables, gradients,
alpha effects, or other output-specific styling, accepting less format-specific expressiveness so a
design can move between SVG, Canvas, browser Image, and Node PNG.
