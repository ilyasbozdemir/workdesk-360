import { useState, useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DosyaRow,
  emptyRow,
  reverseMapTur,
  reverseMapStatus,
  mapStatus,
  mapTur,
  normalizeTeminTuru,
  formatDateOnly,
  formatDateTimeLocal,
  getDefaultDates
} from './hizliDosyaEkle.types'
import { readFromClipboard } from '../../../../utils/copyToClipboard'

export function useHizliDosyaEkle() {
  const queryClient = useQueryClient()
  const initialDates = getDefaultDates()

  // Kullanıcının üst panelden belirleyebildiği varsayılan süreç tarihleri
  const [defaultDates, setDefaultDates] = useState(initialDates)

  const [rows, setRows] = useState<DosyaRow[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    inserted: number
    updated: number
    errors: string[]
  } | null>(null)
  const [loadLimit, setLoadLimit] = useState(50)
  const tableRef = useRef<HTMLDivElement>(null)

  const updateRow = (key: string, field: keyof DosyaRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r._key === key ? { ...r, [field]: value, _dirty: true } : r))
    )
  }

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(defaultDates)])
    setTimeout(() => {
      tableRef.current?.scrollTo({
        top: tableRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }, 50)
  }

  const removeRow = async (row: DosyaRow) => {
    const isPersisted = row.id !== null
    const hasData =
      row.dosya_no.trim() || row.dt_no.trim() || row.dosya_adi.trim() || row.aciklama.trim()

    if (isPersisted) {
      if (
        !confirm(
          `"${
            row.dosya_adi || 'Dosya'
          }" kaydını veritabanından tamamen silmek istediğinize emin misiniz?`
        )
      ) {
        return
      }
      setIsSaving(true)
      try {
        const res = await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [row.id]
        )
        if (res.success) {
          queryClient.invalidateQueries({ queryKey: ['dosyalar'] })
        } else {
          alert('Silme işlemi başarısız oldu: ' + res.error)
          return
        }
      } catch (err: unknown) {
        alert('Hata: ' + (err instanceof Error ? err.message : String(err)))
        return
      } finally {
        setIsSaving(false)
      }
    } else if (hasData) {
      if (
        !confirm(
          'Satırdaki doldurulmuş verileri iptal edip satırı silmek istediğinize emin misiniz?'
        )
      ) {
        return
      }
    }

    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r._key !== row._key) : [emptyRow(defaultDates)]
    )
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      next.delete(row._key)
      return next
    })
  }

  const loadExisting = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT id, temin_no, ekap_no, konu, isin_aciklamasi, ihale_tipi, ihale_sekli,
                dosya_acilis_tarihi, son_teklif_verme_tarihi, teslim_tarihi, status, tur
         FROM DATA_TeminDosyasi
         WHERE is_deleted = 0
         ORDER BY COALESCE(dosya_acilis_tarihi, created_at) DESC, id DESC
         LIMIT ?`,
        [loadLimit]
      )
      if (res.success) {
        const loaded: DosyaRow[] = res.data.map((d: any) => ({
          _key: Math.random().toString(36).slice(2),
          id: d.id,
          dosya_no: d.temin_no || '',
          dt_no: d.ekap_no || '',
          dosya_adi: d.konu || '',
          aciklama: d.isin_aciklamasi || '',
          temin_turu: reverseMapTur(d.tur || 'mal'),
          temin_sekli: d.ihale_sekli || '22/d',
          dosya_acilis_tarihi: formatDateOnly(d.dosya_acilis_tarihi),
          son_teklif_verme_tarihi: formatDateTimeLocal(d.son_teklif_verme_tarihi),
          teslim_tarihi: formatDateOnly(d.teslim_tarihi),
          surec_asamasi: reverseMapStatus(d.status || 'devam_ediyor'),
          _dirty: false
        }))
        setRows(
          loaded.length > 0
            ? loaded
            : [emptyRow(defaultDates), emptyRow(defaultDates), emptyRow(defaultDates)]
        )
        setSelectedKeys(new Set())
        setResult(null)
      } else {
        alert('Kayıtlar yüklenemedi: ' + res.error)
      }
    } catch (err: unknown) {
      alert('Hata: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [loadLimit, defaultDates])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExisting()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadExisting])

  const handleSave = async () => {
    const toProcess = rows.filter((r) => r.dosya_adi.trim() !== '' && r._dirty)
    const toInsert = toProcess.filter((r) => r.id === null)
    const toUpdate = toProcess.filter((r) => r.id !== null)

    if (toProcess.length === 0) {
      alert('Değiştirilmiş veya doldurulmuş satır yok.')
      return
    }

    setIsSaving(true)
    setResult(null)
    let insertCount = 0
    let updateCount = 0
    const errors: string[] = []

    for (const row of toInsert) {
      try {
        const res = await window.electron.ipcRenderer.invoke(
          'db:run',
          `INSERT INTO DATA_TeminDosyasi
            (temin_no, ekap_no, konu, isin_aciklamasi, ihale_tipi, ihale_sekli,
             dosya_acilis_tarihi, son_teklif_verme_tarihi, teslim_tarihi, status, tur, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            row.dosya_no || null,
            row.dt_no || null,
            row.dosya_adi.trim(),
            row.aciklama || null,
            'Doğrudan Temin',
            row.temin_sekli || '22/d',
            row.dosya_acilis_tarihi || null,
            row.son_teklif_verme_tarihi || null,
            row.teslim_tarihi || null,
            mapStatus(row.surec_asamasi),
            mapTur(row.temin_turu)
          ]
        )
        if (res.success) {
          insertCount++
        } else {
          errors.push(`EKLE "${row.dosya_adi}" - ${res.error}`)
        }
      } catch (err: unknown) {
        errors.push(`EKLE "${row.dosya_adi}" - ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    for (const row of toUpdate) {
      try {
        const res = await window.electron.ipcRenderer.invoke(
          'db:run',
          `UPDATE DATA_TeminDosyasi SET
            temin_no = ?, ekap_no = ?, konu = ?, isin_aciklamasi = ?,
            ihale_tipi = ?, ihale_sekli = ?,
            dosya_acilis_tarihi = ?, son_teklif_verme_tarihi = ?, teslim_tarihi = ?,
            status = ?, tur = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            row.dosya_no || null,
            row.dt_no || null,
            row.dosya_adi.trim(),
            row.aciklama || null,
            'Doğrudan Temin',
            row.temin_sekli || '22/d',
            row.dosya_acilis_tarihi || null,
            row.son_teklif_verme_tarihi || null,
            row.teslim_tarihi || null,
            mapStatus(row.surec_asamasi),
            mapTur(row.temin_turu),
            row.id
          ]
        )
        if (res.success) {
          updateCount++
          setRows((prev) => prev.map((r) => (r._key === row._key ? { ...r, _dirty: false } : r)))
        } else {
          errors.push(`GÜNCELLE "${row.dosya_adi}" - ${res.error}`)
        }
      } catch (err: unknown) {
        errors.push(
          `GÜNCELLE "${row.dosya_adi}" - ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    setResult({ inserted: insertCount, updated: updateCount, errors })
    setIsSaving(false)

    if (insertCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['dosyalar'] })
      const erroredNames = new Set(
        errors.filter((e) => e.startsWith('EKLE')).map((e) => e.split('"')[1])
      )
      setRows((prev) =>
        prev.filter(
          (r) => r.id !== null || r.dosya_adi.trim() === '' || erroredNames.has(r.dosya_adi.trim())
        )
      )
    }
    if (updateCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['dosyalar'] })
    }
  }

  const handlePaste = async () => {
    try {
      const text = await readFromClipboard()
      if (!text || !text.trim()) {
        alert('Panoda yapıştırılacak metin veya tablo bulunamadı.')
        return
      }
      const rawLines = text
        .trim()
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0)
      if (rawLines.length === 0) return

      // Başlık satırı kontrolü: Eğer ilk satır "dosya no", "dt no", "dosya adı" gibi başlık kelimeleri içeriyorsa atla
      const isHeaderLine = (line: string): boolean => {
        const lower = line.toLowerCase()
        return (
          (lower.includes('dosya') && lower.includes('no')) ||
          lower.includes('dosya adı') ||
          lower.includes('temin türü') ||
          lower.includes('ihale türü') ||
          lower.includes('süreç aşaması')
        )
      }

      const lines = isHeaderLine(rawLines[0]) ? rawLines.slice(1) : rawLines

      const newRows: DosyaRow[] = lines
        .map((line) => {
          let c = line.split('\t')
          if (c.length === 1 && line.includes(';')) {
            c = line.split(';')
          }

          // Eğer ilk sütun #1 veya ID sütunu ise (11 sütun veya ID + 10):
          if (c.length >= 11 || (c[0]?.trim().startsWith('#') && c.length >= 8)) {
            c = c.slice(1) // ID sütununu kaydır
          }

          // 10 sütunlu yeni süreç tarihli format:
          // [0] Dosya No, [1] DT No, [2] Adı, [3] Açıklama, [4] Tür, [5] Şekli, [6] Açılış, [7] Son Teklif, [8] Teslim, [9] Aşama
          if (c.length >= 9) {
            return {
              _key: Math.random().toString(36).slice(2),
              id: null,
              dosya_no: c[0]?.trim() || '',
              dt_no: c[1]?.trim() || '',
              dosya_adi: c[2]?.trim() || '',
              aciklama: c[3]?.trim() || '',
              temin_turu: normalizeTeminTuru(c[4]),
              temin_sekli: c[5]?.trim() || '22/d',
              dosya_acilis_tarihi: formatDateOnly(c[6]?.trim()) || defaultDates.dosya_acilis_tarihi,
              son_teklif_verme_tarihi:
                formatDateTimeLocal(c[7]?.trim()) || defaultDates.son_teklif_verme_tarihi,
              teslim_tarihi: formatDateOnly(c[8]?.trim()) || defaultDates.teslim_tarihi,
              surec_asamasi: c[9]?.trim() || 'Hazırlık',
              _dirty: true
            }
          }

          // 7-8 sütunlu format (Örn: Dosya No, DT No, Dosya Adı, Açıklama, Tür, Şekli, Açılış Tarihi, Aşama):
          return {
            _key: Math.random().toString(36).slice(2),
            id: null,
            dosya_no: c[0]?.trim() || '',
            dt_no: c[1]?.trim() || '',
            dosya_adi: c[2]?.trim() || '',
            aciklama: c[3]?.trim() || '',
            temin_turu: normalizeTeminTuru(c[4]),
            temin_sekli: c[5]?.trim() || '22/d',
            dosya_acilis_tarihi: formatDateOnly(c[6]?.trim()) || defaultDates.dosya_acilis_tarihi,
            son_teklif_verme_tarihi: defaultDates.son_teklif_verme_tarihi,
            teslim_tarihi: defaultDates.teslim_tarihi,
            surec_asamasi: c[7]?.trim() || 'Hazırlık',
            _dirty: true
          }
        })
        .filter((r) => r.dosya_adi.trim() !== '' || r.dosya_no.trim() !== '')

      if (newRows.length > 0) {
        setRows((prev) => {
          const allEmpty = prev.every((r) => r.dosya_adi === '' && r.id === null)
          return allEmpty ? newRows : [...prev, ...newRows]
        })
      }
    } catch (err: unknown) {
      console.error('Pano okuma hatası:', err)
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Pano okuma başarısız: ${msg}`)
    }
  }

  const toggleSelectRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    const validRows = rows.filter((r) => r.dosya_adi.trim() !== '')
    if (selectedKeys.size === validRows.length && validRows.length > 0) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(validRows.map((r) => r._key)))
    }
  }

  const handleBulkDelete = async () => {
    const selectedRows = rows.filter((r) => selectedKeys.has(r._key))
    const idsToDelete = selectedRows.map((r) => r.id).filter((id): id is number => id !== null)

    if (idsToDelete.length === 0) {
      if (
        !confirm('Seçilen kaydedilmemiş satırları listeden kaldırmak istediğinize emin misiniz?')
      ) {
        return
      }
      setRows((prev) => prev.filter((r) => !selectedKeys.has(r._key)))
      setSelectedKeys(new Set())
      return
    }

    if (
      !confirm(
        `Seçilen ${idsToDelete.length} dosyayı veritabanından tamamen silmek istediğinize emin misiniz?`
      )
    ) {
      return
    }

    setIsSaving(true)
    let deletedCount = 0
    const errors: string[] = []

    for (const id of idsToDelete) {
      try {
        const res = await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        )
        if (res.success) {
          deletedCount++
        } else {
          errors.push(`ID #${id} silinemedi: ${res.error}`)
        }
      } catch (err: unknown) {
        errors.push(`ID #${id} silinemedi: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    setIsSaving(false)
    queryClient.invalidateQueries({ queryKey: ['dosyalar'] })

    setRows((prev) => prev.filter((r) => r.id === null || !idsToDelete.includes(r.id)))
    setSelectedKeys(new Set())

    if (errors.length > 0) {
      alert('Bazı dosyalar silinirken hata oluştu:\n' + errors.join('\n'))
    } else {
      alert(`${deletedCount} dosya başarıyla silindi.`)
    }
  }

  const handleBulkChangeAsama = (newAsama: string) => {
    setRows((prev) =>
      prev.map((r) =>
        selectedKeys.has(r._key) ? { ...r, surec_asamasi: newAsama, _dirty: true } : r
      )
    )
  }

  const handleBulkChangeTur = (newTur: string) => {
    setRows((prev) =>
      prev.map((r) => (selectedKeys.has(r._key) ? { ...r, temin_turu: newTur, _dirty: true } : r))
    )
  }

  const handleBulkApplyDates = (datesToApply: {
    dosya_acilis_tarihi?: string
    son_teklif_verme_tarihi?: string
    teslim_tarihi?: string
  }) => {
    setRows((prev) =>
      prev.map((r) => {
        if (!selectedKeys.has(r._key)) return r
        const updated = { ...r, _dirty: true }
        if (datesToApply.dosya_acilis_tarihi !== undefined) {
          updated.dosya_acilis_tarihi = datesToApply.dosya_acilis_tarihi
        }
        if (datesToApply.son_teklif_verme_tarihi !== undefined) {
          updated.son_teklif_verme_tarihi = datesToApply.son_teklif_verme_tarihi
        }
        if (datesToApply.teslim_tarihi !== undefined) {
          updated.teslim_tarihi = datesToApply.teslim_tarihi
        }
        return updated
      })
    )
  }

  const applyDefaultDatesToNewRows = () => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== null) return r
        return {
          ...r,
          dosya_acilis_tarihi: defaultDates.dosya_acilis_tarihi,
          son_teklif_verme_tarihi: defaultDates.son_teklif_verme_tarihi,
          teslim_tarihi: defaultDates.teslim_tarihi,
          _dirty: true
        }
      })
    )
  }

  const newCount = rows.filter((r) => r.dosya_adi.trim() !== '' && r.id === null && r._dirty).length
  const updateCount = rows.filter(
    (r) => r.dosya_adi.trim() !== '' && r.id !== null && r._dirty
  ).length
  const totalDirty = newCount + updateCount
  const validRowsCount = rows.filter((r) => r.dosya_adi.trim() !== '').length
  const isAllSelected = validRowsCount > 0 && selectedKeys.size === validRowsCount

  return {
    rows,
    setRows,
    selectedKeys,
    isSaving,
    isLoading,
    result,
    loadLimit,
    setLoadLimit,
    defaultDates,
    setDefaultDates,
    tableRef,
    updateRow,
    addRow,
    removeRow,
    loadExisting,
    handleSave,
    handlePaste,
    toggleSelectRow,
    toggleSelectAll,
    handleBulkDelete,
    handleBulkChangeAsama,
    handleBulkChangeTur,
    handleBulkApplyDates,
    applyDefaultDatesToNewRows,
    newCount,
    updateCount,
    totalDirty,
    validRowsCount,
    isAllSelected
  }
}
