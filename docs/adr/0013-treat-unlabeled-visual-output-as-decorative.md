# Treat unlabeled visual output as decorative

Built-in visual output is decorative by default when the developer supplies no accessible label.
Renderers exclude that output from the accessibility tree rather than emitting an unnamed image or
inventing a generic label; supplying accessibility options opts the output into meaningful image
semantics. Canvas emits `aria-hidden="true"` when unlabeled and uses `role="img"` with an accessible
name when `ariaLabel` or `title` is supplied.
