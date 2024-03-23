# aeria-build

## 0.0.51

### Patch Changes

- 17437a6: Use esbuild instead of swc, fix API getter bug
- Updated dependencies [17437a6]
  - @aeriajs/api@0.0.47
  - @aeriajs/builtins@0.0.47

## 0.0.50

### Patch Changes

- f30669a: Node walks towards addopting ESM as the default over CommonJS.
  Many libraries like NextJS, NuxtJS, and Vite have already dropped CommonJS support fully or partially.
  To make Aeria more compatible, we decided to follow the lead.

  If you want to stick to CommonJS in your existing or new project, manually set
  `module` and `moduleResolution` accordingly. Otherwise, keep in mind the new
  `nodenext` module resolution kind expects full paths in imports/exports:

  - `import { symbol } from './file'` -> `import { symbol } from './file.js'`
  - `import { symbol } from './dir'` -> `import { symbol } from './dir/index.js'`

  ***

  The following unintended behaviors were ocurring before:

  1. The "extends" clause of the `tsconfig.json` was shadowing user preferences
  2. `module`, `moduleResolution` and `target` were being ignored

  This release fully fix them.

- Updated dependencies [f30669a]
  - @aeriajs/types@0.0.21
  - @aeriajs/api@0.0.46
  - @aeriajs/builtins@0.0.46
  - @aeriajs/common@0.0.24

## 0.0.49

### Patch Changes

- c1690e1: Fix MongoDB log serialization error and user tsconfig being shadowed
- Updated dependencies [c1690e1]
  - @aeriajs/api@0.0.45
  - @aeriajs/builtins@0.0.45

## 0.0.48

### Patch Changes

- Updated dependencies [5dd9750]
  - @aeriajs/types@0.0.20
  - @aeriajs/api@0.0.44
  - @aeriajs/builtins@0.0.44
  - @aeriajs/common@0.0.23

## 0.0.47

### Patch Changes

- ee917b8: Treat Windows path separator in aeria-build
- Updated dependencies [1f97ace]
  - @aeriajs/common@0.0.22
  - @aeriajs/api@0.0.43
  - @aeriajs/builtins@0.0.43

## 0.0.46

### Patch Changes

- Updated dependencies [896b5e0]
- Updated dependencies [795ce5e]
  - @aeriajs/api@0.0.42
  - @aeriajs/common@0.0.21
  - @aeriajs/builtins@0.0.42

## 0.0.45

### Patch Changes

- Updated dependencies [bfe4da7]
  - @aeriajs/api@0.0.41
  - @aeriajs/builtins@0.0.41

## 0.0.44

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.40
  - @aeriajs/builtins@0.0.40

## 0.0.43

### Patch Changes

- Updated dependencies
  - @aeriajs/builtins@0.0.39
  - @aeriajs/api@0.0.39

## 0.0.42

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.19
  - @aeriajs/api@0.0.38
  - @aeriajs/builtins@0.0.38
  - @aeriajs/common@0.0.20

## 0.0.41

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.37
  - @aeriajs/builtins@0.0.37

## 0.0.40

### Patch Changes

- Updated dependencies
  - @aeriajs/builtins@0.0.36
  - @aeriajs/types@0.0.18
  - @aeriajs/api@0.0.36
  - @aeriajs/common@0.0.19

## 0.0.39

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.17
  - @aeriajs/api@0.0.35
  - @aeriajs/builtins@0.0.35
  - @aeriajs/common@0.0.18

## 0.0.38

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.16
  - @aeriajs/api@0.0.34
  - @aeriajs/builtins@0.0.34
  - @aeriajs/common@0.0.17

## 0.0.37

### Patch Changes

- Updated dependencies [d5f6134]
  - @aeriajs/builtins@0.0.33
  - @aeriajs/api@0.0.33

## 0.0.36

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.32
  - @aeriajs/builtins@0.0.32

## 0.0.35

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.15
  - @aeriajs/api@0.0.31
  - @aeriajs/builtins@0.0.31
  - @aeriajs/common@0.0.16

## 0.0.34

### Patch Changes

- Updated dependencies
  - @aeriajs/common@0.0.15
  - @aeriajs/types@0.0.14
  - @aeriajs/api@0.0.30
  - @aeriajs/builtins@0.0.30

## 0.0.33

### Patch Changes

- @aeriajs/api@0.0.29
- @aeriajs/builtins@0.0.29

