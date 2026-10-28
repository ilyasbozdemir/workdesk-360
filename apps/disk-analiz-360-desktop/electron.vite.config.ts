import { resolve } from 'path'
import fs from 'fs'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const localModules = resolve('node_modules')
const sharedModules = resolve('../flowdesk-desktop/node_modules')
const modRoot = fs.existsSync(resolve(localModules, 'react')) ? localModules : sharedModules

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@electron-toolkit/utils': resolve(modRoot, '@electron-toolkit/utils')
      }
    },
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'electron']
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@electron-toolkit/preload': resolve(modRoot, '@electron-toolkit/preload')
      }
    },
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        react: resolve(modRoot, 'react'),
        'react-dom': resolve(modRoot, 'react-dom'),
        'lucide-react': resolve(modRoot, 'lucide-react')
      }
    },
    plugins: [react()]
  }
})
