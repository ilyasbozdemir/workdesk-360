import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSetSelection } from '../../../../../../../hooks/useSetSelection'
import { KalemDiffItem } from '../KatalogSenkronizasyonModal'
import { findSablonByAlias } from '../../../../DosyaAsamalari/constants/sablonAliases'
import { exportDogrudanTeminMasterExcel } from '../../../../../../../services/excelExportService'
import { useGlobalDocumentPreviewStore } from '../../../../../../../store/globalDocumentPreviewStore'
import { seedDossierCommission } from '../../../../../../../services/commission/commissionSeedService'

interface UseMalzemeTablosuActionsProps {
  state: any
  activeDosya?: any
  activeDosyaId?: number | null
  stageSablons?: any[]
  sablons?: any[]
  onSablonClick?: (sablon: any, title: string) => void
}

export function useMalzemeTablosuActions({
  state,
  activeDosya,
  activeDosyaId,
  stageSablons = [],
  sablons = [],
  onSablonClick
}: UseMalzemeTablosuActionsProps) {
  const { items, handleCheckKatalogDiffs, loadData } = state

  // Çoklu komisyon seçimi — değerler DB'den gelen id (number)
  const [selectedKomisyonlar, setSelectedKomisyonlar] = useState<number[]>([])

  // Katalog Senkronizasyon & Diff Modal State'leri
  const [katalogModalOpen, setKatalogModalOpen] = useState(false)
  const [diffItems, setDiffItems] = useState<KalemDiffItem[]>([])
  const [isCheckingDiff, setIsCheckingDiff] = useState(false)

  // Checkbox ve toplu işlem state'leri
  const {
    selectedIds,
    setSelectedIds,
    handleToggleSelectRow,
    handleToggleSelectAll: handleToggleSelectAllBase
  } = useSetSelection<number>()

  const handleToggleSelectAll = () => {
    handleToggleSelectAllBase(items.map((item: any) => item.id))
  }

  // Tüm dosya veya tekil kalem için diff kontrolü tetikleme
  const handleTriggerKatalogSync = async (targetItem?: any) => {
    if (!handleCheckKatalogDiffs) return
    setIsCheckingDiff(true)
    setKatalogModalOpen(true)
    try {
      const diffs = await handleCheckKatalogDiffs(targetItem)
      setDiffItems(diffs)
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsCheckingDiff(false)
    }
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) {
      alert('Lütfen silinecek ihtiyaç kalemlerini seçin.')
      return
    }
    if (!confirm(`Seçilen ${ids.length} kalemi silmek istediğinize emin misiniz?`)) return

    try {
      for (const id of ids) {
        await (window as any).electron.ipcRenderer.invoke(
          'db:run',
          'DELETE FROM DATA_TeminKalem WHERE id = ?',
          [id]
        )
      }
      setSelectedIds(new Set())
      if (loadData) loadData()
    } catch (err: any) {
      alert('Silme işleminde hata oluştu: ' + err.message)
    }
  }

  const handleExcelImport = async () => {
    if (!activeDosyaId) return
    try {
      const res = await (window as any).electron.ipcRenderer.invoke('open-excel')
      if (!res) return

      const XLSX = await import('xlsx')
      const workbook = XLSX.read(res.buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], {
        header: 1
      })

      if (rows.length <= 1) {
        alert('Seçilen Excel dosyasında veri bulunamadı veya boş.')
        return
      }

      let count = 0
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const kalemAdi = row[2] ? String(row[2]).trim() : null
        if (!kalemAdi) continue

        const tasinirKodu = row[0] ? String(row[0]).trim() : null
        const okasKodu = row[1] ? String(row[1]).trim() : null
        const tipi = row[3] ? String(row[3]).trim() : 'Mal'
        const birim = row[4] ? String(row[4]).trim() : 'Adet'
        const miktar = row[5] !== undefined ? Number(row[5]) : 1
        const kdvOrani = row[6] !== undefined ? Number(row[6]) : 20
        const aciklama = row[7] ? String(row[7]).trim() : null

        await (window as any).electron.ipcRenderer.invoke(
          'db:run',
          `INSERT INTO DATA_TeminKalem 
           (temin_dosya_id, tasinir_kodu, okas_kodu, kalem_adi, tipi, birim, miktar, kdv_orani, aciklama) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [activeDosyaId, tasinirKodu, okasKodu, kalemAdi, tipi, birim, miktar, kdvOrani, aciklama]
        )
        count++
      }

      if (count > 0) {
        alert(`${count} adet ihtiyaç kalemi başarıyla içe aktarıldı.`)
        if (loadData) loadData()
      } else {
        alert(
          'İçe aktarıldı: İçe aktarılacak geçerli satır bulunamadı. Lütfen Kalem Adı kolonunun (C sütunu) dolu olduğundan emin olun.'
        )
      }
    } catch (err: any) {
      alert('Excel aktarımında hata: ' + err.message)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await (window as any).electron.ipcRenderer.invoke(
        'db:export-temin-kalem-template'
      )
      if (res && res.success) {
        alert(`Excel şablonu başarıyla indirildi:\n${res.filePath}`)
      } else if (res && res.error) {
        if (res.error !== 'İptal edildi') {
          alert('Şablon indirilemedi: ' + res.error)
        }
      }
    } catch (err: any) {
      alert('Hata oluştu: ' + err.message)
    }
  }

  const handleExportToLibrary = async () => {
    if (items.length === 0) {
      alert('Aktarılacak ihtiyaç kalemi bulunmuyor.')
      return
    }
    if (
      !confirm(
        `Tablodaki ${items.length} ihtiyaç kalemini genel malzeme kütüphanesine aktarmak istediğinize emin misiniz?`
      )
    ) {
      return
    }

    try {
      let addedCount = 0
      let skippedCount = 0

      const libRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT tasinir_kodu, okas_kodu, kalem_adi FROM TANIM_Kalem'
      )
      const libItems = libRes.success ? libRes.data : []

      const cleanString = (str: string) => {
        if (!str) return ''
        return str
          .toLowerCase()
          .replace(/[\s\-_.,\/\\()]/g, '')
          .replace(/ı/g, 'i')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
      }

      for (const item of items) {
        const cleanName = cleanString(item.kalem_adi)
        if (!cleanName) {
          skippedCount++
          continue
        }

        let isDup = false
        for (const lib of libItems) {
          const cleanLibName = cleanString(lib.kalem_adi)

          if (cleanName === cleanLibName) {
            isDup = true
            break
          }

          const sameTasinir =
            item.tasinir_kodu &&
            lib.tasinir_kodu &&
            item.tasinir_kodu.trim() === lib.tasinir_kodu.trim()
          const sameOkas =
            item.okas_kodu && lib.okas_kodu && item.okas_kodu.trim() === lib.okas_kodu.trim()

          if (sameTasinir || sameOkas) {
            if (cleanName.includes(cleanLibName) || cleanLibName.includes(cleanName)) {
              isDup = true
              break
            }
          }
        }

        if (isDup) {
          skippedCount++
          continue
        }

        const barkodId = `LIB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

        const insertRes = await (window as any).electron.ipcRenderer.invoke(
          'db:run',
          `INSERT INTO TANIM_Kalem (barkod_id, tasinir_kodu, okas_kodu, kalem_adi, tipi, birim, kdv_orani, aktif_mi)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            barkodId,
            item.tasinir_kodu || null,
            item.okas_kodu || null,
            item.kalem_adi,
            item.tipi || 'Mal',
            item.birim || 'Adet',
            item.kdv_orani ?? 20
          ]
        )
        if (insertRes.success) {
          addedCount++
          libItems.push({
            tasinir_kodu: item.tasinir_kodu || '',
            okas_kodu: item.okas_kodu || '',
            kalem_adi: item.kalem_adi
          })
        }
      }

      alert(
        `Aktarım tamamlandı.\nKütüphaneye eklenen yeni kalem: ${addedCount}\nMevcut/Benzer olduğu için atlanan kalem: ${skippedCount}`
      )
    } catch (err: any) {
      alert('Kütüphaneye aktarılırken hata oluştu: ' + err.message)
    }
  }

  // DB'deki aktif komisyonları dinamik çek
  const { data: dbKomisyonlar = [] } = useQuery<{ id: number; ad: string; sablonlar: any[] }[]>({
    queryKey: ['tanim_komisyonlar_with_sablons'],
    queryFn: async () => {
      const res = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, ad FROM TANIM_Komisyon WHERE aktif_mi = 1 ORDER BY id ASC'
      )
      if (!res.success) throw new Error(res.error)

      const sablonlarRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        `SELECT ks.komisyon_id, s.id, s.ad, s.aciklama, s.icerik, s.dosya_adi, s.route_path, s.test_verisi, s.kategori 
         FROM TANIM_Komisyon_Sablon ks
         JOIN TANIM_Sablon s ON ks.sablon_id = s.id
         WHERE s.aktif_mi = 1`
      )

      return res.data.map((k: any) => ({
        ...k,
        sablonlar: sablonlarRes.success
          ? sablonlarRes.data.filter((s: any) => s.komisyon_id === k.id)
          : []
      }))
    },
    staleTime: 30_000
  })

  useEffect(() => {
    if (activeDosyaId && dbKomisyonlar.length > 0) {
      const allKomisyonIds = dbKomisyonlar.map((k) => k.id)
      setSelectedKomisyonlar(allKomisyonIds)
      localStorage.setItem(
        `dta_selected_komisyonlar_${activeDosyaId}`,
        JSON.stringify(allKomisyonIds)
      )
      ;(async () => {
        try {
          await seedDossierCommission(activeDosyaId, { mode: 'initial' })
        } catch (e) {
          console.error('Komisyon ilk tohumlama kontrolü hatası:', e)
        }
      })()
    }
  }, [activeDosyaId, dbKomisyonlar])

  const validSelectedKomisyonlar = useMemo(() => {
    return selectedKomisyonlar.filter((id) => dbKomisyonlar.some((k) => k.id === id))
  }, [selectedKomisyonlar, dbKomisyonlar])

  const komisyonSablons = useMemo(() => {
    const sablonsToAdd: any[] = []
    const seenIds = new Set<any>()
    const seenFiles = new Set<string>()

    for (const komisyonId of validSelectedKomisyonlar) {
      const k = dbKomisyonlar.find((k) => k.id === komisyonId)
      if (k && k.sablonlar) {
        for (const s of k.sablonlar) {
          const fileKey = (s.dosya_adi || '').toLowerCase().trim()
          if ((s.id && seenIds.has(s.id)) || (fileKey && seenFiles.has(fileKey))) {
            continue
          }
          const fullSablon =
            sablons?.find(
              (fullS: any) =>
                (fileKey && (fullS.dosya_adi || '').toLowerCase().trim() === fileKey) ||
                (s.id && fullS.id === s.id)
            ) || s

          const finalId = fullSablon.id || s.id
          const finalFile = (fullSablon.dosya_adi || s.dosya_adi || '').toLowerCase().trim()

          if ((finalId && seenIds.has(finalId)) || (finalFile && seenFiles.has(finalFile))) {
            continue
          }

          if (finalId) seenIds.add(finalId)
          if (finalFile) seenFiles.add(finalFile)
          sablonsToAdd.push(fullSablon)
        }
      }
    }
    return sablonsToAdd
  }, [validSelectedKomisyonlar, dbKomisyonlar, sablons])

  const combinedSablons = useMemo(() => {
    const result: any[] = []
    const seenIds = new Set<any>()
    const seenFiles = new Set<string>()

    for (const s of [...stageSablons, ...komisyonSablons]) {
      const id = s.id
      const fileKey = (s.dosya_adi || '').toLowerCase().trim()

      if (id && seenIds.has(id)) continue
      if (fileKey && seenFiles.has(fileKey)) continue

      if (id) seenIds.add(id)
      if (fileKey) seenFiles.add(fileKey)
      result.push(s)
    }
    return result
  }, [stageSablons, komisyonSablons])

  const handleOpenSablonByDosyaAdi = (targetKey: string) => {
    const cleanTarget = targetKey
      .replace(/\.html$/, '')
      .toLowerCase()
      .trim()
    const foundSablon = findSablonByAlias(sablons, cleanTarget)

    if (foundSablon && onSablonClick) {
      onSablonClick(foundSablon, foundSablon.ad)
    } else {
      useGlobalDocumentPreviewStore.getState().openDocument({
        documentId: cleanTarget,
        dosyaId: activeDosyaId || undefined,
        documentTitle: targetKey
          .replace(/-/g, ' ')
          .replace(/\.html$/, '')
          .toLocaleUpperCase('tr-TR')
      })
    }
  }

  const [isExportingMasterExcel, setIsExportingMasterExcel] = useState(false)

  const handleExportMasterExcel = async (): Promise<void> => {
    if (!activeDosyaId) return
    try {
      setIsExportingMasterExcel(true)
      const firmalarRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        `SELECT f.*, tf.id as temin_firma_id, tf.kazandi_mi, tf.teklif_toplami 
         FROM DATA_TeminFirma tf 
         JOIN TANIM_Firma f ON tf.firma_id = f.id 
         WHERE tf.temin_dosya_id = ?`,
        [activeDosyaId]
      )

      const tekliflerRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?',
        [activeDosyaId]
      )

      const komisyonRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM DATA_TeminKomisyon WHERE temin_dosya_id = ?',
        [activeDosyaId]
      )

      const kurumRes = await (window as any).electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM TANIM_Kurum LIMIT 1'
      )

      await exportDogrudanTeminMasterExcel({
        dosya: activeDosya,
        kalemler: items,
        firmalar: firmalarRes.success ? firmalarRes.data : [],
        teklifler: tekliflerRes.success ? tekliflerRes.data : [],
        komisyon: komisyonRes.success ? komisyonRes.data : [],
        kurum: kurumRes.success ? kurumRes.data?.[0] : null,
        sablons: sablons
      })
    } catch (err: any) {
      alert('Dosya Excel raporu hazırlanırken hata oluştu: ' + err.message)
    } finally {
      setIsExportingMasterExcel(false)
    }
  }

  return {
    selectedIds,
    handleToggleSelectRow,
    handleToggleSelectAll,
    handleDeleteSelected,
    handleExcelImport,
    handleDownloadTemplate,
    handleExportToLibrary,
    handleTriggerKatalogSync,
    katalogModalOpen,
    setKatalogModalOpen,
    diffItems,
    isCheckingDiff,
    combinedSablons,
    handleOpenSablonByDosyaAdi,
    isExportingMasterExcel,
    handleExportMasterExcel
  }
}
