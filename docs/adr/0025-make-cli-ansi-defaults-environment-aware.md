# Make CLI ANSI defaults environment-aware

The CLI enables ANSI styling by default only when standard output is a TTY and `NO_COLOR` is absent.
Explicit `--ansi-colors`, `--no-ansi-colors`, or `--only-ansi-colors` flags override both the
environment variable and TTY detection, allowing callers to force the representation used in
redirected output.
