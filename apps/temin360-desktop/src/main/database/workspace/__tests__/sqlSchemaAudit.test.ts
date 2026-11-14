import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import schemaSnapshot from '../../../../../../../packages/database/schema-snapshot.json'

/**
 * SQL Schema Audit & Verification Test (Current Schema Invariant)
 * 
 * Bu test, WorkDesk 360 masaüstü uygulamasındaki SQL sorgularını tarar
 * ve kullanılan tablo/kolon adlarının schema-snapshot.json ile %100 uyumlu olduğunu doğrular.
 * 
 * Kapsanan Alanlar:
 * - bkmybs-mali-yonetim
 * - services/finance
 * - screens/dosyalar
 * - screens/dosya
 * - main/ipc
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

  it('DATA_TeminDosyasi ve bagli tablolarda sema disi kolonlar (dosya_konusu, dosya_no, alim_turu vb.) kullanilamaz', () => {
    const rootsToScan = [
      path.resolve(__dirname, '../../../../renderer/src/screens/bkmybs-mali-yonetim'),
      path.resolve(__dirname, '../../../../renderer/src/services/finance'),
      path.resolve(__dirname, '../../../../renderer/src/screens/dosyalar'),
      path.resolve(__dirname, '../../../../renderer/src/screens/dosya'),
      path.resolve(__dirname, '../../../ipc')
    ]

    const invalidUsages: Array<{ file: string; line: number; match: string; reason: string }> = []

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
            // d.dosya_konusu doğrudan kaynak kolon olarak çağrılmış mı?
            if (/\bd\.dosya_konusu\b/i.test(line)) {
              invalidUsages.push({
                file: fullPath,
                line: idx + 1,
                match: line.trim(),
                reason: 'd.dosya_konusu şemada yok; d.konu kullanılmalıdır.'
              })
            }
            // d.dosya_no doğrudan kaynak kolon olarak çağrılmış mı? (COALESCE fallback harici)
            if (/\bd\.dosya_no\b/i.test(line) && !/COALESCE\s*\([^)]*d\.dosya_no/i.test(line)) {
              invalidUsages.push({
                file: fullPath,
                line: idx + 1,
                match: line.trim(),
                reason: 'd.dosya_no şemada yok; d.temin_no kullanılmalıdır.'
              })
            }
            // d.alim_turu doğrudan kaynak kolon olarak çağrılmış mı?
            if (/\bd\.alim_turu\b/i.test(line)) {
              invalidUsages.push({
                file: fullPath,
                line: idx + 1,
                match: line.trim(),
                reason: 'd.alim_turu şemada yok; d.tur kullanılmalıdır.'
              })
            }
          })
        }
      }
    }

    rootsToScan.forEach(scanDir)

    expect(
      invalidUsages,
      `Sema disi sutun kullanimi tespit edildi:\n${JSON.stringify(invalidUsages, null, 2)}`
    ).toEqual([])
  })

  it('SQL sorgularinda kullanilan temel veritabani tablolari schema-snapshot.json icerisinde mevcut olmalidir', () => {
    const knownTables = Array.from(tablesMap.keys())
    const rootsToScan = [
      path.resolve(__dirname, '../../../../renderer/src/screens/bkmybs-mali-yonetim'),
      path.resolve(__dirname, '../../../../renderer/src/services/finance')
    ]

    const unrecognizedTables: Array<{ file: string; line: number; table: string }> = []
    const tablePattern = /\b(?:FROM|JOIN|INTO|UPDATE)\s+([A-Za-z_][A-Za-z0-9_]*)/gi

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
            let match: RegExpExecArray | null
            tablePattern.lastIndex = 0
            while ((match = tablePattern.exec(line)) !== null) {
              const tbl = match[1].toLowerCase()
              // SQL anahtar kelimeleri veya alias değilse ve TANIM_ / DATA_ / SABLON_ / LOG_ ile başlıyorsa
              if (
                (tbl.startsWith('data_') || tbl.startsWith('tanim_') || tbl.startsWith('sablon_') || tbl.startsWith('log_')) &&
                !tablesMap.has(tbl)
              ) {
                unrecognizedTables.push({ file: fullPath, line: idx + 1, table: match[1] })
              }
            }
          })
        }
      }
    }

    rootsToScan.forEach(scanDir)
    expect(unrecognizedTables, `Bilinmeyen tablo kullanimi:\n${JSON.stringify(unrecognizedTables, null, 2)}`).toEqual([])
  })
})
