# Cache one matrix per builder

Each immutable `QRCodeBuilder` lazily generates one matrix and reuses it across subsequent
`.matrix()` and `.render()` calls. Configuration or payload changes return a new builder with its own
cache; the readonly matrix contract makes reuse safe, and mutation by untyped JavaScript callers may
corrupt later output from that builder and remains unsupported.
