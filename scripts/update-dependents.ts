#!/usr/bin/env -S pnpm ts-node --swc

import * as fs from 'fs'
import { $ } from './util'

const { GITHUB_TOKEN } = process.env

const updateDependent = async (repo: string) => {
  const repoName = repo.split('/').pop()!

  await $([
    `git clone https://x-access-token:${GITHUB_TOKEN}@github.com/${repo}.git /tmp/${repoName}`,
    `cd /tmp/${repoName}`,
    'pnpm update --recursive',
  ])

  const diffOutput = await $([
    `cd /tmp/${repoName}`,
    'git diff --name-only | grep -oE "packages/([^\\/]+)" | uniq'
  ])

  const updatedWorkspaces = diffOutput.split('\n').map((pkg) => pkg.trim())

  const updatedPackages: string[] = []
  for ( const workspace of updatedWorkspaces ) {
    const packageJson = await fs.promises.readFile(`/tmp/${repoName}/${workspace}/package.json`, {
      encoding: 'utf-8'
    })

    const { name } = JSON.parse(packageJson)
    if( name ) {
      updatedPackages.push(name)
    }
  }

  const changeset = `
---
${updatedPackages.map((pkg) => `"${pkg}": patch`).join('\n')}
---

Update upstream
  `.trim()

  const fileName = await $('mktemp -u | cut -d"/" -f 3')

  await fs.promises.writeFile(`/tmp/${repoName}/.changeset/${fileName}.md`, changeset)
  await $([
    `cd /tmp/${repoName}`,
    'git config --global user.name "Github Actions"',
    'git config --global user.email "minenwerfer@users.noreply.github.com"',
    'git add .',
    'git commit -m "chore(deps): update upstream"',
    'git push',
  ])
}

const main = async () => {
  if( process.env.GITHUB_ACTIONS && !GITHUB_TOKEN ) {
    console.info('not running since GITHUB_TOKEN is absent')
    return
  }

  await $('npm config set strict-peer-deps=false')
  await updateDependent('aeria-org/aeria-ui')
}

main()

