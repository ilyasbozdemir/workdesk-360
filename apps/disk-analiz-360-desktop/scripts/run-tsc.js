const { spawnSync } = require('child_process')
const path = require('path')

const localNodeModules = path.resolve(__dirname, '../node_modules')
const tscBin = path.join(localNodeModules, 'typescript/bin/tsc')
const appRoot = path.resolve(__dirname, '..')

const target = process.argv[2] || 'all'
const projects =
  target === 'node'
    ? ['tsconfig.node.json']
    : target === 'web'
      ? ['tsconfig.web.json']
      : ['tsconfig.node.json', 'tsconfig.web.json']

for (const proj of projects) {
  const res = spawnSync(
    process.execPath,
    [tscBin, '--noEmit', '-p', proj, '--composite', 'false'],
    {
      stdio: 'inherit',
      cwd: appRoot
    }
  )
  if (res.status !== 0) {
    process.exit(res.status || 1)
  }
}
