import { getDatabase, insert, createContext, type InsertReturnType } from 'aeria'
import { parseArgs, styleText, inspect } from 'node:util'
import * as fs from 'node:fs'
import * as yaml from 'yaml'
import * as markdown from 'marked'
import * as chokidar from 'chokidar'

type FrontmatterObject = {
  collection: string
  unique: string
  content: string
  document: Record<string, unknown>
}

const { positionals, values: opts } = parseArgs({
  allowPositionals: true,
  options: {
    compileMarkdown: {
      type: 'boolean',
      short: 'c',
    },
    dropCollections: {
      type: 'boolean',
      short: 'd',
    },
    watch: {
      type: 'boolean',
      short: 'w',
    },
  },
})

const dbPromise = getDatabase()

const isValidFrontmatterObject = (value: unknown): value is FrontmatterObject => {
  return !!(
    value
    && typeof value === 'object'
    && 'collection' in value
    && 'unique' in value
    && 'content' in value
    && 'document' in value
    && value.document
    && typeof value.collection === 'string'
    && typeof value.unique === 'string'
    && typeof value.content === 'string'
    && typeof value.document === 'object'
  )
}

const parseMarkdown = async (text: string) => {
  const [, frontmatterString, ...splitContent] = text.split('---')
  let content = splitContent.join('---').trim()
  if( opts.compileMarkdown ) {
    content = await markdown.parse(content)
  }

  const frontmatter = yaml.parse(frontmatterString)
  if( !isValidFrontmatterObject(frontmatter) ) {
    throw new Error('invalid frontmatter')
  }

  return {
    frontmatter,
    content,
  }
}

const work = async (text: string) => {
  const { db } = await dbPromise
  if( !db ) {
    throw new Error()
  }

  const { frontmatter, content } = await parseMarkdown(text)

  const context = await createContext({
    collectionName: frontmatter.collection,
  })

  const existing = await db.collection(frontmatter.collection).findOne({
    [frontmatter.unique]: frontmatter.document[frontmatter.unique],
  }, {
    projection: {
      _id: 1,
    },
  })

  let insertion: InsertReturnType<unknown>
  if( existing ) {
    insertion = await insert({
      what: {
        ...frontmatter.document,
        [frontmatter.content]: content,
        _id: existing._id,
      },
    }, context)
  } else {
    insertion = await insert({
      what: {
        ...frontmatter.document,
        [frontmatter.content]: content,
      },
    }, context)
  }

  return {
    insertion,
    frontmatter,
    existing,
  }
}

const visitFile = async (file: string) => {
  let failed = 0, successful = 0

  const content = await fs.promises.readFile(file, {
    encoding: 'utf-8',
  })

  const { insertion: { error }, frontmatter, existing } = await work(content)
  const uniqueName = styleText(['bold'], frontmatter.document[frontmatter.unique] as string)
  const collectionName = styleText(['bold'], frontmatter.collection)

  if( error ) {
    const actionText = existing
      ? `update ${uniqueName} into collection`
      : `add ${uniqueName} to collection`

    console.log(styleText(['red'], 'x'), "couldn't", actionText, collectionName)
    console.log(inspect(error, {
      depth: null,
    }))

    failed++

  } else {
    const actionText = existing
      ? 'updated into collection'
      : 'added to collection'

    console.log(styleText(['green'], '✓'), uniqueName, 'successfully', actionText, collectionName)
    successful++
  }

  return {
    failed,
    successful,
  }
}

export const main = async () => {
  const [pattern] = positionals
  if( !pattern ) {
    console.error('this command takes a glob pattern as positional parameter')
    process.exit(1)
  }

  const { client, db } = await dbPromise
  if( !db ) {
    throw new Error()
  }

  const files = await Array.fromAsync(fs.promises.glob(pattern))

  if( opts.watch ) {
    if( opts.dropCollections ) {
      console.error("--dropCollections can't be used together with --watch")
      process.exit(1)
    }

    const watcher = chokidar.watch(files)
    console.log('watching for changes in ', styleText(['bold'], pattern))

    watcher.on('change', async (filePath) => {
      await client.connect()
      await visitFile(filePath)
    })

  } else {
    let failed = 0, successful = 0, dropped = 0
    const collections: string[] = []

    for ( const file of files ) {
      const content = await fs.promises.readFile(file, {
        encoding: 'utf-8',
      })

      const { frontmatter } = await parseMarkdown(content)
      collections.push(frontmatter.collection)
    }

    if( opts.dropCollections ) {
      for( const collection of collections ) {
        if( (await db.listCollections().toArray()).some((subject) => collection === subject.name) ) {
          await db.collection(collection).drop()
          console.log(styleText(['green'], '✓'), 'dropped collection', styleText(['bold'], collection))
          dropped++
        }
      }
    }

    for ( const file of files ) {
      const result = await visitFile(file)
      failed += result.failed
      successful += result.successful
    }

    console.log(dropped, 'dropped collections:', collections.map((collection) => styleText(['bold'], collection)).join(', '))
    console.log(successful, 'documents imported successfully')
    console.log(failed, 'failed to import')

    if( failed ) {
      await client.close()
      process.exit(1)
    }
  }

  await client.close()
}

