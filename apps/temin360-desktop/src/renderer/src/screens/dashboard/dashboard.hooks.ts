/* eslint-disable */
import { useState, useEffect, useCallback } from 'react'
import fallbackAnnouncements from '../../constants/announcements.fallback.json'
import { useAppEventListener } from '../../utils/appEvents'
import { useSettingsStore } from '../../store/settingsStore'
import { useModuleStore } from '../../store/moduleStore'
import { RESMI_MODUL_PAKETLERI } from '../modul-magazasi/data/moduller.data'

export interface BirimHarcamaStat {
  id: number
  birim_adi: string
  dosya_sayisi: number
  toplam_harcama: number
  yaklasik_maliyet?: number
  net_odenen?: number
  yuzde: number
}

export interface KikLimitStat {
  donem_kodu: string
  baslangic_tarihi: string
  bitis_tarihi: string
  limit: number
  harcananTutar: number
  kalanTutar: number
  tuketimYuzdesi: number
  durum: 'normal' | 'uyari' | 'kritik' | 'asildi'
  limitType: string
}

export interface DashboardStats {
  ihaleDosyaSayisi: number
  kayitliFirmaSayisi: number
  kayitliPersonelSayisi: number
  toplamYaklasikMaliyet: number
  malYaklasikMaliyet: number
  hizmetYaklasikMaliyet: number
  yapimYaklasikMaliyet: number
  danismanlikYaklasikMaliyet: number
  aylikHarcamalar: { ay: string; tutar: number }[]
  ihalelereSecilenFirmaSayisi: number
  ihalelereKatilanFirmaSayisi: number
  ihaleEdilenMalzemeSayisi: number

  // New Metrics
  kayitliBirimSayisi: number
  kayitliAmbarSayisi: number
  aktifDosyaSayisi: number
  tamamlananDosyaSayisi: number
  malDosyaSayisi: number
  hizmetDosyaSayisi: number
  yapimDosyaSayisi: number
  danismanlikDosyaSayisi: number
  enCokSecilenFirma: { unvan: string; count: number } | null
  enCokHarcamaYapanBirim: { birim_adi: string; total: number } | null

  // İhale Tipi Bazlı Metrikler
  dogrudanTeminSayisi: number
  dogrudanTeminMaliyet: number
  acikIhaleSayisi: number
  acikIhaleMaliyet: number
  pazarlikSayisi: number
  pazarlikMaliyet: number
  hakediseSayisi: number
  hakediseMaliyet: number

  // KİK 22/d Limit ve Birim Harcama Analizi
  birimHarcamalari: BirimHarcamaStat[]
  kikLimitStat: KikLimitStat | null
}

