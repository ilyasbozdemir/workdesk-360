const { spawn } = require('child_process')
const path = require('path')

const localNodeModules = path.resolve(__dirname, '../node_modules')
const electronViteBin = path.join(localNodeModules, 'electron-vite/bin/electron-vite.js')
const subCmd = process.argv[2] || 'dev'
const configPath = path.resolve(__dirname, '../electron.vite.config.cjs')

const child = spawn(process.execPath, [electronViteBin, subCmd, '-c', configPath], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
})

child.on('close', (code) => {
  process.exit(code || 0)
})
