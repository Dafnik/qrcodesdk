# Make the public matrix readonly

`QRCodeMatrix` uses readonly outer and inner arrays, and built-in renderers never mutate the matrix
they receive. Immutability is enforced through TypeScript rather than runtime `Object.freeze()` calls,
avoiding an extra matrix traversal while treating mutation by JavaScript callers as unsupported.
