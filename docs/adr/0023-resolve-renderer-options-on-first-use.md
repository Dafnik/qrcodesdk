# Resolve renderer options on first use

Configured renderers resolve and cache their options on the first render rather than when the
renderer factory is called or on every invocation. Mutations before first use may affect the
resolved configuration, while later mutations do not; consumers should still treat options as
immutable and create a new renderer for a new configuration.
