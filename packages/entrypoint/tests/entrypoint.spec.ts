import { expect, test } from 'vitest'
import assert from 'assert'
import * as fs from 'fs'
import * as entrypoint from '../src/index.js'

const testsCwd = process.cwd()

const relativePath = (path: string) => {
  return path.split('/').slice(-2).join('/')
}

const onDirectory = async <T>(dir: string, cb: (...args: unknown[]) => T) => {
  process.chdir(dir)
  try {
    const result = await cb()
    process.chdir(testsCwd)
    return result
  } catch ( err ) {
    console.trace(err)
  }

  process.chdir(testsCwd)
}

test('gets correct entrypoint path', async () => {
  const path1 = await onDirectory('tests/fixtures/cjs', entrypoint.getEntrypointPath)
  const path2 = await onDirectory('tests/fixtures/esm', entrypoint.getEntrypointPath)

  assert(path1)
  assert(path2)
  expect(relativePath(path1)).toBe('aeria/index.js')
  expect(fs.existsSync(path1)).toBeTruthy()
  expect(relativePath(path2)).toBe('aeria/index.mjs')
  expect(fs.existsSync(path2)).toBeTruthy()
})

test('imports entrypoint correctly (cjs)', async () => {
  const entry = await onDirectory('tests/fixtures/cjs', entrypoint.getEntrypoint)
  expect(entry.collections).toBeTruthy()
  expect(entry.collections.test.description.$id).toBe('test')
})

test('imports entrypoint correctly (esm)', async () => {
  const entry = await onDirectory('tests/fixtures/esm', entrypoint.getEntrypoint)
  expect(entry.collections).toBeTruthy()
  expect(entry.collections.test.description.$id).toBe('test')
})

test('retrieves router correctly (cjs)', async () => {
  const router = await onDirectory('tests/fixtures/cjs', entrypoint.getRouter)
  expect(router).toBeTruthy()
})

test('retrieves router correctly (esm)', async () => {
  const router = await onDirectory('tests/fixtures/esm', entrypoint.getRouter)
  expect(router).toBeTruthy()
})

test('doesnt mutate collections', async () => {
  const collectionBefore = await onDirectory('tests/fixtures/esm', () => entrypoint.getCollection('test'))
  assert(collectionBefore)
  Object.assign(collectionBefore, {
    dummy: true,
  })

  const collectionAfter = await onDirectory('tests/fixtures/esm', () => entrypoint.getCollection('test'))
  const collections = await onDirectory('tests/fixtures/esm', entrypoint.getCollections)
  assert(collectionAfter)
  assert(collections)

  expect(Object.getOwnPropertyDescriptor(collectionAfter, 'dummy')?.value).toBeFalsy()
  expect(Object.getOwnPropertyDescriptor(collections.test, 'dummy')?.value).toBeFalsy()
})

