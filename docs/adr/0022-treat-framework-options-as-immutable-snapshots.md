# Treat framework options as immutable snapshots

Framework components treat each `options` object as one immutable configuration snapshot and react
when its reference is replaced. They do not detect nested in-place mutations, which keeps behavior
consistent across React, Vue, Svelte, and Angular and avoids framework-specific deep-watching costs.
