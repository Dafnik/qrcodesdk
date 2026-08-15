---
'@qrcodesdk/cli': patch
---

Reject contradictory ANSI color flags and use Node's built-in terminal styling for CLI status and error messages, removing the runtime dependency on Chalk.
