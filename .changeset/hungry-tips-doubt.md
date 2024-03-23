---
"aeria-build": patch
---

Node walks towards addopting ESM as the default over CommonJS.
Many libraries like NextJS, NuxtJS, and Vite have already dropped CommonJS support fully or partially.
To make Aeria more compatible, we decided to follow the lead.

The following unintended behaviors were ocurring before:

1. The "extends" clause of the `tsconfig.json` was shadowing user preferences
2. `module`, `moduleResolution` and `target` were being ignored

This release fully fix them.
