import type { ObjectId } from 'bson'
import type { Token } from '@aeriajs/types'
import { expect, test } from 'vitest'
import { isGranted } from '../src/index.js'

test('check if token has permissions correctly', async () => {
  const unauthenticated: Token = {
    authenticated: false,
    sub: null,
  }

  const authenticated: Token = {
    authenticated: true,
    sub: {} as ObjectId,
    userinfo: {},
    roles: [
    // @ts-expect-error
      'customer',
    ],
  }

  expect(isGranted('unauthenticated', unauthenticated)).toBeTruthy()
  expect(isGranted(['unauthenticated'], unauthenticated)).toBeTruthy()
  // @ts-expect-error
  expect(isGranted(['customer'], unauthenticated)).toBeFalsy()
  // @ts-expect-error
  expect(isGranted(['customer'], authenticated)).toBeTruthy()
  expect(isGranted(['root'], authenticated)).toBeFalsy()
  expect(isGranted(['unauthenticated'], authenticated)).toBeFalsy()
  expect(isGranted('unauthenticated', authenticated)).toBeTruthy()
  expect(isGranted('unauthenticated-only', authenticated)).toBeFalsy()
})

