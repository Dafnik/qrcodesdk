# Export payload helpers from a Core subpath

Typed payload helpers and their input types are named exports from the `@qrcodesdk/core/payload`
subpath rather than the main entry point or a separate package. This keeps the root runtime surface
focused on QR generation and renderers while allowing consumers to load payload serializers only
when needed.
