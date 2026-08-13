# Documentation page contracts

Every hand-written page declares exactly one `docType` in front matter:

- `overview`: orients the reader and gives one recommended first action;
- `setup`: helps the reader choose a package or environment;
- `guide`: completes one task through prerequisites, steps, result, caveats, and a next step;
- `package`: explains what one package adds, its happy path, compatibility, and public exports;
- `reference`: exhaustively records options, defaults, return types, and constraints;
- `concept`: explains why something works without becoming an installation or task flow.

## Topic ownership

Give each topic one canonical page. Setup selection belongs to **Choose your setup**; matrix options to
**Builder and matrix**; shared styling and scan safety to **Customize appearance**; output selection
to **Renderer outputs**; center-image preparation to **Add a center image**; downloading and saving
to **Download or save**; and HTTP response patterns to **Serve a QR code**.

Package pages may include one package-specific happy path and their public exports. Guides may repeat
the smallest runnable fragment needed for their task. Other pages summarize canonical material and
link to it instead of copying full option tables or workflows.

When adding or moving content, keep its source path aligned with the public route taxonomy and add
the route to the sidebar only once. Route compatibility is not maintained for removed documentation.
