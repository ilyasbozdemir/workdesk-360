import { performance } from 'node:perf_hooks'
import { createSyntheticDatabase } from './syntheticDb.mjs'

function calculateStats(latencies) {
  if (latencies.length === 0) return { min: 0, median: 0, p95: 0, max: 0 }
  const sorted = [...latencies].sort((a, b) => a - b)
  const min = Number(sorted[0].toFixed(3))
  const max = Number(sorted[sorted.length - 1].toFixed(3))
  const mid = Math.floor(sorted.length / 2)
  const median = Number(
    (sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toFixed(3)
  )
  const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1)
  const p95 = Number(sorted[p95Index].toFixed(3))
  return { min, median, p95, max }
}

export function runSqliteBenchmarks(datasetSizes = [100, 1000, 10000], iterations = 30) {
  const results = {
    queryPlans: {},
    measurements: []
  }

  // 1. EXPLAIN QUERY PLAN İncelemesi (10.000 dosyalık veritabanında)
  console.log('--- EXPLAIN QUERY PLAN Analizi Başlatılıyor ---')
  const sampleDbNoIdx = createSyntheticDatabase({ fileCount: 1000, itemsPerFile: 10, withIndexes: false })
  const sampleDbWithIdx = createSyntheticDatabase({ fileCount: 1000, itemsPerFile: 10, withIndexes: true })

  const queries = [
    {
      id: 'Q1_DOSYA_LISTESI',
      name: 'Dosya Listesi Açılışı (Son 50)',
      sql: 'SELECT * FROM DATA_TeminDosyasi ORDER BY id DESC LIMIT 50',
      params: []
    },
    {
      id: 'Q2_DOSYA_DETAY',
      name: 'Dosya Detay Kartı Yükleme',
      sql: 'SELECT * FROM DATA_TeminDosyasi WHERE id = ?',
      params: [500]
    },
    {
      id: 'Q3_KALEMLER',
      name: 'İhtiyaç Kalemleri Yükleme (N+1 / Dosya Kalemleri)',
      sql: 'SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY id ASC',
      params: [500]
    },
    {
      id: 'Q4_FIRMALAR',
      name: 'Dosya Firmaları Yükleme',
      sql: 'SELECT * FROM DATA_TeminFirma WHERE temin_dosya_id = ?',
      params: [500]
    },
    {
      id: 'Q5_TEKLIFLER',
      name: 'Kalem Teklifleri Yükleme (Piyasa Araştırma / Yaklaşık Maliyet)',
      sql: 'SELECT * FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?',
      params: [500]
    },
    {
      id: 'Q6_SNAPSHOT',
      name: 'Belge Snapshot Yükleme (DocumentPreviewModalV3)',
      sql: 'SELECT * FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?',
      params: [25, 'ihtiyac_listesi']
    },
    {
      id: 'Q7_ARAMA',
      name: 'Dosya Konusu Metin Arama (LIKE filtreleme)',
      sql: 'SELECT * FROM DATA_TeminDosyasi WHERE konu LIKE ? LIMIT 50',
      params: ['%Bilgisayar%']
    }
  ]

  for (const q of queries) {
    const planNoIdx = sampleDbNoIdx.prepare(`EXPLAIN QUERY PLAN ${q.sql}`).all(...q.params)
    const planWithIdx = sampleDbWithIdx.prepare(`EXPLAIN QUERY PLAN ${q.sql}`).all(...q.params)

    results.queryPlans[q.id] = {
      name: q.name,
      sql: q.sql,
      planNoIndex: planNoIdx.map(p => p.detail).join(' | '),
      planWithIndex: planWithIdx.map(p => p.detail).join(' | ')
    }
  }

  // 2. Farklı Veri Büyüklüklerinde Ölçümler (100, 1.000, 10.000)
  for (const size of datasetSizes) {
    console.log(`Ölçüm Yapılıyor: ${size} temin dosyası...`)
    const dbNoIdx = createSyntheticDatabase({ fileCount: size, itemsPerFile: 10, withIndexes: false })
    const dbWithIdx = createSyntheticDatabase({ fileCount: size, itemsPerFile: 10, withIndexes: true })

    const totalKalem = dbNoIdx.prepare('SELECT COUNT(*) as c FROM DATA_TeminKalem').get().c
    const totalTeklif = dbNoIdx.prepare('SELECT COUNT(*) as c FROM DATA_TeminKalemTeklif').get().c

    for (const q of queries) {
      // İndekssiz ölçüm
      const latenciesNoIdx = []
      const stmtNo = dbNoIdx.prepare(q.sql)
      for (let i = 0; i < iterations; i++) {
        const targetId = Math.floor(Math.random() * size) + 1
        const actualParams = q.params.length > 0 ? [targetId, ...q.params.slice(1)] : []
        const start = performance.now()
        stmtNo.all(...actualParams)
        const duration = performance.now() - start
        latenciesNoIdx.push(duration)
      }

      // İndeksli ölçüm
      const latenciesWithIdx = []
      const stmtWith = dbWithIdx.prepare(q.sql)
      for (let i = 0; i < iterations; i++) {
        const targetId = Math.floor(Math.random() * size) + 1
        const actualParams = q.params.length > 0 ? [targetId, ...q.params.slice(1)] : []
        const start = performance.now()
        stmtWith.all(...actualParams)
        const duration = performance.now() - start
        latenciesWithIdx.push(duration)
      }

      const noIdxStats = calculateStats(latenciesNoIdx)
      const withIdxStats = calculateStats(latenciesWithIdx)
      const speedup = noIdxStats.median > 0 ? (noIdxStats.median / Math.max(withIdxStats.median, 0.001)).toFixed(1) + 'x' : '1x'

      results.measurements.push({
        datasetSize: size,
        totalFiles: size,
        totalKalem,
        totalTeklif,
        queryId: q.id,
        queryName: q.name,
        withoutIndex: noIdxStats,
        withIndex: withIdxStats,
        speedup
      })
    }
  }

  return results
}

