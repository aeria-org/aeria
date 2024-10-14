import { expect, test } from 'vitest'
import { getValueFromPath } from '../src/index.js'

test('gets value from path', async () => {
  const obj = {
    name: 'terry',
    nested: {
      job: 'programmer',
      deeper: {
        x: 1,
      },
    },
  }

  expect(getValueFromPath(obj, 'name')).toBe('terry')
  expect(getValueFromPath(obj, 'nested.job')).toBe('programmer')
  expect(getValueFromPath(obj, 'nested.deeper.x')).toBe(1)
})


