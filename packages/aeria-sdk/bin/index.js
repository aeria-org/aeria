#!/usr/bin/env node

import('../dist/cli.js').then(({ main }) => {
  main()
})
