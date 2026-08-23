# Require SVG markup in server-rendered HTML

Framework SVG components include the complete QR code SVG in the initial server-rendered HTML.
React may implement its component as a Next.js client boundary so hooks and downloads activate after
hydration, but it need not be a React Server Component; Canvas and Image components may continue to
render placeholders until browser APIs become available.