export function useDashboardStats(
  filterMode: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886' | 'all' = 'all'
) {
  const [stats, setStats] = useState<DashboardStats>({
    ihaleDosyaSayisi: 0,
    kayitliFirmaSayisi: 0,
    kayitliPersonelSayisi: 0,
    toplamYaklasikMaliyet: 0,
    malYaklasikMaliyet: 0,
    hizmetYaklasikMaliyet: 0,
    yapimYaklasikMaliyet: 0,
    danismanlikYaklasikMaliyet: 0,
    aylikHarcamalar: [],
    ihalelereSecilenFirmaSayisi: 0,
    ihalelereKatilanFirmaSayisi: 0,
    ihaleEdilenMalzemeSayisi: 0,

    // New Metrics Default Values
    kayitliBirimSayisi: 0,
    kayitliAmbarSayisi: 0,
    aktifDosyaSayisi: 0,
    tamamlananDosyaSayisi: 0,
    malDosyaSayisi: 0,
    hizmetDosyaSayisi: 0,
    yapimDosyaSayisi: 0,
    danismanlikDosyaSayisi: 0,
    enCokSecilenFirma: null,
    enCokHarcamaYapanBirim: null,

    // İhale Tipi Bazlı
    dogrudanTeminSayisi: 0,
    dogrudanTeminMaliyet: 0,
    acikIhaleSayisi: 0,
    acikIhaleMaliyet: 0,
    pazarlikSayisi: 0,
    pazarlikMaliyet: 0,
    hakediseSayisi: 0,
    hakediseMaliyet: 0,

    // KİK 22/d Limit ve Birim Harcama Analizi
    birimHarcamalari: [],
    kikLimitStat: null
  })
  const [isLoading, setIsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    try {
      // 0. Schema inspection: Check existing tables and columns to avoid SQLite runtime errors
      const tablesRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        "SELECT name FROM sqlite_master WHERE type IN ('table', 'view')"
      )
      const existingTables = new Set<string>(
        tablesRes && tablesRes.success && Array.isArray(tablesRes.data)
          ? tablesRes.data.map((r: any) => String(r.name).toLowerCase())
          : []
      )

      const getCols = async (tbl: string): Promise<Set<string>> => {
        if (!existingTables.has(tbl.toLowerCase())) return new Set()
        try {
          const cRes = await window.electron.ipcRenderer.invoke('db:query', `PRAGMA table_info("${tbl}")`)
          if (cRes && cRes.success && Array.isArray(cRes.data)) {
            return new Set(cRes.data.map((c: any) => String(c.name).toLowerCase()))
          }
        } catch {
          // ignore
        }
        return new Set()
      }

      const [dosyaCols, birimCols] = await Promise.all([
        getCols('DATA_TeminDosyasi'),
        getCols('TANIM_Birim')
      ])

      const hasIhaleTipi = dosyaCols.has('ihale_tipi')
      const hasIsDeleted = dosyaCols.has('is_deleted')
      const hasDurumAsamaId = dosyaCols.has('durum_asama_id')
      const hasYaklasikMaliyet = dosyaCols.has('yaklasik_maliyet')
      const hasNetOdenen = dosyaCols.has('net_odenen')
      const hasTur = dosyaCols.has('tur')
      const hasFirmaId = dosyaCols.has('firma_id')
      const hasBirimId = dosyaCols.has('birim_id')
      const hasBirim = dosyaCols.has('birim')
      const hasHarcamaBirimi = dosyaCols.has('harcama_birimi')
      const hasIhtiyacYeri = dosyaCols.has('ihtiyac_yeri')
      const hasCreatedAt = dosyaCols.has('created_at')

      const isDelWhere = hasIsDeleted ? '(is_deleted = 0 OR is_deleted IS NULL)' : '1=1'
      const isDelWhereD = hasIsDeleted ? '(d.is_deleted = 0 OR d.is_deleted IS NULL)' : '1=1'

      // Mode filter: If ihale_tipi does not exist in DATA_TeminDosyasi, all files are direct procurement
      let modeFilter = ''
      if (hasIhaleTipi) {
        if (filterMode === 'dogrudan_temin') {
          modeFilter =
            " AND (LOWER(COALESCE(ihale_tipi, '')) LIKE '%temin%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%22/%' OR ihale_tipi IS NULL OR ihale_tipi = '')"
        } else if (filterMode === 'ihale') {
          modeFilter =
            " AND (LOWER(COALESCE(ihale_tipi, '')) LIKE '%açık%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%acik%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%ihale%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%pazarlık%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%pazarlik%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%hakediş%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%hakedis%') AND NOT (LOWER(COALESCE(ihale_tipi, '')) LIKE '%temin%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%22/%')"
        }
      } else {
        if (filterMode === 'ihale') {
          modeFilter = ' AND 1=0'
        }
      }

      // 1. Dosya sayısı
      const dosyaRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT COUNT(*) as count FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter}`
      )
      const ihaleDosyaSayisi = dosyaRes.data?.[0]?.count || 0

      // 2. Kayıtlı Firma Sayısı
      let kayitliFirmaSayisi = 0
      if (existingTables.has('tanim_firma')) {
        const firmaRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT COUNT(*) as count FROM TANIM_Firma'
        )
        kayitliFirmaSayisi = firmaRes.data?.[0]?.count || 0
      }

      // 3. Kayıtlı Personel Sayısı
      let kayitliPersonelSayisi = 0
      if (existingTables.has('tanim_personel')) {
        const personelRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT COUNT(*) as count FROM TANIM_Personel'
        )
        kayitliPersonelSayisi = personelRes.data?.[0]?.count || 0
      }

      // 4. Toplam Yaklaşık Maliyet
      let toplamYaklasikMaliyet = 0
      if (hasYaklasikMaliyet) {
        const toplamMaliyetRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COALESCE(SUM(yaklasik_maliyet), 0) as total FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter}`
        )
        toplamYaklasikMaliyet = toplamMaliyetRes.data?.[0]?.total || 0
      }

      // 5. Türlere Göre Yaklaşık Maliyetler
      let malYaklasikMaliyet = 0
      let hizmetYaklasikMaliyet = 0
      let yapimYaklasikMaliyet = 0
      let danismanlikYaklasikMaliyet = 0

      if (hasTur && hasYaklasikMaliyet) {
        const turRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT tur, COALESCE(SUM(yaklasik_maliyet), 0) as total FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter} GROUP BY tur`
        )
        if (turRes.success && turRes.data) {
          turRes.data.forEach((row: any) => {
            if (row.tur === 'mal') malYaklasikMaliyet = row.total || 0
            else if (row.tur === 'hizmet') hizmetYaklasikMaliyet = row.total || 0
            else if (row.tur === 'yapim_isi' || row.tur === 'yapim')
              yapimYaklasikMaliyet = row.total || 0
            else if (row.tur === 'danismanlik') danismanlikYaklasikMaliyet = row.total || 0
          })
        }
      }

      // 6. Aylık Harcamalar
      const aylarTR = [
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık'
      ]
      let aylikHarcamalar = aylarTR.map((ay) => ({ ay, tutar: 0 }))
      if (hasCreatedAt && hasYaklasikMaliyet) {
        const aylikRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT strftime('%m', created_at) as ay_no, COALESCE(SUM(yaklasik_maliyet), 0) as total FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter} GROUP BY ay_no ORDER BY ay_no ASC`
        )
        if (aylikRes.success && aylikRes.data) {
          aylikHarcamalar = aylarTR.map((ay, index) => {
            const ayStr = String(index + 1).padStart(2, '0')
            const found = aylikRes.data.find((item: any) => item.ay_no === ayStr)
            return {
              ay,
              tutar: found ? Number(found.total) || 0 : 0
            }
          })
        }
      }

      // 7. İhalelere Seçilen Firma Sayısı
      let ihalelereSecilenFirmaSayisi = 0
      if (hasFirmaId) {
        const secilenFirmaRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(DISTINCT firma_id) as count FROM DATA_TeminDosyasi WHERE firma_id IS NOT NULL AND ${isDelWhere}${modeFilter}`
        )
        ihalelereSecilenFirmaSayisi = secilenFirmaRes.data?.[0]?.count || 0
      }

      // 8. İhalelere Katılan Firma Sayısı
      let ihalelereKatilanFirmaSayisi = 0
      if (existingTables.has('data_teminfirma')) {
        const katilanFirmaRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(DISTINCT firma_id) as count FROM DATA_TeminFirma WHERE temin_dosya_id IN (SELECT id FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter})`
        )
        ihalelereKatilanFirmaSayisi = katilanFirmaRes.data?.[0]?.count || 0
      }

      // 9. İhale Edilen Kalem / Malzeme Sayısı
      let ihaleEdilenMalzemeSayisi = 0
      if (existingTables.has('data_teminkalem')) {
        const malzemeRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(*) as count FROM DATA_TeminKalem WHERE temin_dosya_id IN (SELECT id FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter})`
        )
        ihaleEdilenMalzemeSayisi = malzemeRes.data?.[0]?.count || 0
      }

      // 10. Kayıtlı Birim Sayısı
      let kayitliBirimSayisi = 0
      if (existingTables.has('tanim_birim')) {
        const birimCountRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT COUNT(*) as count FROM TANIM_Birim'
        )
        kayitliBirimSayisi = birimCountRes.data?.[0]?.count || 0
      }

      // 11. Kayıtlı Ambar Sayısı
      let kayitliAmbarSayisi = 0
      if (existingTables.has('tanim_ambar')) {
        const ambarCountRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT COUNT(*) as count FROM TANIM_Ambar'
        )
        kayitliAmbarSayisi = ambarCountRes.data?.[0]?.count || 0
      }

      // 12. Aktif Dosya Sayısı
      let aktifDosyaSayisi = ihaleDosyaSayisi
      let tamamlananDosyaSayisi = 0
      if (hasDurumAsamaId) {
        const aktifDosyaCountRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(*) as count FROM DATA_TeminDosyasi WHERE ${isDelWhere} AND (durum_asama_id < 5 OR durum_asama_id IS NULL)${modeFilter}`
        )
        aktifDosyaSayisi = aktifDosyaCountRes.data?.[0]?.count || 0

        const tamamlananDosyaCountRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT COUNT(*) as count FROM DATA_TeminDosyasi WHERE ${isDelWhere} AND durum_asama_id = 5${modeFilter}`
        )
        tamamlananDosyaSayisi = tamamlananDosyaCountRes.data?.[0]?.count || 0
      }

      // 14. Dosya Türlerine Göre Sayılar
      let malDosyaSayisi = 0,
        hizmetDosyaSayisi = 0,
        yapimDosyaSayisi = 0,
        danismanlikDosyaSayisi = 0
      if (hasTur) {
        const turSayiRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT tur, COUNT(*) as count FROM DATA_TeminDosyasi WHERE ${isDelWhere}${modeFilter} GROUP BY tur`
        )
        if (turSayiRes.success && turSayiRes.data) {
          turSayiRes.data.forEach((row: any) => {
            if (row.tur === 'mal') malDosyaSayisi = row.count || 0
            else if (row.tur === 'hizmet') hizmetDosyaSayisi = row.count || 0
            else if (row.tur === 'yapim' || row.tur === 'yapim_isi')
              yapimDosyaSayisi = row.count || 0
            else if (row.tur === 'danismanlik') danismanlikDosyaSayisi = row.count || 0
          })
        }
      }

      // 15. En Çok Seçilen Firma
      let enCokSecilenFirma: { unvan: string; count: number } | null = null
      if (hasFirmaId && existingTables.has('tanim_firma')) {
        const topFirmaRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT f.unvan, COUNT(*) as count FROM DATA_TeminDosyasi d JOIN TANIM_Firma f ON d.firma_id = f.id WHERE d.firma_id IS NOT NULL AND ${isDelWhereD}${modeFilter} GROUP BY d.firma_id ORDER BY count DESC LIMIT 1`
        )
        if (topFirmaRes.success && topFirmaRes.data?.[0]) {
          enCokSecilenFirma = {
            unvan: topFirmaRes.data[0].unvan,
            count: topFirmaRes.data[0].count
          }
        }
      }

      // 16. En Çok Harcama Yapan Birim
      let enCokHarcamaYapanBirim: { birim_adi: string; total: number } | null = null
      const birimFieldCandidates: string[] = []
      if (hasBirim) birimFieldCandidates.push("NULLIF(TRIM(d.birim), '')")
      if (hasHarcamaBirimi) birimFieldCandidates.push("NULLIF(TRIM(d.harcama_birimi), '')")
      if (existingTables.has('tanim_birim') && birimCols.has('birim_adi'))
        birimFieldCandidates.push("NULLIF(TRIM(b.birim_adi), '')")
      if (existingTables.has('tanim_birim') && birimCols.has('ad'))
        birimFieldCandidates.push("NULLIF(TRIM(b.ad), '')")
      if (hasIhtiyacYeri) birimFieldCandidates.push("NULLIF(TRIM(d.ihtiyac_yeri), '')")
      birimFieldCandidates.push("'Belirtilmemiş Birim'")
      const birimFieldExpr = `COALESCE(${birimFieldCandidates.join(', ')})`

      const costSumExpr =
        hasNetOdenen && hasYaklasikMaliyet
          ? 'SUM(CASE WHEN d.yaklasik_maliyet > 0 THEN d.yaklasik_maliyet WHEN d.net_odenen > 0 THEN d.net_odenen ELSE 0 END)'
          : hasYaklasikMaliyet
            ? 'SUM(d.yaklasik_maliyet)'
            : hasNetOdenen
              ? 'SUM(d.net_odenen)'
              : '0'

      const birimJoinClause =
        existingTables.has('tanim_birim') && hasBirimId
          ? 'LEFT JOIN TANIM_Birim b ON d.birim_id = b.id'
          : ''

      const topBirimRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
           ${birimFieldExpr} as birim_adi,
           ${costSumExpr} as total
         FROM DATA_TeminDosyasi d
         ${birimJoinClause}
         WHERE ${isDelWhereD}${modeFilter}
         GROUP BY 1
         ORDER BY total DESC
         LIMIT 1`
      )
      if (topBirimRes.success && topBirimRes.data?.[0]) {
        enCokHarcamaYapanBirim = {
          birim_adi: topBirimRes.data[0].birim_adi,
          total: Number(topBirimRes.data[0].total) || 0
        }
      }

      // 17. İhale Tipi Bazlı Dağılım
      let dogrudanTeminSayisi = 0,
        dogrudanTeminMaliyet = 0
      let acikIhaleSayisi = 0,
        acikIhaleMaliyet = 0
      let pazarlikSayisi = 0,
        pazarlikMaliyet = 0
      let hakediseSayisi = 0,
        hakediseMaliyet = 0

      if (hasIhaleTipi) {
        const ymField = hasYaklasikMaliyet ? 'yaklasik_maliyet' : '0'
        const ihaleTipiRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT 
             CASE 
               WHEN LOWER(COALESCE(ihale_tipi, '')) LIKE '%temin%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%22/%' THEN 'dogrudan_temin'
               WHEN LOWER(COALESCE(ihale_tipi, '')) LIKE '%pazarlık%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%pazarlik%' THEN 'pazarlik'
               WHEN LOWER(COALESCE(ihale_tipi, '')) LIKE '%açık%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%acik%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%ihale%' THEN 'acik_ihale'
               WHEN LOWER(COALESCE(ihale_tipi, '')) LIKE '%hakediş%' OR LOWER(COALESCE(ihale_tipi, '')) LIKE '%hakedis%' THEN 'hakedis'
               ELSE 'dogrudan_temin'
             END as tip,
             COUNT(*) as sayi,
             COALESCE(SUM(${ymField}), 0) as maliyet
           FROM DATA_TeminDosyasi
           WHERE ${isDelWhere}${modeFilter}
           GROUP BY 1`
        )
        if (ihaleTipiRes.success && Array.isArray(ihaleTipiRes.data)) {
          ihaleTipiRes.data.forEach((row: any) => {
            if (row.tip === 'pazarlik') {
              pazarlikSayisi = Number(row.sayi || 0)
              pazarlikMaliyet = Number(row.maliyet || 0)
            } else if (row.tip === 'acik_ihale') {
              acikIhaleSayisi = Number(row.sayi || 0)
              acikIhaleMaliyet = Number(row.maliyet || 0)
            } else if (row.tip === 'hakedis') {
              hakediseSayisi = Number(row.sayi || 0)
              hakediseMaliyet = Number(row.maliyet || 0)
            } else {
              dogrudanTeminSayisi += Number(row.sayi || 0)
              dogrudanTeminMaliyet += Number(row.maliyet || 0)
            }
          })
        }
      } else {
        // In legacy database without ihale_tipi, all files are inherently direct procurement
        dogrudanTeminSayisi = ihaleDosyaSayisi
        dogrudanTeminMaliyet = toplamYaklasikMaliyet
      }

      // 18. Birimler Bazında Harcama Analizi
      const birimIdExpr =
        existingTables.has('tanim_birim') && hasBirimId
          ? 'COALESCE(b.id, d.birim_id, MIN(d.id))'
          : hasBirimId
            ? 'COALESCE(d.birim_id, MIN(d.id))'
            : 'MIN(d.id)'

      const birimlerHarcamaRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
           ${birimIdExpr} as id,
           ${birimFieldExpr} as birim_adi, 
           COUNT(d.id) as dosya_sayisi,
           COALESCE(SUM(${hasYaklasikMaliyet ? 'd.yaklasik_maliyet' : '0'}), 0) as yaklasik_maliyet,
           COALESCE(SUM(${hasNetOdenen ? 'd.net_odenen' : '0'}), 0) as net_odenen,
           COALESCE(${costSumExpr}, 0) as toplam_harcama
         FROM DATA_TeminDosyasi d
         ${birimJoinClause}
         WHERE ${isDelWhereD}${modeFilter}
         GROUP BY 2
         HAVING toplam_harcama > 0 OR dosya_sayisi > 0
         ORDER BY toplam_harcama DESC, dosya_sayisi DESC`
      )
      const rawBirimHarcama =
        birimlerHarcamaRes.success && Array.isArray(birimlerHarcamaRes.data)
          ? birimlerHarcamaRes.data
          : []
      const totalBirimHarcama = rawBirimHarcama.reduce(
        (acc: number, curr: any) => acc + (Number(curr.toplam_harcama) || 0),
        0
      )
      const birimHarcamalari: BirimHarcamaStat[] = rawBirimHarcama.map((b: any) => ({
        id: b.id,
        birim_adi: b.birim_adi || 'Birim Belirtilmemiş',
        dosya_sayisi: Number(b.dosya_sayisi) || 0,
        toplam_harcama: Number(b.toplam_harcama) || 0,
        yaklasik_maliyet: Number(b.yaklasik_maliyet) || 0,
        net_odenen: Number(b.net_odenen) || 0,
        yuzde:
          totalBirimHarcama > 0
            ? Math.round(((Number(b.toplam_harcama) || 0) / totalBirimHarcama) * 100)
            : 0
      }))

      // 19. KİK 22/d Limit Tüketim Analizi
      const { limitType } = useSettingsStore.getState()
      let kikLimitStat: KikLimitStat | null = null
      try {
        const limitDonemleriRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM TANIM_KikLimitDonemleri ORDER BY donem_kodu DESC'
        )
        if (
          limitDonemleriRes.success &&
          Array.isArray(limitDonemleriRes.data) &&
          limitDonemleriRes.data.length > 0
        ) {
          const currentYear = new Date().getFullYear().toString()
          const activeDonem =
            limitDonemleriRes.data.find((d: any) => d.donem_kodu === currentYear) ||
            limitDonemleriRes.data[0]
          const effectiveLimit =
            limitType === 'buyuksehir'
              ? Number(activeDonem.buyuksehir_limit || 0)
              : Number(activeDonem.diger_limit || 0)
          const harcananTutar = dogrudanTeminMaliyet || toplamYaklasikMaliyet || 0
          const kalanTutar = Math.max(0, effectiveLimit - harcananTutar)
          const tuketimYuzdesi =
            effectiveLimit > 0
              ? Math.min(100, Math.round((harcananTutar / effectiveLimit) * 1000) / 10)
              : 0

          let durum: 'normal' | 'uyari' | 'kritik' | 'asildi' = 'normal'
          if (harcananTutar > effectiveLimit && effectiveLimit > 0) {
            durum = 'asildi'
          } else if (tuketimYuzdesi >= 85) {
            durum = 'kritik'
          } else if (tuketimYuzdesi >= 65) {
            durum = 'uyari'
          }

          kikLimitStat = {
            donem_kodu: activeDonem.donem_kodu,
            baslangic_tarihi: activeDonem.baslangic_tarihi,
            bitis_tarihi: activeDonem.bitis_tarihi,
            limit: effectiveLimit,
            harcananTutar,
            kalanTutar,
            tuketimYuzdesi,
            durum,
            limitType: limitType || 'buyuksehir'
          }
        }
      } catch (e) {
        console.warn('Could not compute KİK limit stat:', e)
      }

      setStats({
        ihaleDosyaSayisi,
        kayitliFirmaSayisi,
        kayitliPersonelSayisi,
        toplamYaklasikMaliyet,
        malYaklasikMaliyet,
        hizmetYaklasikMaliyet,
        yapimYaklasikMaliyet,
        danismanlikYaklasikMaliyet,
        aylikHarcamalar,
        ihalelereSecilenFirmaSayisi,
        ihalelereKatilanFirmaSayisi,
        ihaleEdilenMalzemeSayisi,

        // New Metrics
        kayitliBirimSayisi,
        kayitliAmbarSayisi,
        aktifDosyaSayisi,
        tamamlananDosyaSayisi,
        malDosyaSayisi,
        hizmetDosyaSayisi,
        yapimDosyaSayisi,
        danismanlikDosyaSayisi,
        enCokSecilenFirma,
        enCokHarcamaYapanBirim,

        // İhale Tipi Bazlı
        dogrudanTeminSayisi,
        dogrudanTeminMaliyet,
        acikIhaleSayisi,
        acikIhaleMaliyet,
        pazarlikSayisi,
        pazarlikMaliyet,
        hakediseSayisi,
        hakediseMaliyet,

        // KİK 22/d Limit ve Birim Harcama Analizi
        birimHarcamalari,
        kikLimitStat
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filterMode])

  // Realtime event synchronization across all screens
  useAppEventListener(
    [
      'dossier:created',
      'dossier:updated',
      'dossier:deleted',
      'items:changed',
      'bids:changed',
      'status:changed',
      'workspace:refreshed'
    ],
    () => {
      loadStats()
    }
  )

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, isLoading, refetch: loadStats }
}