## 0.0.32

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.28
  - @aeriajs/builtins@0.0.28

## 0.0.31

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.27
  - @aeriajs/builtins@0.0.27

## 0.0.30

### Patch Changes

- Multiple fixes
- Updated dependencies
  - @aeriajs/types@0.0.13
  - @aeriajs/api@0.0.26
  - @aeriajs/builtins@0.0.26
  - @aeriajs/common@0.0.14

## 0.0.29

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.12
  - @aeriajs/api@0.0.25
  - @aeriajs/builtins@0.0.25
  - @aeriajs/common@0.0.13

## 0.0.28

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.11
  - @aeriajs/api@0.0.24
  - @aeriajs/builtins@0.0.24
  - @aeriajs/common@0.0.12

## 0.0.27

### Patch Changes

- Updated dependencies
  - @aeriajs/builtins@0.0.23
  - @aeriajs/types@0.0.10
  - @aeriajs/api@0.0.23
  - @aeriajs/common@0.0.11

## 0.0.26

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.9
  - @aeriajs/api@0.0.22
  - @aeriajs/builtins@0.0.22
  - @aeriajs/common@0.0.10

## 0.0.25

### Patch Changes

- Add -k option to aeria-build

## 0.0.24

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.21
  - @aeriajs/builtins@0.0.21

## 0.0.23

### Patch Changes

- @aeriajs/api@0.0.20
- @aeriajs/builtins@0.0.20

## 0.0.22

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.8
  - @aeriajs/api@0.0.19
  - @aeriajs/builtins@0.0.19
  - @aeriajs/common@0.0.9

## 0.0.21

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.7
  - @aeriajs/api@0.0.18
  - @aeriajs/builtins@0.0.18
  - @aeriajs/common@0.0.8

## 0.0.20

### Patch Changes

- @aeriajs/api@0.0.17
- @aeriajs/builtins@0.0.17

## 0.0.19

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.16
  - @aeriajs/builtins@0.0.16

## 0.0.18

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.15
  - @aeriajs/builtins@0.0.15

## 0.0.17

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.14
  - @aeriajs/types@0.0.6
  - @aeriajs/builtins@0.0.14
  - @aeriajs/common@0.0.7

## 0.0.16

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.5
  - @aeriajs/api@0.0.13
  - @aeriajs/builtins@0.0.13
  - @aeriajs/common@0.0.6

## 0.0.15

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.4
  - @aeriajs/api@0.0.12
  - @aeriajs/builtins@0.0.12
  - @aeriajs/common@0.0.5

## 0.0.14

### Patch Changes

- @aeriajs/api@0.0.11
- @aeriajs/builtins@0.0.11

## 0.0.13

### Patch Changes

- Remove unused deps from dependency tree
- Updated dependencies
  - @aeriajs/builtins@0.0.10
  - @aeriajs/common@0.0.4
  - @aeriajs/types@0.0.3
  - @aeriajs/api@0.0.10

## 0.0.12

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.2
  - @aeriajs/api@0.0.9
  - @aeriajs/builtins@0.0.9
  - @aeriajs/common@0.0.3

## 0.0.11

### Patch Changes

- Updated dependencies
  - @aeriajs/types@0.0.1
  - @aeriajs/api@0.0.8
  - @aeriajs/builtins@0.0.8
  - @aeriajs/common@0.0.2

## 0.0.10

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.7
  - @aeriajs/builtins@0.0.7

## 0.0.9

### Patch Changes

- Include dotfiles in glob search

## 0.0.8

### Patch Changes

- Dont generate aeria-sdk.d.ts if compilation fails

## 0.0.7

### Patch Changes

- @aeriajs/api@0.0.6
- @aeriajs/builtins@0.0.6

## 0.0.6

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.5
  - @aeriajs/builtins@0.0.5

## 0.0.5

### Patch Changes

- Change path of .d.ts files

## 0.0.4

### Patch Changes

- Updated dependencies
  - @aeriajs/api@0.0.4
  - @aeriajs/builtins@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies
  - @aeriajs/builtins@0.0.3
  - @aeriajs/common@0.0.1
  - @aeriajs/api@0.0.3

## 0.0.2

### Patch Changes

- @aeriajs/api@0.0.2
- @aeriajs/builtins@0.0.2

## 0.0.1

### Patch Changes

- @aeriajs/api@0.0.1
- @aeriajs/builtins@0.0.1
