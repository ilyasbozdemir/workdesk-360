import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // `--mode dogrudan-temin` → yalnızca 4734 m.22 Doğrudan Temin sürümü
  const edition = mode === 'dogrudan-temin' ? 'dogrudan-temin' : 'full'
  const define = { 'import.meta.env.VITE_APP_EDITION': JSON.stringify(edition) }

  return {
    main: {
      define,
      build: {
        externalizeDeps: {
          exclude: ['@temin360/document-templates']
        }
      }
    },
    preload: { define },
    renderer: {
      define,
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [react()]
    }
  }
})