export interface ActiveDosyaSummary {
  kurumAdi: string
  kurumTuru: string
  dosyaNo: string
  konu: string
  tur: string
  birimAdi: string
  secilenFirma: string
  katilanFirmaSayisi: number
  malzemeSayisi: number
  yaklasikMaliyet: number
  butceKodu: string
  ihaleSekli: string
  kdv: string
  teklifSozlesmeTuru: string
  durumAsamaId: number | null
}

export function useActiveDosyaSummary(
  activeDosyaId: number | null,
  institutionName: string,
  institutionTypeLabel: string
) {
  const [summary, setSummary] = useState<ActiveDosyaSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!activeDosyaId) {
      setSummary(null)
      return
    }

    setIsLoading(true)
    try {
      const q = `
        SELECT 
          d.temin_no, d.konu, d.tur, d.yaklasik_maliyet, d.butce_kodu, d.ihale_sekli, d.kdv, d.teklif_sozlesme_turu, d.tekrar_no, d.durum_asama_id,
          b.birim_adi,
          f.unvan as firma_unvani
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
        WHERE d.id = ?
      `
      const res = await window.electron.ipcRenderer.invoke('db:query', q, [activeDosyaId])

      if (res.success && res.data.length > 0) {
        const row = res.data[0]

        // Count invited/participating firms in DATA_TeminFirma for this dossier
        const katilanFirmaSayisiRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT COUNT(*) as count FROM DATA_TeminFirma WHERE temin_dosya_id = ?',
          [activeDosyaId]
        )
        const katilanFirmaSayisi = katilanFirmaSayisiRes.data?.[0]?.count || 0

        // Count items in DATA_TeminKalem for this dossier
        const malzemeSayisiRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT COUNT(*) as count FROM DATA_TeminKalem WHERE temin_dosya_id = ?',
          [activeDosyaId]
        )
        const malzemeSayisi = malzemeSayisiRes.data?.[0]?.count || 0

        const formattedKonu =
          row.tekrar_no && row.tekrar_no > 1
            ? `${row.konu || 'Konu Belirtilmedi'} (${row.tekrar_no})`
            : row.konu || 'Konu Belirtilmedi'

        setSummary({
          kurumAdi: institutionName,
          kurumTuru: institutionTypeLabel,
          dosyaNo: row.temin_no || 'No Belirtilmedi',
          konu: formattedKonu,
          tur: row.tur || 'mal',
          birimAdi: row.birim_adi || 'Birim Seçilmedi',
          secilenFirma: row.firma_unvani || 'Henüz Seçilmedi',
          katilanFirmaSayisi,
          malzemeSayisi,
          yaklasikMaliyet: row.yaklasik_maliyet || 0,
          butceKodu: row.butce_kodu || '-',
          ihaleSekli: row.ihale_sekli || '-',
          kdv: row.kdv || '20',
          teklifSozlesmeTuru: row.teklif_sozlesme_turu || '-',
          durumAsamaId: row.durum_asama_id || null
        })
      } else {
        setSummary(null)
      }
    } catch (e) {
      console.error('Failed to load active dosya summary', e)
    } finally {
      setIsLoading(false)
    }
  }, [activeDosyaId, institutionName, institutionTypeLabel])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  return { summary, isLoading, refetch: loadSummary }
}

