# Let the CLI use terminal-oriented visual defaults

The CLI intentionally defaults to a module size of `1` and a margin of `2` instead of inheriting the
visual renderer defaults. Terminal output is the CLI's primary use case and larger QR codes can
exceed terminal dimensions; the same CLI defaults also apply when selecting SVG or PNG unless the
developer overrides them with flags.
