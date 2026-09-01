---
title: Version and output policy
description: Framework support windows and generated-artifact compatibility guarantees.
---

## Generated artifacts

Identical input and options produce deterministic output within one installed QRCodeSDK
implementation. Matrix cells, SVG markup, and PNG bytes may change between releases as encoding,
mask selection, markup, or rasterization changes.

If exact artifacts matter, pin every QRCodeSDK package to an exact version and retain your own matrix,
SVG, or PNG fixtures. A version upgrade should be treated as an explicit fixture update even when the
decoded payload and documented options behave the same.

## Framework versions

| Framework | Support policy                                | Current declared range |
| --------- | --------------------------------------------- | ---------------------- |
| Angular   | Every upstream-supported major                | 20, 21, and 22         |
| React     | Selected widely used stable majors            | 18 and 19              |
| Vue       | The current major from a tested minimum minor | 3.3 and newer          |
| Svelte    | The current major                             | 5                      |

The compatibility suite tests the minimum and current versions named by these ranges. Angular ranges
are reviewed when Angular adds or retires a supported major. React ranges require a manual review when
a stable major ships because React has no Angular-style support schedule. Vue's tested minimum minor
and the active Svelte major are reviewed with their upstream releases.
