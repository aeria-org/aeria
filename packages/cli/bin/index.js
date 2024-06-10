#!/usr/bin/env node

(async () => {
  const { main } = await import('../dist/cli.js')
  main()
})()
