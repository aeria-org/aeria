import { expect, test } from 'vitest'
import { pipe } from '../src/index.js'

test('traverses value through pipe', async () => {
  const run = pipe([
    (a: number) => a + 1,
    (a) => a + 2,
  ])

  expect(await run(0)).toBe(3)
})

