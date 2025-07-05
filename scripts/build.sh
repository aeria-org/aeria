#!/bin/sh

rm -rf packages/*/dist

pnpm --filter='./packages/types' build \
  && pnpm --filter='./packages/common' build \
  && pnpm --filter='./packages/entrypoint' build \
  && pnpm --filter='./packages/validation' build \
  && pnpm --filter='./packages/http' build \
  && pnpm --filter='./packages/node-http' build \
  && pnpm --filter='./packages/security' build \
  && pnpm --filter='./packages/core' build \
  && pnpm --filter='./packages/builtins' build \
  && pnpm --filter='./packages/server' build \
  && pnpm --filter='./packages/compiler' build \
  && pnpm --filter='./packages/aeria-sdk' build \
  && pnpm --filter='./packages/cli' build \
  && pnpm --filter='./packages/aeria' build

