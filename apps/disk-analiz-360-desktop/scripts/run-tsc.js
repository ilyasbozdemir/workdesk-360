const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const localNodeModules = path.resolve(__dirname, '../node_modules')
const sharedNodeModules = path.resolve(__dirname, '../../flowdesk-desktop/node_modules')
const effectiveNodeModules = fs.existsSync(path.join(localNodeModules, 'typescript'))
  ? localNodeModules
  : sharedNodeModules

const tscBin = path.join(effectiveNodeModules, 'typescript/bin/tsc')
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
      cwd: appRoot,
      env: {
        ...process.env,
        NODE_PATH: effectiveNodeModules
      }
    }
  )
  if (res.status !== 0) {
    process.exit(res.status || 1)
  }
}

