import { compileAndSpawn } from './watch.js'

const result = compileAndSpawn()

process.on('SIGTERM', async () => {
  const proc = await result
  if( !proc ) {
    process.exit(1)
  }

  if( proc.exitCode !== null ) {
    process.exit(1)
  }

  proc.kill()
  proc.on('exit', () => {
    process.exit(0)
  })
})
