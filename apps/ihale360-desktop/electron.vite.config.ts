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
    generateBundle(_options, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName]
        if (chunk.type !== 'chunk' || (!fileName.endsWith('.js') && !fileName.endsWith('.mjs'))) {
          continue
        }
        try {
          const obfuscated = JavaScriptObfuscator.obfuscate(chunk.code, obfuscatorOptions)
          chunk.code = obfuscated.getObfuscatedCode()
        } catch (error) {
          const msg = `[Obfuscator Kritik Hata] ${fileName} dosyasının karıştırılması başarısız oldu!`
          console.error(msg, error)
          throw new Error(
            `${msg} Üretim (production) güvenliği için karıştırılmamış JavaScript derlemesine izin verilmez. Hata detayı: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        }
      }
    }
  }
}

export default defineConfig(({ mode, command }) => {
  // `--mode dogrudan-temin` → yalnızca 4734 m.22 Doğrudan Temin sürümü
  const edition = mode === 'dogrudan-temin' ? 'dogrudan-temin' : 'full'
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
