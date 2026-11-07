import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { rootDir } from './analyzer/tsLoader.js'
import { analyzePackageDependencies } from './analyzer/dependencyAnalyzer.js'
import { analyzeSplitBrainResolvers } from './analyzer/splitBrainAnalyzer.js'
import { analyzeIpcSecurity } from './analyzer/ipcSecurityAnalyzer.js'
import { analyzeTemplatesAndMappings } from './analyzer/templateAnalyzer.js'
import { analyzeGodComponents } from './analyzer/godComponentAnalyzer.js'
import { analyzeStructuralClones } from './analyzer/cloneAnalyzer.js'
import { analyzeDeadCode } from './analyzer/deadCodeAnalyzer.js'
import { generateReports } from './analyzer/reporter.js'

/**
 * WorkDesk 360 — Mimari Analiz Motoru (V2.0)
 * Çalıştırmak için: pnpm analyze  (veya node scripts/analyze-codebase.mjs)
 */

console.log('================================================================================')
console.log('🔍 WORKDESK 360 — MİMARİ TEKNİK BORÇ VE KOD ANALİZ MOTORU (V2.0)')
console.log('================================================================================')
console.log('⚙️  AST ve Bağımlılık Taraması başlatılıyor...\n')

const startTime = Date.now()

function getFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = []
  const fullDir = path.isAbsolute(dir) ? dir : path.join(rootDir, dir)
  if (!fs.existsSync(fullDir)) return results
  const list = fs.readdirSync(fullDir)
  list.forEach(file => {
    const filePath = path.join(fullDir, file)
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/')
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      if (![
        'node_modules',
        'dist',
        'out',
        '.git',
        '.gemini',
        'build',
        '.agents',
        'dist-electron',
        'coverage',
        '.next',
        'dist-local',
        '.turbo'
      ].includes(file)) {
        results = results.concat(getFiles(filePath, exts))
      }
    } else {
      if (exts.includes(path.extname(file)) && !file.endsWith('.d.ts')) {
        results.push(relPath)
      }
    }
  })
  return results
}

const targetDirs = [
  'apps/temin360-desktop/src',
  'apps/ihale360-desktop/src',
  'apps/flowdesk-desktop/src',
  'apps/personel360-desktop/src',
  'apps/disk-analiz-360-desktop/src',
  'apps/app-workspace/src',
  'apps/app-archive/src',
  'packages/contracts',
  'packages/ecosystem-contracts/src',
  'packages/document-templates/src',
  'packages/document-engine/src',
  'packages/database/src',
  'packages/pdf-generator/src',
  'packages/domain/src'
]

const files = Array.from(new Set(targetDirs.flatMap(d => getFiles(d))))

// Dosya İstatistikleri
let totalLines = 0
files.forEach(f => {
  const full = path.join(rootDir, f)
  if (fs.existsSync(full)) {
    const content = fs.readFileSync(full, 'utf-8')
    totalLines += content.split(/\r?\n/).length
  }
})

console.log(`📦 Taranan Dosya Sayısı : ${files.length.toLocaleString('tr-TR')}`)
console.log(`📄 Toplam Satır Sayısı  : ${totalLines.toLocaleString('tr-TR')}`)
console.log('--------------------------------------------------------------------------------')

// 1. Paket Bağımlılık ve Sınır Analizi
console.log('⏳ [1/7] Paket Bağımlılık Grafiği ve Katman Sınırları Analiz Ediliyor...')
const depResult = analyzePackageDependencies(files)

// 2. Split-Brain Resolver Analizi
console.log('⏳ [2/7] Split-Brain Veri Otoriteleri ve Resolver Akışları İnceleniyor...')
const resolverResult = analyzeSplitBrainResolvers(files)

// 3. IPC Güvenlik ve Preload Analizi
console.log('⏳ [3/7] Electron IPC Güvenliği, Preload İzolasyonu ve SQL Guard Denetleniyor...')
const ipcResult = analyzeIpcSecurity(files)

// 4. Şablon, Mapping ve Snapshot Analizi
console.log('⏳ [4/7] Belge Şablonları, Mapping Registry ve Rota Uyumları İnceleniyor...')
const tmplResult = analyzeTemplatesAndMappings()

