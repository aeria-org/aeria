#!/bin/sh

case $BRANCH_NAME in
  develop)
    pnpm changeset publish --tag nightly
  ;;
  *)
    pnpm changeset publish
  ;;
esac

