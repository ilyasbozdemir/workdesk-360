import { defineConfig } from 'vitest/config'
import path from 'path'

const sharedModules = path.resolve(__dirname, '../flowdesk-desktop/node_modules')

export default defineConfig({
  resolve: {
    alias: {
      'better-sqlite3': path.join(sharedModules, 'better-sqlite3'),
      vitest: path.join(sharedModules, 'vitest')
    }
  },
  test: {
    environment: 'node'
  }
})
