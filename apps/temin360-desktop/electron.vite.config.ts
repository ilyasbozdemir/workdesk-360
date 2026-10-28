import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import JavaScriptObfuscator from 'javascript-obfuscator'
import type { ObfuscatorOptions } from 'javascript-obfuscator'

function controlledRendererObfuscator(isProduction: boolean): Plugin | null {
  if (!isProduction) return null

  const obfuscatorOptions: ObfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.8,
    rotateStringArray: true,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    sourceMap: false
  }

  return {
    name: 'vite-plugin-controlled-renderer-obfuscator',
    apply: 'build',
    enforce: 'post',
    renderChunk(code, chunk) {
      if (!chunk.fileName.endsWith('.js') && !chunk.fileName.endsWith('.mjs')) {
        return null
      }
      try {
        const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions)
        return {
          code: obfuscated.getObfuscatedCode(),
          map: null
        }
      } catch (error) {
        console.warn(`[Obfuscator] Uyarı: ${chunk.fileName} karıştırılırken hata oluştu:`, error)
        return null
      }
    }
  }
}

export default defineConfig(({ mode, command }) => {
  // Temin 360 masaüstü uygulaması varsayılan olarak 4734 m.22 Doğrudan Temin sürümüdür
  const edition = mode === 'full' ? 'full' : 'dogrudan-temin'
  const define = { 'import.meta.env.VITE_APP_EDITION': JSON.stringify(edition) }
  const isProduction = command === 'build' || process.env.NODE_ENV === 'production'
  const obfuscator = controlledRendererObfuscator(isProduction)

  return {
    main: {
      define,
      build: {
        bytecode: true,
        sourcemap: false,
        externalizeDeps: {
          exclude: ['@temin360/document-templates']
        }
      }
    },
    preload: {
      define,
      build: {
        bytecode: true,
        sourcemap: false
      }
    },
    renderer: {
      define,
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      build: {
        sourcemap: false
      },
      plugins: [react(), ...(obfuscator ? [obfuscator] : [])]
    }
  }
})
