import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import schemaSnapshot from '../../../../../../../packages/database/schema-snapshot.json'

/**
 * Bu test, WorkDesk 360 monoreposundaki kod dosyalarında bulunan SQLite sorgularını tarar
 * ve kullanılan tablo/kolon adlarının schema-snapshot.json ile %100 uyumlu olduğunu doğrular.
 * Şemada bulunmayan bir kolon (örn. "dosya_konusu", "dosya_no", "alim_turu") SQL sorgusunda
 * doğrudan kaynak kolon olarak kullanılmışsa test FAIL verir.
 */

describe('SQL Schema Audit & Verification Test (Current Schema Invariant)', () => {
  const tablesMap = new Map<string, Set<string>>()

  // 1. Snapshot'taki tüm tablo ve sütunları yükle
  for (const [tableName, columns] of Object.entries(schemaSnapshot.tables)) {
    const colSet = new Set<string>()
    if (Array.isArray(columns)) {
      for (const col of columns) {
        if (typeof col === 'string') {
          colSet.add(col.toLowerCase())
        } else if (col && typeof col === 'object' && 'name' in col) {
          colSet.add(String((col as any).name).toLowerCase())
        }
      }
    }
    tablesMap.set(tableName.toLowerCase(), colSet)
  }

  it('schema-snapshot.json tablolari ve sutunlari basariyla yuklendi', () => {
    expect(tablesMap.size).toBeGreaterThan(30)
    expect(tablesMap.has('data_temindosyasi')).toBe(true)
    const dtColumns = tablesMap.get('data_temindosyasi')!
    expect(dtColumns.has('temin_no')).toBe(true)
    expect(dtColumns.has('konu')).toBe(true)
    expect(dtColumns.has('tur')).toBe(true)
    expect(dtColumns.has('yaklasik_maliyet')).toBe(true)
    expect(dtColumns.has('kesinti_damga')).toBe(true)
    expect(dtColumns.has('kesinti_karar_pulu')).toBe(true)
    // Şemada olmayan eski/uydurma kolonlar snapshot'ta bulunmamalı
    expect(dtColumns.has('dosya_konusu')).toBe(false)
    expect(dtColumns.has('dosya_no')).toBe(false)
    expect(dtColumns.has('alim_turu')).toBe(false)
  })

  it('DATA_TeminDosyasi sorgularinda sema disi sutunlar (dosya_konusu, dosya_no vb.) kullanilamaz', () => {
    const rootsToScan = [
      path.resolve(__dirname, '../../../../renderer/src/screens/bkmybs-mali-yonetim'),
      path.resolve(__dirname, '../../../../renderer/src/services/finance')
    ]

    const invalidUsages: Array<{ file: string; line: number; match: string }> = []

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scanDir(fullPath)
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
          const content = fs.readFileSync(fullPath, 'utf8')
          const lines = content.split('\n')
          lines.forEach((line, idx) => {
            // d.dosya_konusu veya d.dosya_no doğrudan kaynak kolon olarak çağrılmış mı?
            // (AS dosya_no / AS dosya_konusu alias tanımları serbesttir, ancak kaynak kolon d.dosya_no olamaz)
            if (/\bd\.dosya_konusu\b/i.test(line)) {
              invalidUsages.push({ file: fullPath, line: idx + 1, match: line.trim() })
            }
            if (/\bd\.dosya_no\b/i.test(line) && !/COALESCE\s*\([^)]*d\.dosya_no/i.test(line)) {
              // doğrudan d.dosya_no seçimi hata
              invalidUsages.push({ file: fullPath, line: idx + 1, match: line.trim() })
            }
            if (/\bd\.alim_turu\b/i.test(line)) {
              invalidUsages.push({ file: fullPath, line: idx + 1, match: line.trim() })
            }
          })
        }
      }
    }

    rootsToScan.forEach(scanDir)

    expect(invalidUsages, `Sema disi sutun kullanimi tespit edildi:\n${JSON.stringify(invalidUsages, null, 2)}`).toEqual([])
  })
})
