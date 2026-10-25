import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sablon } from '../../../sablonlar/sablonlar.hooks'
import { BelgeKanbanItem, BelgeKanbanStatus } from './belgeKanbanTypes'
import { normalizeForMatch } from '@renderer/utils/formatters'
import { usePrintQueueStore } from '../../../../store/printQueueStore'
import { emitAppEvent } from '../../../../utils/appEvents'

interface DbBelgeRow {
  id: number
  temin_dosya_id: number
  dosya_id?: number
  belge_adi: string
  sablon_id?: number | null
  dosya_yolu?: string | null
  is_signed?: number | null
  imzali_dosya_yolu?: string | null
  belge_tarihi?: string | null
  durum?: string | null
  bekleme_nedeni?: string | null
  created_at?: string | null
}

interface UseBelgeKanbanDataProps {
  activeDosyaId: number | null
  sablons: Sablon[]
  getMissingRequirement: (sablon: Sablon) => string | null
}

export function useBelgeKanbanData({
  activeDosyaId,
  sablons,
  getMissingRequirement
}: UseBelgeKanbanDataProps) {
  const [dbBelgeler, setDbBelgeler] = useState<DbBelgeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Record<string, { durum: BelgeKanbanStatus; beklemeNedeni?: string | null }>
  >({})

  const { isDocumentLocked, getDocumentStatus } = usePrintQueueStore()

  // Veritabanından belgeleri çek
  const fetchDbBelgeler = useCallback(async () => {
    if (!activeDosyaId) {
      setDbBelgeler([])
      return
    }
    setLoading(true)
    try {
      if (window.electron?.ipcRenderer) {
        const res = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT id, temin_dosya_id, dosya_id, belge_adi, sablon_id, dosya_yolu, is_signed, imzali_dosya_yolu, belge_tarihi, durum, bekleme_nedeni, created_at FROM DATA_TeminBelge WHERE temin_dosya_id = ? ORDER BY id ASC',
          [activeDosyaId]
        )
        if (res?.success && Array.isArray(res.data)) {
          setDbBelgeler(res.data)
        } else {
          setDbBelgeler([])
        }
      }
    } catch (err) {
      console.error('DATA_TeminBelge sorgulama hatası:', err)
      setDbBelgeler([])
    } finally {
      setLoading(false)
    }
  }, [activeDosyaId])

  useEffect(() => {
    fetchDbBelgeler()
  }, [fetchDbBelgeler])

  // Şablonlar ve Veritabanı Belgelerini Birleştir
  const allItems = useMemo((): BelgeKanbanItem[] => {
    const items: BelgeKanbanItem[] = []
    const matchedDbIds = new Set<number>()

    // 1. Şablonlar üzerinden geç
    sablons.forEach((s) => {
      const docKey = (s.dosya_adi || '').replace(/\.html$/, '')
      const missing = getMissingRequirement(s)
      const locked = activeDosyaId ? isDocumentLocked(activeDosyaId, docKey) : false
      const printSt = activeDosyaId ? getDocumentStatus(activeDosyaId, docKey) : 'draft'

      // Eşleşen DB kaydı bul
      const dbMatch = dbBelgeler.find(
        (b) =>
          normalizeForMatch(b.belge_adi) === normalizeForMatch(s.ad) ||
          (b.sablon_id && b.sablon_id === s.id)
      )

      let initialStatus: BelgeKanbanStatus = 'hazirlanacak'
      let beklemeNedeni: string | null = null
      let isProduced = false
      let dbId: number | null = null
      let isSigned = false
      let updatedAt: string | null = null

      if (dbMatch) {
        matchedDbIds.add(dbMatch.id)
        isProduced = true
        dbId = dbMatch.id
        isSigned = dbMatch.is_signed === 1
        updatedAt = dbMatch.belge_tarihi || dbMatch.created_at || null
        beklemeNedeni = dbMatch.bekleme_nedeni || null

        if (isSigned) {
          initialStatus = 'tamamlandi'
        } else if (
          dbMatch.durum &&
          ['hazirlanacak', 'hazirlaniyor', 'beklemede', 'tamamlandi'].includes(dbMatch.durum)
        ) {
          initialStatus = dbMatch.durum as BelgeKanbanStatus
        } else {
          // Eğer durum belirtilmemişse varsayılan olarak 'hazirlaniyor'
          initialStatus = 'hazirlaniyor'
        }
      } else {
        // DB kaydı yok: Eğer yazdırma kuyruğunda printed ise tamamlandi, ready ise hazirlaniyor
        if (printSt === 'printed') {
          initialStatus = 'tamamlandi'
        } else if (printSt === 'ready_to_print') {
          initialStatus = 'hazirlaniyor'
        } else {
          initialStatus = 'hazirlanacak'
        }
      }

      const itemKey = `sablon_${s.id}`
      const override = optimisticOverrides[itemKey]

      items.push({
        id: itemKey,
        dbId,
        sablonId: s.id,
        belgeAdi: s.ad,
        dosyaAdi: s.dosya_adi || `${s.ad}.html`,
        kategori: s.kategori || 'Genel',
        durum: override ? override.durum : initialStatus,
        beklemeNedeni:
          override && override.beklemeNedeni !== undefined ? override.beklemeNedeni : beklemeNedeni,
        isProduced,
        isSigned,
        isLocked: locked,
        missingMsg: missing,
        updatedAt,
        sablon: s
      })
    })

    // 2. Şablonlarda yer almayan ancak DATA_TeminBelge'de bulunan belgeleri ekle (özel evraklar)
    dbBelgeler.forEach((b) => {
      if (!matchedDbIds.has(b.id)) {
        let initialStatus: BelgeKanbanStatus = 'hazirlaniyor'
        if (b.is_signed === 1) {
          initialStatus = 'tamamlandi'
        } else if (
          b.durum &&
          ['hazirlanacak', 'hazirlaniyor', 'beklemede', 'tamamlandi'].includes(b.durum)
        ) {
          initialStatus = b.durum as BelgeKanbanStatus
        }

        const itemKey = `doc_${b.id}`
        const override = optimisticOverrides[itemKey]

        items.push({
          id: itemKey,
          dbId: b.id,
          sablonId: b.sablon_id || null,
          belgeAdi: b.belge_adi,
          dosyaAdi: b.dosya_yolu || b.imzali_dosya_yolu || `${b.belge_adi}.pdf`,
          kategori: 'Ek Belgeler',
          durum: override ? override.durum : initialStatus,
          beklemeNedeni:
            override && override.beklemeNedeni !== undefined
              ? override.beklemeNedeni
              : b.bekleme_nedeni || null,
          isProduced: true,
          isSigned: b.is_signed === 1,
          isLocked: false,
          missingMsg: null,
          updatedAt: b.belge_tarihi || b.created_at || null,
          sablon: null
        })
      }
    })

    return items
  }, [
    sablons,
    dbBelgeler,
    getMissingRequirement,
    activeDosyaId,
    isDocumentLocked,
    getDocumentStatus,
    optimisticOverrides
  ])

  // Sütunlara göre ayrıştırma
  const columnsData = useMemo((): Record<BelgeKanbanStatus, BelgeKanbanItem[]> => {
    const res: Record<BelgeKanbanStatus, BelgeKanbanItem[]> = {
      hazirlanacak: [],
      hazirlaniyor: [],
      beklemede: [],
      tamamlandi: []
    }
    allItems.forEach((item) => {
      if (res[item.durum]) {
        res[item.durum].push(item)
      } else {
        res.hazirlanacak.push(item)
      }
    })
    return res
  }, [allItems])

  // Durum taşıma (Drag & Drop veya Detay Dialogundan)
  const moveItem = useCallback(
    async (itemId: string, targetStatus: BelgeKanbanStatus, beklemeNedeniParam?: string | null) => {
      const item = allItems.find((i) => i.id === itemId)
      if (!item) return
      if (item.durum === targetStatus && beklemeNedeniParam === undefined) return

      const finalBeklemeNedeni =
        beklemeNedeniParam !== undefined
          ? beklemeNedeniParam
          : targetStatus === 'beklemede'
            ? item.beklemeNedeni || 'İmza / onay bekleniyor'
            : null

      // 1. Optimistic Update
      setOptimisticOverrides((prev) => ({
        ...prev,
        [itemId]: { durum: targetStatus, beklemeNedeni: finalBeklemeNedeni }
      }))

      // 2. Database Persistence
      try {
        if (!activeDosyaId) {
          throw new Error('Aktif dosya seçili değil.')
        }

        if (window.electron?.ipcRenderer) {
          if (item.isProduced && item.dbId) {
            // Var olan belgeyi güncelle
            const res = await window.electron.ipcRenderer.invoke(
              'db:run',
              'UPDATE DATA_TeminBelge SET durum = ?, bekleme_nedeni = ? WHERE id = ?',
              [targetStatus, finalBeklemeNedeni, item.dbId]
            )
            if (!res?.success) {
              throw new Error(res?.error || 'Belge durumu güncellenemedi.')
            }
          } else {
            // Şablondan yeni bir DATA_TeminBelge kaydı oluştur
            const res = await window.electron.ipcRenderer.invoke(
              'db:run',
              'INSERT INTO DATA_TeminBelge (temin_dosya_id, dosya_id, belge_adi, sablon_id, durum, bekleme_nedeni, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
              [
                activeDosyaId,
                activeDosyaId,
                item.belgeAdi,
                item.sablonId,
                targetStatus,
                finalBeklemeNedeni
              ]
            )
            if (!res?.success) {
              throw new Error(res?.error || 'Yeni belge kaydı oluşturulamadı.')
            }
          }

          emitAppEvent('document:status_changed' as any, {
            dosyaId: activeDosyaId,
            belgeAdi: item.belgeAdi,
            durum: targetStatus
          })

          // Yeniden fetch ederek gerçek veriyi eşitle
          await fetchDbBelgeler()
        }
      } catch (err: unknown) {
        console.error('Belge durumu kaydetme hatası:', err)
        // Rollback optimistic override
        setOptimisticOverrides((prev) => {
          const updated = { ...prev }
          delete updated[itemId]
          return updated
        })
        const msg = err instanceof Error ? err.message : 'Kayıt başarısız oldu.'
        setErrorMessage(`Durum güncellenirken hata oluştu: ${msg}`)
        setTimeout(() => setErrorMessage(''), 5000)
      }
    },
    [allItems, activeDosyaId, fetchDbBelgeler]
  )

  // Sadece bekleme nedenini güncelleme
  const updateBeklemeNedeni = useCallback(
    async (itemId: string, reason: string) => {
      const item = allItems.find((i) => i.id === itemId)
      if (!item) return

      setOptimisticOverrides((prev) => ({
        ...prev,
        [itemId]: { durum: item.durum, beklemeNedeni: reason }
      }))

      try {
        if (!activeDosyaId) return
        if (window.electron?.ipcRenderer) {
          if (item.isProduced && item.dbId) {
            await window.electron.ipcRenderer.invoke(
              'db:run',
              'UPDATE DATA_TeminBelge SET bekleme_nedeni = ? WHERE id = ?',
              [reason, item.dbId]
            )
          } else {
            await window.electron.ipcRenderer.invoke(
              'db:run',
              'INSERT INTO DATA_TeminBelge (temin_dosya_id, dosya_id, belge_adi, sablon_id, durum, bekleme_nedeni, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
              [activeDosyaId, activeDosyaId, item.belgeAdi, item.sablonId, item.durum, reason]
            )
          }
          await fetchDbBelgeler()
        }
      } catch (err) {
        console.error('Bekleme nedeni güncellenemedi:', err)
      }
    },
    [allItems, activeDosyaId, fetchDbBelgeler]
  )

  return {
    items: allItems,
    columnsData,
    loading,
    errorMessage,
    setErrorMessage,
    moveItem,
    updateBeklemeNedeni,
    refresh: fetchDbBelgeler
  }
}
