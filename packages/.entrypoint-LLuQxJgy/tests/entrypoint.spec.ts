import { expect, test } from 'vitest'
import assert from 'node:assert'
import * as fs from 'node:fs'
import * as entrypoint from '../dist/index.js'

const testsCwd = process.cwd()

const relativePath = (path: string) => {
  return path.split('/').slice(-2).join('/')
}

const onDirectory = async <T>(dir: string, cb: ()=> T) => {
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
  const path = await onDirectory('tests/fixtures', entrypoint.getEntrypointPath)

  assert(path)
  expect(relativePath(path)).toBe('aeria/index.js')
  expect(fs.existsSync(path)).toBeTruthy()
})

test('imports entrypoint correctly', async () => {
  const entry = await onDirectory('tests/fixtures', entrypoint.getEntrypoint)
  expect(entry.collections).toBeTruthy()
  expect(entry.collections.test.description.$id).toBe('test')
})

test('retrieves router correctly', async () => {
  const router = await onDirectory('tests/fixtures', entrypoint.getRouter)
  expect(router).toBeTruthy()
})

test('doesnt mutate collections', async () => {
  const collectionBefore = await onDirectory('tests/fixtures', () => entrypoint.getCollection('test'))
  assert(collectionBefore)
  Object.assign(collectionBefore, { dummy: true })

  const collectionAfter = await onDirectory('tests/fixtures', () => entrypoint.getCollection('test'))
  const collections = await onDirectory('tests/fixtures', entrypoint.getCollections)
  assert(collectionAfter)
  assert(collections)

  expect(Object.getOwnPropertyDescriptor(collectionAfter, 'dummy')?.value).toBeFalsy()
  expect(Object.getOwnPropertyDescriptor(collections.test, 'dummy')?.value).toBeFalsy()
})

