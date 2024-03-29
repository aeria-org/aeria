# Aeria ![https://github.com/aeria-org/aeria/actions/workflows/ci.yaml](https://github.com/aeria-org/aeria/actions/workflows/ci.yaml/badge.svg)

<img
  align="left"
  src="/assets/aeria-logo.png"
  alt="Aeria Logo" 
  width="190px"
  height="190px"
/>


A source of truth and REST toolkit.

```typescript
router.GET('/get-pets/(\w+)', (context) => {
  return context.collections.pet.functions.getAll({
    filters: {
      name: context.request.fragments[0]
    }
  })
})
```

<br clear="left" />

## Features

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

- [Official Documentation](https://aeria.land/aeria/)
- [Aeria UI](https://aeria.land/aeria-ui/)
- [Aeria SDK](https://aeria.land/aeria-sdk/)
- [Aeria Lang](https://aeria.land/aeria-lang/)

