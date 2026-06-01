# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is **Aeria** — a pnpm monorepo containing a full-stack framework for building CRUD-based webapps with MongoDB. The monorepo lives under `packages/` plus a `playground/` used for integration testing.

Node.js >=23 required. Package manager: `pnpm@10.29.3`.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages (sequential, order matters — see scripts/build.sh)
pnpm build

# Run all tests
pnpm test

# Run tests for a single package
pnpm --filter='./packages/core' test
pnpm --filter='./packages/common' test

# Run typecheck for a package (where supported)
pnpm --filter='./packages/core' test:typecheck

# Lint
pnpm --filter='./packages/core' lint
pnpm --filter='./packages/core' lint:fix

# Run playground
cd playground && pnpm start
```

The build order is encoded in `scripts/build.sh`. When touching multiple packages, build them in the order listed there: `types → common → entrypoint → validation → http → node-http → security → core → builtins → server → compiler → aeria-sdk → cli → aeria → create-aeria-app → aeria-populate`.

## Package Map

| Package | Scope | Role |
|---|---|---|
| `@aeriajs/types` | types | Shared TypeScript types — `Collection`, `Description`, `Context`, `Contract`, `Result`, `ACError`, etc. The source of truth for the type system. |
| `@aeriajs/common` | common | Pure utilities: `deepMerge`, `freshItem`, `pipe`, `endpointError`, `isGranted`, `throwIfError`, `deserialize`, etc. No side effects. |
| `@aeriajs/validation` | validation | Schema validation against `Description` properties. Used by routing layer. |
| `@aeriajs/entrypoint` | entrypoint | Loads the application's entrypoint at runtime (via `AERIA_MAIN` env or `package.json#aeriaMain`). Memoizes `getCollections()`, `getConfig()`, and per-collection lookups. |
| `@aeriajs/http` | http | Framework-agnostic HTTP layer: `createRouter()`, routing with `Contract`-typed handlers, CORS, payload parsing. |
| `@aeriajs/node-http` | node-http | Node.js adapter (driver) that bridges `node:http` to `@aeriajs/http`. |
| `@aeriajs/security` | security | RBAC/ownership/immutability middlewares, rate limiting, token validation. Middlewares compose via `iterableMiddlewares`. |
| `@aeriajs/core` | core | Collection lifecycle: `defineCollection`, `createContext`, `getFunction`, CRUD functions (`get`, `getAll`, `insert`, `remove`, `upload`, …), MongoDB abstraction via `getDatabaseCollection`. |
| `@aeriajs/builtins` | builtins | Built-in collections: `user`, `file`, `log`, `resourceUsage`. Auth flows: `authenticate`, `createAccount`, `activate`, `redefinePassword`. Also exports `describe` endpoint. |
| `@aeriajs/server` | server | Wires everything together: `init()`, `registerRoutes()`, request handler, warmup, `safeHandle`. The `handler.ts` maps REST verbs to collection functions. |
| `@aeriajs/compiler` | compiler | Aeria DSL compiler: lexer → parser → AST → semantic analysis → codegen. Generates TypeScript/JS collections and contracts from `.aeria` files. |
| `@aeriajs/cli` | cli | CLI wrapping the compiler, handles `aeria -ci` invocations. |
| `aeria-sdk` | aeria-sdk | Client SDK: `createInstance`, `mirror` (downloads descriptions + router schema, generates `aeria-sdk.d.ts`), `upload`, auth helpers. |
| `aeria` | aeria | Umbrella re-export: re-exports everything from all `@aeriajs/*` packages. User-facing API. |

## Architecture

### Request lifecycle

```
HTTP request
  → node-http driver
  → @aeriajs/http router (matches path, validates payload against Contract)
  → @aeriajs/server handler (safeHandle → regularVerb/customVerbs)
  → @aeriajs/security middlewares (rate limit, ownership, immutability)
  → @aeriajs/core function (get/getAll/insert/remove/…)
  → MongoDB via getDatabaseCollection()
  → Result.error / Result.result
```

### Collections

A **collection** is the fundamental unit. Define one with `defineCollection()` from `@aeriajs/core`:

- `description` — the schema (`Description`) describing MongoDB fields, validations, relations.
- `functions` — handlers, each receiving `(payload, context)`. Built-in CRUD functions live in `packages/core/src/functions/`.
- `exposedFunctions` — maps function names to `AccessCondition` (controls RBAC via `@aeriajs/security`).
- `security` — optional `CollectionSecurityPolicy` for ownership and immutability rules.

Collections are registered via the app's entrypoint (`collections` export) and discovered at runtime by `@aeriajs/entrypoint`.

### Context object

Every collection function and route handler receives a `Context` / `RouteContext`. It provides:
- `context.collections` — proxy that gives typed access to any collection's functions with an auto-created child context.
- `context.token` — decoded JWT (subject, roles).
- `context.request` — typed payload/query/headers.
- `context.config` — `ApiConfig` loaded from entrypoint.

### SDK / Mirror

`aeria-sdk mirror` calls `GET /describe` on a running server, receives all collection descriptions + router schema, and writes `aeria-sdk.d.ts`. This is how the client gets 1:1 types. The `.aeria/out/` directory contains compiled output from the Aeria DSL compiler.

### Aeria DSL compiler

`.aeria` files declare `collection` and `contract` blocks using the DSL. The compiler pipeline: `lexer → parser (AST) → semantic analysis → codegen`. Codegen produces TypeScript collection definitions and contract objects under `.aeria/out/`.

## Testing

Tests use **Vitest**. Packages with tests: `core`, `common`, `security`, `http`. The `playground/` acts as a live integration fixture — core and http packages reference `tests/fixtures/aeriaMain.js` via `package.json#aeriaMain` to spin up a real server for integration tests.

Test timeout is 100,000ms (configured in root `vitest.config.ts`).

## Key Conventions

- All packages are ESM (`"type": "module"`), use `moduleResolution: "nodenext"`, and import with `.js` extensions even for `.ts` source files.
- `Result` type pattern: functions return `Result.error(...)` or `Result.result(...)` from `@aeriajs/types`. Use `throwIfError` or destructure `{ error, result }`.
- Access control errors use the `ACError` enum from `@aeriajs/types`.
- Security middlewares are composed with `iterableMiddlewares` — they receive and return an async iterator of `Result`.
- The `AERIA_MAIN` environment variable overrides the entrypoint path for testing.
