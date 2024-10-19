# Contributing Guide

Thank you for considering Aeria. We encourage and appreciate all contributions to the project in every form possible (code, support, documentation, etc). This page will guide you through best practices and instructions on how to contribute properly and get your contributions accepted by the community.

## General good practices

- Keep the codebase small (ideally smaller than 10k lines of code)
- Catch up with latest versions of NodeJS and dependencies
- Use as few dependencies as possible
- Don't create new features unless it's extremelly important
- For more meaningful changes, open an issue first

## Technical good practices

- Don't create classes, use higher order functions to emulate class state instead
- Make typing as sound as possible (read this [](https://effectivetypescript.com/2021/05/06/unsoundness/)):
  - avoid using `any` (use the safer `unknown` or `object` types instead)
  - avoid using type casting at all

## IA usage policy

It's pretty clear at this point it's impossible to avoid having IA-generated code in community-maintaned projects. You can ask IA for help if you need it, we just ask you to avoid copying and pasting code directly without adapting it to our naming and style patterns first. Better off, don't copy and paste code at all.
  
