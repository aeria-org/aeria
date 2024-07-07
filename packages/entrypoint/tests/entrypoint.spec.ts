import assert from 'assert'
import * as fs from 'fs'
import * as entrypoint from '../dist/index.js'

const testsCwd = process.cwd()

const relativePath = (path: string) => {
  return path.split('/').slice(-2).join('/')
}

const onDirectory = async (dir: string, cb: (...args: any[]) => any) => {
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

describe('Payload', () => {
  it('gets correct entrypoint path', async () => {
    const path1 = await onDirectory('tests/fixtures/cjs', entrypoint.getEntrypointPath)
    const path2 = await onDirectory('tests/fixtures/esm', entrypoint.getEntrypointPath)

    assert(relativePath(path1) === 'aeria/index.js')
    assert(fs.existsSync(path1))
    assert(relativePath(path2) === 'aeria/index.mjs')
    assert(fs.existsSync(path2))
  })

  it('imports entrypoint correctly (cjs)', async () => {
    const entry = await onDirectory('tests/fixtures/cjs', entrypoint.getEntrypoint)
    assert(entry.collections)
    assert(entry.collections.test.description.$id === 'test')
  })

  it('imports entrypoint correctly (esm)', async () => {
    const entry = await onDirectory('tests/fixtures/esm', entrypoint.getEntrypoint)
    assert(entry.collections)
    assert(entry.collections.test.description.$id === 'test')
  })

  it('retrieves router correctly (cjs)', async () => {
    const router = await onDirectory('tests/fixtures/cjs', entrypoint.getRouter)
    assert(router)
  })

  it('retrieves router correctly (esm)', async () => {
    const router = await onDirectory('tests/fixtures/esm', entrypoint.getRouter)
    assert(router)
  })

  it('doesnt mutate collections', async () => {
    const collectionBefore = await onDirectory('tests/fixtures/esm', () => entrypoint.getCollection('test'))
    collectionBefore.dummy = true

    const collectionAfter = await onDirectory('tests/fixtures/esm', () => entrypoint.getCollection('test'))
    const collections = await onDirectory('tests/fixtures/esm', entrypoint.getCollections)
    assert(!collectionAfter.dummy)
    assert(!collections.test.dummy)
  })
})

