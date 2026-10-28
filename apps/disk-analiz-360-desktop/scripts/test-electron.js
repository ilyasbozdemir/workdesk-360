const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const localNodeModules = path.resolve(__dirname, '../node_modules')
const sharedNodeModules = path.resolve(__dirname, '../../flowdesk-desktop/node_modules')
const effectiveNodeModules = fs.existsSync(path.join(localNodeModules, 'electron'))
  ? localNodeModules
  : sharedNodeModules

if (!module.paths.includes(effectiveNodeModules)) {
  module.paths.unshift(effectiveNodeModules)
}

const electronPath = require('electron')
const vitestPath = require.resolve('vitest').replace(/index\.(c|m)?js$/, 'vitest.mjs')

const userArgs = process.argv.slice(2)
const args = [vitestPath, ...(userArgs.length > 0 ? userArgs : ['run'])]

const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_PATH: effectiveNodeModules
  }
})

child.on('close', (code) => {
  process.exit(code || 0)
})
