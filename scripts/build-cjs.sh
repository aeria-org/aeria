#!/bin/sh

rm -rf packages/*/dist

pnpm --filter='./packages/types' build:cjs \
  && pnpm --filter='./packages/common' build:cjs \
  && pnpm --filter='./packages/entrypoint' build:cjs \
  && pnpm --filter='./packages/validation' build:cjs \
  && pnpm --filter='./packages/http' build:cjs \
  && pnpm --filter='./packages/node-http' build:cjs \
  && pnpm --filter='./packages/security' build:cjs \
  && pnpm --filter='./packages/core' build:cjs \
  && pnpm --filter='./packages/builtins' build:cjs \
  && pnpm --filter='./packages/server' build:cjs \
  && pnpm --filter='./packages/aeria-sdk' build:cjs \
  && pnpm --filter='./packages/compiler' build \
  && pnpm --filter='./packages/cli' build \
  && pnpm --filter='./packages/aeria' build:cjs


