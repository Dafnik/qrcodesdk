# Keep visual styling portable across renderers

SVG, Canvas, browser Image, and Node PNG expose one `QRCodeVisualStyle` with equivalent geometry and
RGB/RGBA color behavior. Text exposes the smaller `QRCodeTextStyle` containing only dimensions it
can represent. Accessibility, image sources, PNG compression, and terminal ANSI behavior remain
output-specific renderer options. Download renderers only wrap another renderer.
