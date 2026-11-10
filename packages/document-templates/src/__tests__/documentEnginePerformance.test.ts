import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { DatabaseSync } from 'node:sqlite'
import {
  DocumentEngine,
  TemplateRegistry,
  smartMergeDocumentData,
  InstitutionalHeaderProvider,
  DocumentRenderer
} from '@worksuite-360/document-engine'
import {
  registerTeminTemplates,
  DefaultDocumentResolver,
  getTemplateMapping
} from '../index'
// @ts-expect-error — .mjs benchmark yardımcısının tip bildirimi yok
import { createSyntheticDatabase } from '../../../../scripts/benchmarks/syntheticDb.mjs'

function calculateStats(latencies: number[]) {
  if (latencies.length === 0) return { min: 0, median: 0, p95: 0, max: 0 }
  const sorted = [...latencies].sort((a, b) => a - b)
  const min = Number(sorted[0].toFixed(2))
  const max = Number(sorted[sorted.length - 1].toFixed(2))
  const mid = Math.floor(sorted.length / 2)
  const median = Number(
    (sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
  )
  const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1)
  const p95 = Number(sorted[p95Index].toFixed(2))
  return { min, median, p95, max }
}

describe('Document Engine Performans ve Aşama Analizi', () => {
  let db: any

  beforeAll(() => {
    TemplateRegistry.clear()
    registerTeminTemplates()
    db = createSyntheticDatabase({ fileCount: 100, itemsPerFile: 50, withIndexes: true })

    const queryExecutor = async (sql: string, params: any[] = []) => {
      try {
        const stmt = db.prepare(sql)
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          return stmt.all(...params)
        } else {
          return stmt.run(...params)
        }
      } catch (e) {
        return []
      }
    }

    DocumentEngine.setQueryExecutor(queryExecutor)
  })

  it('7 Aşamalı Belge Yaşam Döngüsü Performans Ölçümü (5, 50, 200 Kalem)', async () => {
    const scales = [
      { name: 'Küçük (5 Kalem)', count: 5 },
      { name: 'Orta (50 Kalem)', count: 50 },
      { name: 'Büyük (200 Kalem)', count: 200 }
    ]

    const benchmarkReport: Record<string, any> = {}
    const iterations = 15

    for (const scale of scales) {
      console.log(`\nDocument Engine Ölçümü: ${scale.name}...`)
      // Test veritabanı hazırla
      const testDb = createSyntheticDatabase({ fileCount: 20, itemsPerFile: scale.count, withIndexes: true })
      const queryExecutor = async (sql: string, params: any[] = []) => {
        try {
          const stmt = testDb.prepare(sql)
          return sql.trim().toUpperCase().startsWith('SELECT') ? stmt.all(...params) : stmt.run(...params)
        } catch {
          return []
        }
      }
      DocumentEngine.setQueryExecutor(queryExecutor)

      const phaseLatencies: Record<string, number[]> = {
        phase1_sourceData: [],
        phase2_mappingResolution: [],
        phase3_templatePreparation: [],
        phase4_snapshotLoad: [],
        phase5_smartMerge: [],
        phase6_reactRender: [],
        phase7_pdfHtmlCompile: [],
        total_endToEnd: []
      }

      for (let i = 0; i < iterations; i++) {
        const dosyaId = (i % 10) + 1
        const t0 = performance.now()

        // 1. Kaynak Verilerin Yüklenmesi
        const t1_start = performance.now()
        const headerData = await InstitutionalHeaderProvider.resolve(dosyaId, queryExecutor)
        const dRows = await queryExecutor('SELECT * FROM DATA_TeminDosyasi WHERE id = ?', [dosyaId])
        const kRows = await queryExecutor('SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ?', [dosyaId])
        const t1_end = performance.now()
        phaseLatencies.phase1_sourceData.push(t1_end - t1_start)

        // 2. Mapping Çözümleme
        const t2_start = performance.now()
        const mapping = getTemplateMapping('ihtiyac_listesi')
        const resolver = new DefaultDocumentResolver()
        const baseResolved = await resolver.resolve({
          dosyaId,
          templateKey: 'ihtiyac_listesi',
          headerData,
          queryExecutor
        })
        const t2_end = performance.now()
        phaseLatencies.phase2_mappingResolution.push(t2_end - t2_start)

        // 3. Şablon Verisinin Hazırlanması
        const t3_start = performance.now()
        const preparedRecord = await DocumentEngine.resolveDocumentData({
          dosyaId,
          templateKey: 'ihtiyac_listesi'
        })
        const t3_end = performance.now()
        phaseLatencies.phase3_templatePreparation.push(t3_end - t3_start)

        // 4. Snapshot Yükleme
        const t4_start = performance.now()
        const snapRows = await queryExecutor(
          'SELECT veri_json FROM DATA_TeminBelgeSnapshot WHERE dosya_id = ? AND sablon_kodu = ?',
          [dosyaId, 'ihtiyac_listesi']
        )
        let snapshotData = null
        if (snapRows && snapRows[0]?.veri_json) {
          try {
            snapshotData = JSON.parse(snapRows[0].veri_json)
          } catch {}
        }
        const t4_end = performance.now()
        phaseLatencies.phase4_snapshotLoad.push(t4_end - t4_start)

        // 5. RefreshPolicy / smartMerge
        const t5_start = performance.now()
        const mergedData = snapshotData
          ? smartMergeDocumentData(snapshotData, preparedRecord.data as any)
          : preparedRecord.data
        const t5_end = performance.now()
        phaseLatencies.phase5_smartMerge.push(t5_end - t5_start)

        // 6. React A4 Render (SSR)
        const t6_start = performance.now()
        const reactHtml = renderToString(
          React.createElement(DocumentRenderer, {
            templateKey: 'ihtiyac_listesi',
            data: mergedData as any,
            orientation: 'portrait'
          })
        )
        const t6_end = performance.now()
        phaseLatencies.phase6_reactRender.push(t6_end - t6_start)

        // 7. PDF HTML Derleme
        const t7_start = performance.now()
        const pdfHtml = await DocumentEngine.compileHtml({
          ...({ dosyaId } as Record<string, unknown>),
          templateKey: 'ihtiyac_listesi'
        } as any)
        const t7_end = performance.now()
        phaseLatencies.phase7_pdfHtmlCompile.push(t7_end - t7_start)

        const tTotal = performance.now() - t0
        phaseLatencies.total_endToEnd.push(tTotal)
      }

      benchmarkReport[scale.name] = {
        itemCount: scale.count,
        phases: {
          phase1_sourceData: calculateStats(phaseLatencies.phase1_sourceData),
          phase2_mappingResolution: calculateStats(phaseLatencies.phase2_mappingResolution),
          phase3_templatePreparation: calculateStats(phaseLatencies.phase3_templatePreparation),
          phase4_snapshotLoad: calculateStats(phaseLatencies.phase4_snapshotLoad),
          phase5_smartMerge: calculateStats(phaseLatencies.phase5_smartMerge),
          phase6_reactRender: calculateStats(phaseLatencies.phase6_reactRender),
          phase7_pdfHtmlCompile: calculateStats(phaseLatencies.phase7_pdfHtmlCompile),
          total_endToEnd: calculateStats(phaseLatencies.total_endToEnd)
        }
      }
    }

    const reportsDir = path.resolve(process.cwd(), '../../reports')
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
    const outPath = path.join(reportsDir, 'document-engine-benchmarks.json')
    fs.writeFileSync(outPath, JSON.stringify(benchmarkReport, null, 2), 'utf-8')

    expect(fs.existsSync(outPath)).toBe(true)
  })
})