export interface Announcement {
  id: number | string
  title: string
  content: string
  date: string
  type: 'info' | 'success' | 'warning' | 'error'
  _rawDate?: number
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true)
    try {
      const remoteData: Announcement[] = (fallbackAnnouncements as Announcement[]).map(
        (item, idx) => ({
          ...item,
          id: `fallback_${item.id || idx}`
        })
      )

      // Fetch from local LOG_SystemLog
      let localLogs: Announcement[] = []
      try {
        if (window.electron) {
          const logRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            'SELECT id, title, message, type, created_at FROM LOG_SystemLog ORDER BY created_at DESC LIMIT 50'
          )
          if (logRes?.success && logRes.data) {
            localLogs = logRes.data.map((row: any) => ({
              id: `syslog_${row.id}`,
              title: row.title || 'Sistem Bildirimi',
              content: row.message || '',
              date: row.created_at
                ? new Date(row.created_at).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })
                : '',
              _rawDate: row.created_at ? new Date(row.created_at).getTime() : 0,
              type: (row.type as 'info' | 'success' | 'warning' | 'error') || 'info'
            }))
          }
        }
      } catch {
        // quiet fallback
      }

      // Fetch recent files to generate smart notifications
      let fileNotifications: Announcement[] = []
      try {
        if (window.electron) {
          const filesRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT d.id, d.temin_no, d.konu, d.yaklasik_maliyet, d.durum_asama_id, d.created_at, d.status,
                    f.unvan as firma_adi, b.ad as birim_adi
             FROM DATA_TeminDosyasi d
             LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
             LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
             WHERE d.is_deleted = 0
             ORDER BY d.created_at DESC LIMIT 15`
          )
          if (filesRes?.success && filesRes.data) {
            fileNotifications = filesRes.data.map((row: any) => {
              const dateObj = new Date(row.created_at)
              const dateStr = dateObj.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
              const formattedMaliyet = new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              }).format(row.yaklasik_maliyet || 0)

              let title = 'Temin Dosyası Güncellemesi'
              let content = `"${row.konu || 'Konu Belirtilmedi'}" (${row.temin_no || 'No Yok'}) dosyası işlem görüyor.`
              let type: 'info' | 'success' | 'warning' | 'error' = 'info'

              if (row.status === 'iptal') {
                title = 'Dosya İptal Edildi'
                content = `"${row.konu}" (${row.temin_no}) dosyası iptal edildi.`
                type = 'error'
              } else if (row.status === 'tamamlandi') {
                title = 'Dosya Tamamlandı'
                content = `"${row.konu}" (${row.temin_no}) dosyası başarıyla sonuçlandırıldı.`
                type = 'success'
              } else {
                switch (row.durum_asama_id) {
                  case 1:
                    title = 'Yeni Dosya Açıldı'
                    content = `"${row.konu}" (${row.temin_no}) dosyası İhtiyaç Tespiti aşamasında oluşturuldu. Maliyet: ${formattedMaliyet}.`
                    type = 'info'
                    break
                  case 2:
                    title = 'Piyasa Fiyat Araştırması'
                    if (row.firma_adi) {
                      title = 'Firma Belirlendi'
                      content = `"${row.konu}" (${row.temin_no}) dosyası için piyasa fiyat araştırması tamamlandı. Firma: ${row.firma_adi}.`
                      type = 'success'
                    } else {
                      content = `"${row.konu}" (${row.temin_no}) dosyası için teklif toplama/fiyat araştırması yapılıyor.`
                      type = 'info'
                    }
                    break
                  case 3:
                    title = 'Sipariş & Sözleşme'
                    content = `"${row.konu}" (${row.temin_no}) dosyası Sipariş & Sözleşme aşamasında onay bekliyor.`
                    type = 'warning'
                    break
                  case 4:
                    title = 'Muayene & Kabul & Ödeme İşlemleri'
                    content = `"${row.konu}" (${row.temin_no}) dosyası teslim ve faturalandırma aşamasına sevk edildi.`
                    type = 'success'
                    break
                  default:
                    if (row.yaklasik_maliyet > 500000) {
                      title = 'Yüksek Limitli Doğrudan Temin'
                      content = `"${row.konu}" (${row.temin_no}) dosyası yüksek maliyet limitine sahip: ${formattedMaliyet}.`
                      type = 'warning'
                    }
                    break
                }
              }

              return {
                id: `file_${row.id}_${row.durum_asama_id || 0}_${row.status}`,
                title,
                content,
                date: dateStr,
                _rawDate: dateObj.getTime(),
                type
              }
            })
          }
        }
      } catch {
        // quiet fallback
      }

      // Fetch soft-deleted files to alert user about trash expiration
      let fileTrashNotifications: Announcement[] = []
      try {
        if (window.electron) {
          const trashFilesRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            `SELECT d.id, d.temin_no, d.konu, d.updated_at
             FROM DATA_TeminDosyasi d
             WHERE d.is_deleted = 1
             ORDER BY d.updated_at DESC LIMIT 10`
          )
          if (trashFilesRes?.success && trashFilesRes.data) {
            const retentionDays = useSettingsStore.getState().trashRetentionDays || 30
            fileTrashNotifications = trashFilesRes.data.map((row: any) => {
              const dateObj = new Date(row.updated_at || Date.now())
              const dateStr = dateObj.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
              const elapsedDays = Math.floor(
                (Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
              )
              const remainingDays = Math.max(0, retentionDays - elapsedDays)

              return {
                id: `trash_file_${row.id}`,
                title: `🗑️ Çöp Kutusu: ${row.konu ? `"${row.konu}"` : row.temin_no || 'Temin Dosyası'}`,
                content: `Dosya çöp kutusunda bekletiliyor. ${remainingDays > 0 ? `${remainingDays} gün sonra kalıcı olarak temizlenecektir.` : 'Saklama süresi doldu, kalıcı olarak silinebilir.'} (Saklama Süresi: ${retentionDays} gün)`,
                date: dateStr,
                _rawDate: dateObj.getTime(),
                type: 'warning'
              }
            })
          }
        }
      } catch {
        // quiet fallback
      }

      // Modules in trash notifications
      const moduleTrashNotifications: Announcement[] = []
      try {
        const moduleStore = useModuleStore.getState()
        const trashed = Object.values(moduleStore.trashedModules || {})
        for (const item of trashed) {
          const modDef = RESMI_MODUL_PAKETLERI.find((m) => m.id === item.id)
          const modTitle = modDef?.baslik || item.id
          const dateObj = new Date(item.trashedAt)
          const remainingDays = moduleStore.getRemainingTrashDays(item.id)
          moduleTrashNotifications.push({
            id: `trash_mod_${item.id}`,
            title: `📦 Çöp Kutusu: ${modTitle}`,
            content: `"${modTitle}" paketi çöp kutusunda bekliyor. ${remainingDays > 0 ? `${remainingDays} gün sonra kalıcı olarak kaldırılacaktır.` : 'Saklama süresi doldu.'} Modül Mağazasından geri yükleyebilirsiniz.`,
            date: dateObj.toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            _rawDate: dateObj.getTime(),
            type: 'warning'
          })
        }
      } catch {
        // quiet fallback
      }

      // Merge and sort
      const merged = [
        ...remoteData,
        ...localLogs,
        ...fileNotifications,
        ...fileTrashNotifications,
        ...moduleTrashNotifications
      ].sort((a: any, b: any) => {
        const timeA = a._rawDate || 0
        const timeB = b._rawDate || 0
        return timeB - timeA
      })

      setAnnouncements(merged as Announcement[])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Realtime updates for system notifications & file updates
  useAppEventListener(
    [
      'dossier:created',
      'dossier:updated',
      'dossier:deleted',
      'status:changed',
      'workspace:refreshed',
      'module:installed',
      'module:uninstalled',
      'module:trashed',
      'module:restored'
    ],
    () => {
      loadAnnouncements()
    }
  )

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  return { announcements, isLoading, refetch: loadAnnouncements }
}

export interface SmartAlert {
  id: string
  title: string
  message: string
  type: 'error' | 'warning' | 'info'
  actionLink: string
  actionSearch?: Record<string, string>
  actionText: string
}

export function useSmartAlerts(
  settings: any,
  activeDosyaId: number | null,
  activeSummary: ActiveDosyaSummary | null
) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([])

  useEffect(() => {
    const newAlerts: SmartAlert[] = []

    // 1. Kurum Kimliği ve Türü
    if (!settings.institutionName || !settings.institutionType || !settings.limitType) {
      newAlerts.push({
        id: 'missing_kurum_identity',
        title: 'Kurum Kimliği Eksik',
        message:
          'Kurum adı ve bütçe limit türü seçilmemiş. Limitlerin doğru çalışması için ayarları tamamlayın.',
        type: 'error',
        actionLink: '/mevzuat',
        actionSearch: { tab: 'mali' },
        actionText: 'Kurum ve Mali Ayarlar'
      })
    }

    // 2. Harcama Yetkilisi
    if (!settings.adminName || !settings.adminTitle) {
      newAlerts.push({
        id: 'missing_admin_info',
        title: 'Harcama Yetkilisi Eksik',
        message:
          'Harcama yetkilisi (gerçekleştirme görevlisi) kimlik bilgileri boş. Çıktı evraklarında imza alanları boş kalacaktır.',
        type: 'warning',
        actionLink: '/profil',
        actionSearch: {},
        actionText: 'Profil Ayarları'
      })
    }

    // 3. Kodlar (Say2000i, e-Bütçe vs.)
    if (!settings.kurumsalKod && !settings.harcamaBirimKodu && !settings.muhasebeBirimKodu) {
      newAlerts.push({
        id: 'missing_kurum_codes',
        title: 'Birim Kodları Hatırlatması',
        message:
          'Muhasebat ve harcama birim kodlarınızı ekleyerek resmî yazışma ve evraklarınızın otomatik doldurulmasını sağlayabilirsiniz.',
        type: 'info',
        actionLink: '/mevzuat',
        actionSearch: { tab: 'mali' },
        actionText: 'Kodları Tanımla'
      })
    }

    // 4. Aktif Dosya - Malzeme
    if (activeDosyaId && activeSummary) {
      if (activeSummary.malzemeSayisi === 0) {
        newAlerts.push({
          id: 'missing_items',
          title: 'Dosyada Malzeme Yok',
          message: 'Üzerinde çalıştığınız bu dosyaya (İhtiyaç Listesi) henüz hiç kalem eklenmemiş.',
          type: 'warning',
          actionLink: '/dosya/malzemeler/liste',
          actionText: 'Malzeme Ekle'
        })
      } else if (activeSummary.yaklasikMaliyet === 0) {
        // Malzeme var ama yaklaşık maliyet 0
        newAlerts.push({
          id: 'missing_cost',
          title: 'Maliyet Hesaplanmamış',
          message:
            'İhtiyaç listesi oluşturulmuş fakat Piyasa Fiyat Araştırması yapılarak Yaklaşık Maliyet henüz hesaplanmamış.',
          type: 'error',
          actionLink: '/dosya/firmalar-maliyet/yaklasik',
          actionText: 'Maliyet Hesapla'
        })
      }

      // 5. Aktif Dosya - Firmalar
      if (activeSummary.katilanFirmaSayisi === 0) {
        newAlerts.push({
          id: 'missing_firms',
          title: 'İstekli Firma Eklenmemiş',
          message: 'Piyasa araştırmasına veya doğrudan temine davet edilecek firma seçilmemiş.',
          type: 'warning',
          actionLink: '/dosya/firmalar-maliyet/istekliler',
          actionText: 'Firma Davet Et'
        })
      }

      // 6. Aktif Dosya - Komisyon Atanmamış vs check could be added if we had commission data in summary
    }

    setAlerts(newAlerts)
  }, [settings, activeDosyaId, activeSummary])

  return alerts
}
