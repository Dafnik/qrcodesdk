# Use native accessibility option names

Visual renderers expose familiar output-native accessibility names such as `alt`, `ariaLabel`, and
`title` rather than one normalized `label` option. SVG may use `alt` as a fallback accessible name,
Image preserves native `alt` and `aria-label` behavior, and Canvas accepts `ariaLabel` and `title`
without an artificial `alt` option. The API accepts small output-specific differences so each
renderer resembles the element it configures.
