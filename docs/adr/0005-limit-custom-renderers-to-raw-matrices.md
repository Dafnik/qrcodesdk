# Limit custom renderers to raw matrices

Superseded by [ADR 0038](./0038-use-renderer-owned-styling-and-a-public-drawing-protocol.md).

The stable custom-renderer contract exposes only the raw light-and-dark module matrix. QRCodeSDK
does not expose its module-role metadata or styled drawing as public extension APIs, which keeps
the contract small while reserving styled rendering for built-in and sibling-package renderers.
