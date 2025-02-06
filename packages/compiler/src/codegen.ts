import type { CompilationOptions } from './compile.js'
import type * as AST from './ast'
import { generateContracts, generateExports, generateJSCollections, generateTSCollections } from './codegen/index.js'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'

/**
 * Maps the path tree into a object with the full paths
 * {
 *  folderX: {
 *    folderY: {
 *      file: ...
 *    }
 *  }
 * }
 * turns into
 * {
 *  ['rootDir/folderX/folderY/file']: ...
 * }
 */
const generateFileStructure = async (fileTree: Record<string, string | object>, rootDir: string) => {
  const mappedPaths: Record<string, string> = {}

  const mapPathTree = async (tree: Record<string, string | object>, previousPath: string) => {
    for (const treePath in tree) {
      const currentPath = path.join(previousPath, treePath)
      if (typeof tree[treePath] === 'object') {
        await mapPathTree(tree[treePath] as Record<string, string | object>, currentPath)
        continue
      }

      await fsPromises.mkdir(previousPath, {
        recursive: true,
      })

      mappedPaths[currentPath] = tree[treePath]
    }
    return
  }

  await mapPathTree(fileTree, rootDir)

  return mappedPaths
}

export const generateCode = async (ast: AST.ProgramNode, options: CompilationOptions) => {
  const contracts = generateContracts(ast.contracts)
  const exports = generateExports(ast, Boolean(contracts))

  const fileTree: Record<string, string | object> = {
    ['collections']: {
      ['collections.d.ts']: generateTSCollections(ast.collections),
      ['collections.js']: generateJSCollections(ast.collections),
      ['index.d.ts']: exports.collections.dTs,
      ['index.js']: exports.collections.js,
    },
    ['index.d.ts']: exports.main.dTs,
    ['index.js']: exports.main.js,
  }

  if (contracts) {
    fileTree.contracts = {
      ['contracts.js']: contracts.js,
      ['contracts.d.ts']: contracts.dTs,
      ['index.d.ts']: exports.contracts!.dTs,
      ['index.js']: exports.contracts!.js,
    }
  }

  const fileStructure = await generateFileStructure(fileTree, options.outDir)

  if (!options.dryRun) {
    for (const path in fileStructure) {
      await fsPromises.writeFile(path, fileStructure[path])
    }
  }

  return fileStructure
}
