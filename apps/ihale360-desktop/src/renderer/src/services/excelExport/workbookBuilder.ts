import ExcelJS from 'exceljs'
import { formatDosyaNo } from '../../utils/formatDosyaNo'
import type { ExportContext, MasterExcelExportData } from './types'
import { buildDashboardSheet } from './sheets/dashboardSheet'
import { buildKalemlerSheet } from './sheets/kalemlerSheet'
import { buildTekliflerSheet } from './sheets/tekliflerSheet'
import { buildA4IhtiyacSheet, buildA4OnaySheet, buildA4PiyasaSheet } from './sheets/a4Sheets'
import { buildKomisyonSheet } from './sheets/komisyonSheet'
import { buildSablonSheet } from './sheets/sablonSheet'

export function createExportContext(data: MasterExcelExportData): ExportContext {
  const { dosya, kalemler = [], firmalar = [], kurum } = data

  const dosyaNoStr = formatDosyaNo(dosya)
  const kurumAdi = (kurum?.ad || kurum?.kurum_adi || 'T.C. KAMU İDARESİ').toUpperCase()
  const birimAdi = (
    dosya?.birim_adi ||
    dosya?.harcama_birimi ||
    kurum?.birim_adi ||
    'Satınalma / Destek Hizmetleri Birimi'
  ).toUpperCase()
  const dosyaKonusu = dosya?.konu || dosya?.isin_adi || 'Doğrudan Temin Alım İşi'
  const ihaleSekli = dosya?.ihale_sekli || '4734 Sayılı KİK Madde 22/d (Doğrudan Temin)'
  const turLabel =
    dosya?.tur === 'yapim_isi' || dosya?.tur === 'yapim'
      ? 'Yapım İşi / Onarım'
      : dosya?.tur === 'hizmet'
        ? 'Hizmet Alımı'
        : 'Mal Alımı'

  // Tevkifat orani belirleme
  const isYapim = dosya?.tur === 'yapim_isi' || dosya?.tur === 'yapim'
  const isHizmet = dosya?.tur === 'hizmet'
  const tevkifatOraniText = isYapim ? '4/10' : isHizmet ? '7/10' : '0 (Tevkifatsız)'
  const tevkifatCarpani = isYapim ? 0.4 : isHizmet ? 0.7 : 0.0

  const effectiveFirms =
    firmalar.length > 0
      ? firmalar
      : [
          { id: 1, unvan: '1. İstekli Firma', vergi_no: '1234567890' },
          { id: 2, unvan: '2. İstekli Firma', vergi_no: '2345678901' },
          { id: 3, unvan: '3. İstekli Firma', vergi_no: '3456789012' }
        ]

  const kalemCount = kalemler.length > 0 ? kalemler.length : 1
  const kalemlerSheetName = 'Kalemler & Maliyet'
  const kalemEndRow = 4 + kalemCount
  const kalemTotalRow = kalemEndRow + 1

  return {
    kurumAdi,
    birimAdi,
    dosyaNoStr,
    dosyaKonusu,
    ihaleSekli,
    turLabel,
    isYapim,
    isHizmet,
    tevkifatOraniText,
    tevkifatCarpani,
    effectiveFirms,
    kalemCount,
    kalemlerSheetName,
    kalemEndRow,
    kalemTotalRow
  }
}

export function buildDogrudanTeminWorkbook(data: MasterExcelExportData): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TEMİN 360 - Kamu Alımları ve Doğrudan Temin Sistemi'
  workbook.lastModifiedBy = 'TEMİN 360'
  workbook.created = new Date()
  workbook.modified = new Date()

  const ctx = createExportContext(data)

  // Sayfaları sırayla oluştur
  buildDashboardSheet(workbook, data, ctx)
  buildKalemlerSheet(workbook, data, ctx)
  buildTekliflerSheet(workbook, data, ctx)
  buildA4IhtiyacSheet(workbook, data, ctx)
  buildA4OnaySheet(workbook, data, ctx)
  buildA4PiyasaSheet(workbook, data, ctx)
  buildKomisyonSheet(workbook, data, ctx)
  buildSablonSheet(workbook, data, ctx)

  return workbook
}
