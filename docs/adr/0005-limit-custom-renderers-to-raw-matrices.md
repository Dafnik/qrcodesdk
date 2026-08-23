# Limit custom renderers to raw matrices

The stable custom-renderer contract exposes only the raw light-and-dark module matrix. QRCodeSDK
does not expose its module-role metadata or shared styling plan as public extension APIs, which keeps
the contract small while reserving styled rendering for built-in and sibling-package renderers.
