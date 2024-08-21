# Aeria ![https://github.com/aeria-org/aeria/actions/workflows/ci.yaml](https://github.com/aeria-org/aeria/actions/workflows/ci.yaml/badge.svg)

<img
  align="left"
  src="/assets/aeria-logo.png"
  alt="Aeria Logo" 
  width="190px"
  height="190px"
/>


```typescript
router.GET('/get-pets/(\\w+)', (context) => {
  return context.collections.pet.functions.getAll({
    filters: {
      name: context.request.fragments[0]
    }
  })
})
```

<br clear="left" />

## Introduction

Aeria is a **backend framework** tuned for the enterprise. It features everything needed to build **secure** and **auditable** environments: routing, model definition, runtime validation, rate limiting, et cetera. It also tries to combine the richness of features that will ensure a fast-paced development with a elegant and minimalist coding style that will bring joy to work time.

## Features

- 🔒 Secure by design
- 🤌 Minimalistically crafted DX
- ⚡ Fast reloads in watch mode with esbuild
- 🪞 Automatic reflection of HTTP endpoints
- 🔋 Batteries included (authentication, access control, file management, logging, etc)
- 😱 _and much more!_

## Quickstart

```sh
$ npm create -y aeria-app hello-world
```

## Community

[![Aeria Server](https://img.shields.io/discord/1218448912185163816.svg?label=Discord&logo=Discord&colorB=7289da&style=for-the-badge)](https://discord.aeria.land/)


## Resources

- [Official Documentation](https://aeria.land/docs/aeria/)
- [Aeria UI](https://aeria.land/docs/aeria-ui/)
- [Aeria SDK](https://aeria.land/docs/aeria-sdk/)

