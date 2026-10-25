import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Temin 360 masaüstü uygulaması varsayılan olarak 4734 m.22 Doğrudan Temin sürümüdür
  const edition = mode === 'full' ? 'full' : 'dogrudan-temin'
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