// 5. God-Component ve Mimari Karmaşıklık Analizi
console.log('⏳ [5/7] Çok Boyutlu God-Component Skorlaması Yapılıyor...')
const godResult = analyzeGodComponents(files)

// 6. AST Tabanlı Yapısal Kod Tekrarları
console.log('⏳ [6/7] Normalize Edilmiş AST Yapısal Klonlar Tespit Ediliyor...')
const cloneResult = analyzeStructuralClones(files)

// 7. Kullanılmayan Dışa Aktarımlar (Dead Code)
console.log('⏳ [7/7] Kullanılmayan Kod ve Yardımcı Fonksiyonlar Araştırılıyor...')
const deadResult = analyzeDeadCode(files)

// Tüm Bulguları Birleştir
const allFindings = [
  ...depResult.findings,
  ...resolverResult.findings,
  ...ipcResult.findings,
  ...tmplResult.findings,
  ...godResult.findings,
  ...cloneResult.findings,
  ...deadResult.findings
]

const scanStats = {
  totalFiles: files.length,
  totalLines
}

// Raporları Üret
console.log('\n📄 Raporlar hazırlanıyor ve diske yazılıyor...')
const { jsonPath, mdPath } = generateReports({
  scanStats,
  allFindings,
  packageGraph: depResult.packageGraph,
  templateStats: tmplResult.templateStats,
  godComponentStats: godResult.componentStats
})

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

console.log('\n================================================================================')
console.log('📊 WORKDESK 360 MİMARİ ANALİZ ÖZETİ')
console.log('================================================================================')
const p0Count = allFindings.filter(f => f.priority === 'P0').length
const p1Count = allFindings.filter(f => f.priority === 'P1').length
const p2Count = allFindings.filter(f => f.priority === 'P2').length

console.log(`🔴 Kritik Mimari Riskler (P0)      : ${p0Count}`)
console.log(`🟡 Yüksek Öncelikli Bulgular (P1)  : ${p1Count}`)
console.log(`⚪ Orta / Teknik İyileştirme (P2)   : ${p2Count}`)
console.log(`📌 Toplam Mimari Bulgu Sayısı       : ${allFindings.length}`)
console.log(`⏱️  Analiz Süresi                   : ${elapsed} saniye`)
console.log('--------------------------------------------------------------------------------')
console.log('📁 Üretilen Rapor Dosyaları:')
console.log(`   - Markdown : ${path.relative(rootDir, mdPath).replace(/\\/g, '/')}`)
console.log(`   - JSON     : ${path.relative(rootDir, jsonPath).replace(/\\/g, '/')}`)
console.log('================================================================================\n')

// Önemli P0 Bulgularını Konsola Yazdır (İlk 8 Adet)
if (p0Count > 0) {
  console.log(`🚨 ÖRNEK KRİTİK (P0) BULGULAR (Toplam ${p0Count} adet, ilk 8 listelendi):`)
  allFindings.filter(f => f.priority === 'P0').slice(0, 8).forEach((f, idx) => {
    console.log(`   ${idx + 1}. [${f.id}] -> ${f.file}`)
    console.log(`      Kanıt: ${f.evidence}`)
    console.log(`      Çözüm: ${f.recommendedSolution}\n`)
  })
}

// En Büyük 5 God-Component Konsol Özeti
console.log('👑 EN BÜYÜK 5 GOD-COMPONENT (Çok Boyutlu Skor):')
godResult.componentStats.slice(0, 5).forEach((gc, idx) => {
  console.log(`   ${idx + 1}. Skor: ${gc.godScore.toString().padStart(4, ' ')} | Satır: ${gc.lines.toString().padStart(4, ' ')} | Hook: ${gc.totalHooks.toString().padStart(2, ' ')} | IPC: ${gc.directIpcCallCount} -> ${gc.file}`)
})
console.log('\n✅ Analiz tamamlandı. Ayrıntılı inceleme için reports/codebase-analysis.md dosyasını açabilirsiniz.\n')
