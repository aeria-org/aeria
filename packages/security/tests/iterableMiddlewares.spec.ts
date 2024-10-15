import type { Context } from '@aeriajs/types'
import { expect, test } from 'vitest'
import { iterableMiddlewares } from '../src/index.js'

const mockContext = () => ({}) as Context

test('payload traverses through middlewares correctly', async () => {
  const context = mockContext()
  const initial = {
    count: 0,
  }

  const start = iterableMiddlewares<typeof initial, typeof initial>([
    (payload, context, next) => next({ count: payload.count + 1 }, context),
    (payload, context, next) => next({ count: payload.count + 1 }, context),
  ])

  const result = start(initial, context)
  expect(result.count).toBe(2)
})


test('end function executes correctly', async () => {
  const context = mockContext()
  const initial = {
    count: 0,
  }

  const start = iterableMiddlewares<typeof initial, typeof initial>([
    (payload, context, next) => next(payload, context),
  ], (payload) => {
      return {
        count: payload.count + 2
      }
    })

  const result = start(initial, context)
  expect(result.count).toBe(2)
})

