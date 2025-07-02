import type * as AST from './ast.js'
import type { CompilationOptions } from './types.js'
import { generateContracts, generateExports, generateJSCollections, generateTSCollections } from './codegen/index.js'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'

type FileTree = {
  [P: string]: string | FileTree
}

const generateFileMap = async (fileTree: FileTree, outDir = '.') => {
  const mappedPaths: Record<string, string> = {}

  const mapPathTree = async (tree: FileTree, previousPath: string) => {
    for (const treePath in tree) {
      const currentPath = path.join(previousPath, treePath)
      if (typeof tree[treePath] === 'object') {
        await mapPathTree(tree[treePath], currentPath)
        continue
      }

      await fsPromises.mkdir(previousPath, {
        recursive: true,
      })

      mappedPaths[currentPath] = tree[treePath]
    }
    return
  }

  await mapPathTree(fileTree, outDir)
  return mappedPaths
}

export const generateCode = async (ast: AST.ProgramNode, options: CompilationOptions) => {
  const contracts = generateContracts(ast)
  const exports = generateExports(ast, {
    hasContracts: !!contracts,
  })

  const fileTree: FileTree = {
    ['collections']: {
      ['collections.d.ts']: generateTSCollections(ast),
      ['collections.js']: generateJSCollections(ast),
      ['index.d.ts']: exports.collections.dts,
      ['index.js']: exports.collections.js,
    },
    ['index.d.ts']: exports.index.dts,
    ['index.js']: exports.index.js,
  }

  if (contracts) {
    fileTree.contracts = {
      ['contracts.js']: contracts.js,
      ['contracts.d.ts']: contracts.dts,
      ['index.d.ts']: exports.contracts!.dts,
      ['index.js']: exports.contracts!.js,
    }
  }

  const fileStructure = await generateFileMap(fileTree, options.outDir)

  if (!options.dryRun) {
    for (const path in fileStructure) {
      await fsPromises.writeFile(path, fileStructure[path])
    }
  }

  return fileStructure
}

