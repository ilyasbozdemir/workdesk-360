const { spawn } = require('child_process')

const electronPath = require('electron')
const vitestPath = require.resolve('vitest').replace(/index\.(c|m)?js$/, 'vitest.mjs')

const userArgs = process.argv.slice(2)
const args = [vitestPath, ...(userArgs.length > 0 ? userArgs : ['run'])]

const child = spawn(electronPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1'
  }
})

child.on('close', (code) => {
  process.exit(code || 0)
})
