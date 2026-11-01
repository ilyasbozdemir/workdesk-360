import fs from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import JavaScriptObfuscator from 'javascript-obfuscator'
import type { ObfuscatorOptions } from 'javascript-obfuscator'

function controlledRendererObfuscator(shouldObfuscate: boolean): Plugin | null {
  if (!shouldObfuscate) return null

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
    async writeBundle(options, bundle) {
      // Rollup, generateBundle sonrasında dinamik import placeholder'larını (!~{...}~)
      // gerçek dosya adlarıyla değiştirir ve diske yazar.
      // Bu nedenle obfuscation işlemini writeBundle aşamasında diske yazılmış dosyalarda
      // çalıştırmak, dinamik chunk isimlerinin bozulmasını %100 engeller.
      const outDir = options.dir
      if (!outDir) return

      for (const fileName in bundle) {
        if (!fileName.endsWith('.js') && !fileName.endsWith('.mjs')) {
          continue
        }
        const targetPath = path.resolve(outDir, fileName)
        if (!fs.existsSync(targetPath)) continue

        try {
          const rawCode = fs.readFileSync(targetPath, 'utf8')
          const obfuscated = JavaScriptObfuscator.obfuscate(rawCode, obfuscatorOptions)
          fs.writeFileSync(targetPath, obfuscated.getObfuscatedCode(), 'utf8')
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
  // Temin 360 masaüstü uygulaması varsayılan olarak 4734 m.22 Doğrudan Temin sürümüdür
  const edition = mode === 'full' ? 'full' : 'dogrudan-temin'
  const define = { 'import.meta.env.VITE_APP_EDITION': JSON.stringify(edition) }

  const isReleaseWorkflow =
    Boolean(process.env.BUILD_FOR_RELEASE) ||
    (Boolean(process.env.GITHUB_WORKFLOW) && /release/i.test(process.env.GITHUB_WORKFLOW || ''))

  const isTestOrCI =
    process.env.NODE_ENV === 'test' ||
    (Boolean(process.env.CI) && !isReleaseWorkflow) ||
    process.env.VITE_TEST === 'true' ||
    process.env.VITE_BYTECODE === 'false'

  const isProduction = (command === 'build' || process.env.NODE_ENV === 'production') && !isTestOrCI
  const obfuscator = controlledRendererObfuscator(isProduction)

  return {
    main: {
      define,
      build: {
        bytecode: !isTestOrCI,
        sourcemap: false,
        externalizeDeps: {
          exclude: ['@temin360/document-templates']
        }
      }
    },
    preload: {
      define,
      build: {
        bytecode: !isTestOrCI,
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
