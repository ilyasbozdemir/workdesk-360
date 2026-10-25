import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Varsayılan dosya konumu: Proje kökündeki YapimIhalesiBirimFiyatli.ods
const defaultOdsPath = path.resolve(__dirname, '../../../YapimIhalesiBirimFiyatli.ods')
const odsPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultOdsPath

const outputDir = path.resolve(__dirname, '../src/renderer/src/data/ekap')
const outputPath = path.join(outputDir, 'ekap_yapim_sablonu.json')

console.log(`[EKAP Sync] Dosya okunuyor: ${odsPath}`)

if (!fs.existsSync(odsPath)) {
  console.error(`[EKAP Sync Hata] Dosya bulunamadı: ${odsPath}`)
  process.exit(1)
}

const workbook = XLSX.readFile(odsPath)
const sayfa2 = workbook.Sheets['Sayfa2']

if (!sayfa2) {
  console.error(`[EKAP Sync Hata] 'Sayfa2' şablon sayfası bulunamadı!`)
  process.exit(1)
}

const rawRows = XLSX.utils.sheet_to_json(sayfa2, { header: 1 })

const birimlerSet = new Set()
const okasMap = new Map() // kod -> ad

rawRows.forEach((row, idx) => {
  if (!row || idx < 2) return // Başlık ve DEĞİŞTİRMEYİN satırlarını atla

  const birim = row[0]
  const okasRaw = row[1]

  if (birim && typeof birim === 'string') {
    const cleanBirim = birim.trim()
    if (cleanBirim && cleanBirim !== 'DEĞİŞTİRMEYİN') {
      birimlerSet.add(cleanBirim)
    }
  }

  if (okasRaw && typeof okasRaw === 'string') {
    const cleanOkas = okasRaw.trim()
    if (cleanOkas && cleanOkas !== 'DEĞİŞTİRMEYİN') {
      const lastDash = cleanOkas.lastIndexOf('-')
      if (lastDash > 0) {
        const ad = cleanOkas.substring(0, lastDash).trim()
        const kod = cleanOkas.substring(lastDash + 1).trim()
        if (kod) {
          okasMap.set(kod, ad)
        }
      }
    }
  }
})

const sortedBirimler = Array.from(birimlerSet).sort((a, b) => a.localeCompare(b, 'tr'))
const sortedOkas = Array.from(okasMap.entries())
  .map(([kod, ad]) => ({ kod, ad }))
  .sort((a, b) => a.kod.localeCompare(b.kod))

// Eski JSON var mı? Karşılaştırma yap
let oldJson = null
if (fs.existsSync(outputPath)) {
  try {
    oldJson = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
  } catch {
    // ignore
  }
}

// Diff hesapla
if (oldJson && Array.isArray(oldJson.okas)) {
  const oldOkasMap = new Map(oldJson.okas.map((item) => [item.kod, item.ad]))
  let addedCount = 0
  let changedCount = 0
  let removedCount = 0

  sortedOkas.forEach((item) => {
    if (!oldOkasMap.has(item.kod)) {
      addedCount++
    } else if (oldOkasMap.get(item.kod) !== item.ad) {
      changedCount++
    }
  })

  oldOkasMap.forEach((_, kod) => {
    if (!okasMap.has(kod)) {
      removedCount++
    }
  })

  console.log(`[EKAP Sync Diff Raporu]:`)
  console.log(`  - Eklenen OKAS kodları: ${addedCount}`)
  console.log(`  - Tanımı Değişen kodlar: ${changedCount}`)
  console.log(`  - Silinen/Kaldırılan kodlar: ${removedCount}`)
}

const resultData = {
  version: '2026.1',
  updatedAt: new Date().toISOString().split('T')[0],
  source: path.basename(odsPath),
  stats: {
    birimSayisi: sortedBirimler.length,
    okasSayisi: sortedOkas.length
  },
  birimler: sortedBirimler,
  okas: sortedOkas
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(resultData, null, 2), 'utf-8')

console.log(`[EKAP Sync Tamamlandı]:`)
console.log(`  - Toplam Resmî Birim: ${sortedBirimler.length}`)
console.log(`  - Toplam Resmî OKAS Kod: ${sortedOkas.length}`)
console.log(`  - Hedef dosya: ${outputPath}`)
