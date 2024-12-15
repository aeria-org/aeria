# Contributing Guide

First of all, we thank very much anyone who whishes to contribute to Aeria. Without you, keeping the project wouldn't be possible.
Although every contribution is more than welcome, there are a few practices that help keeping the code consistent, maintenable, and without bugs. We ask you to go over this 2-minutes read before opening your first PR.

## Philosophy

- **DON'T add new features**, unless it is extremelly needed
- Keep the code small, elegant, and pleasant to read
- Use as few dependencies as possible
- Catch up with latest versions of NodeJS and dependencies
- For more meaningful changes, open an issue first
- Always write tests for meaningful changes

## Technical good practices

ESLint will take care of most of the style guide, but there are some things to consider when writing code:

- Don't create classes, use closures to emulate class state instead
- Make variables `const` unless they are really meant to be mutable
- Make typing as sound as possible (read this [](https://effectivetypescript.com/2021/05/06/unsoundness/)):
  - avoid using `any` (use the safer `unknown` or `object` types instead)
  - avoid using type casting at all
  - avoid abusing optional chaining and assertion operators (`obj?.prop` or `obj!.prop`), see first it there is a better way to narrow down the type
- Prefix NodeJS's builtin modules with `node:` (for instance: `node:fs/promises`)
- Use `for ... of` or `for ... in` iterations unless the other way is clearly more benefical
- Give meaningful names for callback parameters when possible (`[propName, property]` instead of `[key, value]`)
- Prefer `import type { Type } from 'package'` over `import { type Type } from 'package'` when possible

## IA usage policy

It's pretty clear at this point it's impossible to avoid having IA-generated code in community-maintaned projects. You can ask IA for help if you need it, we just ask you to avoid copying and pasting code directly without adapting it to our naming and style patterns first. Better off, don't copy and paste code at all.
  
