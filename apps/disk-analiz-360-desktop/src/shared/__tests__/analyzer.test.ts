import { describe, expect, it } from 'vitest'
import {
  analyzeArchiveFiles,
  extractProjectCode,
  extractYear,
  FileItem,
  tokenizeFilename
} from '../analyzer.js'

describe('Arşiv 360 & Dizin-Rapor Semantik NLP Kümeleme Motoru (analyzer.ts)', () => {
  it('dosya adlarından Türkçe karakter uyumlu anlamlı kökleri ayrıştırır ve gürültüyü eler', () => {
    const tokens = tokenizeFilename('2026_İhale_Teknik_Şartname_v2_son_onayli_kopya')
    expect(tokens).toContain('ihale')
    expect(tokens).toContain('teknik')
    expect(tokens).toContain('şartname')
    expect(tokens).not.toContain('son')
    expect(tokens).not.toContain('kopya')
  })

  it('dosya adından yıl, İKN ve Ada/Parsel proje kodlarını çıkarır', () => {
    expect(extractYear('2025_Kamulastirma_Karari.pdf')).toBe('2025')
    expect(extractProjectCode('2026/145892_ihale_dosyasi.pdf')).toBe('İKN: 2026/145892')
    expect(extractProjectCode('Merkez 142 Ada 18 Parsel Imar Durumu.dwg')).toBe(
      '142 Ada 18 Parsel'
    )
  })

  it('dosya listesinden akıllı konular, yıllar, formatlar ve gerçek klasörler üretir', () => {
    const sampleFiles: FileItem[] = [
      {
        name: '2026_Teknik_Sartname_Park.pdf',
        cleanName: '2026_Teknik_Sartname_Park',
        path: 'D:\\Arsiv\\06_IHALE\\2026_Teknik_Sartname_Park.pdf',
        isDirectory: false,
        size: 1024 * 500,
        ext: '.pdf',
        mtime: '2026-03-10T10:00:00.000Z',
        tags: ['ihale', 'pdf']
      },
      {
        name: '2026_Teknik_Sartname_Yol.docx',
        cleanName: '2026_Teknik_Sartname_Yol',
        path: 'D:\\Arsiv\\06_IHALE\\2026_Teknik_Sartname_Yol.docx',
        isDirectory: false,
        size: 1024 * 300,
        ext: '.docx',
        mtime: '2026-04-12T10:00:00.000Z',
        tags: ['ihale', 'word']
      },
      {
        name: '105_Ada_12_Parsel_Ruhsat.dwg',
        cleanName: '105_Ada_12_Parsel_Ruhsat',
        path: 'D:\\Arsiv\\04_IMAR\\105_Ada_12_Parsel_Ruhsat.dwg',
        isDirectory: false,
        size: 1024 * 1200,
        ext: '.dwg',
        mtime: '2025-11-05T10:00:00.000Z',
        tags: ['imar', 'cad-harita']
      }
    ]

    const res = analyzeArchiveFiles(sampleFiles, 'D:\\Arsiv')
    expect(res.smartTopics.length).toBeGreaterThan(0)
    expect(res.smartTopics[0].label.toLocaleLowerCase('tr-TR')).toContain('teknik')
    expect(res.realFolders.map((f) => f.label)).toContain('06_IHALE')
    expect(res.realFolders.map((f) => f.label)).toContain('04_IMAR')
    expect(res.yearClusters.map((y) => y.badge)).toContain('2026')
    expect(res.formatClusters.length).toBe(2)
  })
})
