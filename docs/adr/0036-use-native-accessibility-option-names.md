# Use native accessibility option names

Visual renderers nest familiar output-native accessibility names under `accessibility` rather than
using one normalized label field. SVG and Canvas accept `ariaLabel` and `title`. Image accepts
`alt`, `ariaLabel`, and `title`, and defaults `alt` to the empty string. SVG does not accept `alt`.
Omitting accessibility keeps graphical output decorative; a non-empty accessible name opts it into
meaningful image semantics.
