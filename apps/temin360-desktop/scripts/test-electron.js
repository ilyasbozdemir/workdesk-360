const { spawn } = require('child_process')
const path = require('path')

const electronPath = require('electron')
const vitestPath = path.resolve(__dirname, '../node_modules/vitest/vitest.mjs')

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
