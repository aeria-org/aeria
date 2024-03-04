# Aeria ![https://github.com/aeria-org/aeria/actions/workflows/ci.yaml](https://github.com/aeria-org/aeria/actions/workflows/ci.yaml/badge.svg)

<img
  align="left"
  src="/assets/aeria-logo.png"
  alt="Aeria Logo" 
  width="190px"
  height="190px"
/>


A source of truth and REST framework for the busy developer.

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

## Quickstart

```sh
$ npm create -y aeria-app hello-world
```

## Features

### Minimalistically typed

A type-driven experience is provided with state-of-the-art TypeScript, no code generation required. Define your collection structure with a runtime JavaScript object then it's type will be made universally available, even to the frontend.

### A more cohesive fullstack

Aeria makes your backend metadata fully available to the frontend with [JSON Schema](https://json-schema.org/), allowing third parties to quickly grasp how your data should be rendered. The official counterpart library [Aeria UI]() makes possible to bring up a complete frontend for an Aeria backend within minutes.

### Better error handling

Inspired by functional languages, Aeria makes use of the much safer and runtime efficient `Either` approach to error handling. Route callbacks have their exceptions handled by default, so your application won't crash if you miss a try/catch block.

### Runtime safety

All input data is optionally validated using the same schemas used during collection definition. Role-based access control and security checks for [common security weaknesses](https://github.com/aeria-org/aeria/tree/master/packages/security) are also shipped to allow even those who are unfamiliar with AppSec to build safely.


## Resources

- [Official Documentation](https://aeria.land/aeria/)
- [Aeria UI](https://aeria.land/aeria-ui/)
- [Aeria SDK](https://aeria.land/aeria-sdk/)
- [Aeria Lang](https://aeria.land/aeria-lang/)

