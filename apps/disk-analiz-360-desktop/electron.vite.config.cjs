const { resolve } = require('path')
const fs = require('fs')

const localModules = resolve(__dirname, 'node_modules')
const sharedModules = resolve(__dirname, '../flowdesk-desktop/node_modules')
const modRoot = fs.existsSync(resolve(localModules, 'react')) ? localModules : sharedModules

if (!module.paths.includes(modRoot)) {
  module.paths.unshift(modRoot)
}

const { defineConfig } = require('electron-vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
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
    css: {
      postcss: {
        plugins: [
          require(resolve(modRoot, 'tailwindcss'))({
            config: resolve(__dirname, 'tailwind.config.js')
          }),
          require(resolve(modRoot, 'autoprefixer'))()
        ]
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared'),
        react: resolve(modRoot, 'react'),
        'react-dom': resolve(modRoot, 'react-dom'),
        'lucide-react': resolve(modRoot, 'lucide-react')
      }
    },
    plugins: [react()]
  }
})

