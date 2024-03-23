---
"aeria-build": patch
---

Node walks towards addopting ESM as the default over CommonJS.
Many libraries like NextJS, NuxtJS, and Vite have already dropped CommonJS support fully or partially.
To make Aeria more compatible, we decided to follow the lead.

If you want to stick to CommonJS in your existing or new project, manually set
`module` and `moduleResolution` accordingly. Otherwise, keep in mind the new
`nodenext` module resolution kind expects full paths in imports/exports:

- `import { symbol } from './file'` -> `import { symbol } from './file.js'`
- `import { symbol } from './dir'` -> `import { symbol } from './dir/index.js'`


---

The following unintended behaviors were ocurring before:

1. The "extends" clause of the `tsconfig.json` was shadowing user preferences
2. `module`, `moduleResolution` and `target` were being ignored

This release fully fix them.

