# Aeria ![https://github.com/aeria-org/aeria/actions/workflows/ci.yaml](https://github.com/aeria-org/aeria/actions/workflows/ci.yaml/badge.svg)

[Documentation](https://aeria.land/docs/aeria/)

Aeria is a (<10k lines of code) batteries-included **web framework** built on top of **MongoDB**. It lets you define collections using a friendly [schema-definition language](https://github.com/aeria-org/aeria-lang) with support for denormalized data structures, arrays, native MongoDB references, file fields, and more. It also ships important security primitives like Role-Based Access Control.

Why? Because we believed the support for MongoDB offered by other frameworks and libraries was suboptimal in several ways, and no framework was cohesive enough. Aeria has model definition, runtime validation, routing, security, etc, all in one dependency.

```aeria
collection Pet {
  properties {
    name str
    pictures []{
      properties {
        file File @accept(["image/*"])
        description str
      }
    }
  }
  functions {
    get @expose
    getAll @expose
    insert @expose(["root"])
    remove @expose(["root"])
    upload @expose(["root"])
  }
}
```

## Features

- Secure by design
- Minimalistically crafted DX
- Fast reloads in watch mode with esbuild
- Automatic reflection of HTTP endpoints
- Batteries included (authentication, access control, file management, logging, etc)

## Quickstart

```sh
$ npm create -y aeria-app hello-world
```

## Community

[![Aeria Server](https://img.shields.io/discord/1218448912185163816.svg?label=Discord&logo=Discord&colorB=7289da&style=for-the-badge)](https://discord.aeria.land/)

