# Use pinned SDK dependencies before 1.0

QRCodeSDK public packages release independently. A package release never requires releases of
unrelated packages.

Browser and Node declare Core as a peer dependency. Framework adapters depend on both Browser and
Core, so installing an adapter provides Browser's tested Core peer. Framework runtimes remain peer
dependencies.

Until a consumed QRCodeSDK package reaches 1.0, packages pin its exact version. This makes each
pre-1.0 compatibility contract explicit. Once a consumed package has a stable 1.x contract,
consumers use a caret range from the tested stable version.
