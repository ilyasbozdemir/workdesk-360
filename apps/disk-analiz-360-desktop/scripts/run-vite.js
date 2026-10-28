const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const localNodeModules = path.resolve(__dirname, '../node_modules')
const sharedNodeModules = path.resolve(__dirname, '../../flowdesk-desktop/node_modules')
const effectiveNodeModules = fs.existsSync(path.join(localNodeModules, 'electron-vite'))
  ? localNodeModules
  : sharedNodeModules

const electronViteBin = path.join(effectiveNodeModules, 'electron-vite/bin/electron-vite.js')
const subCmd = process.argv[2] || 'dev'
const configPath = path.resolve(__dirname, '../electron.vite.config.cjs')

const child = spawn(process.execPath, [electronViteBin, subCmd, '-c', configPath], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    NODE_PATH: effectiveNodeModules
  }
})

child.on('close', (code) => {
  process.exit(code || 0)
})

