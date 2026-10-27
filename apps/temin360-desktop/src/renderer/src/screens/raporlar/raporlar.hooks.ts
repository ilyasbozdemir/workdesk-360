import { useState, useEffect } from 'react'

export interface RaporDosyaItem {
  id: number
  dosya_no: string
  temin_no?: string
  is_adi: string
  konu?: string
  tur: string
  alim_turu: string
  madde: string
  tarih?: string
  temin_tarihi?: string
  dosya_acilis_tarihi?: string
  butce_yili?: string
  odenek_tertibi?: string
  kullanilabilir_odenek?: string
  birim?: string
  durum?: string
  created_at?: string
  toplam_tutar: number
  kdv_dahil_tutar: number
  kazanan_firma?: string
  kazanan_vkn?: string
}

export interface RaporFilters {
  seciliYil: string
  seciliAy?: string
  tarihEsasi?: 'temin' | 'acilis'
  tarihBaslangic?: string
  tarihBitis?: string
  seciliBirim?: string
  alimTuru?: string
}

export function useRaporlarData(filtersOrYear: string | RaporFilters, ay?: string) {
  const filters: RaporFilters =
    typeof filtersOrYear === 'string' ? { seciliYil: filtersOrYear, seciliAy: ay } : filtersOrYear

  const [data, setData] = useState<RaporDosyaItem[]>([])
  const [birimlerList, setBirimlerList] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return
    setLoading(true)
    setError(null)

    try {
      const dateCol =
        filters.tarihEsasi === 'acilis'
          ? 'COALESCE(d.dosya_acilis_tarihi, substr(d.created_at, 1, 10))'
          : 'COALESCE(d.temin_tarihi, d.dosya_acilis_tarihi, substr(d.created_at, 1, 10))'

      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT 
          d.id,
          COALESCE(NULLIF(d.temin_no, ''), '#' || d.id) as dosya_no,
          d.temin_no,
          COALESCE(NULLIF(d.konu, ''), 'İsimsiz Alım') as is_adi,
          d.konu,
          d.tur,
          COALESCE(NULLIF(d.tur, ''), 'mal') as alim_turu,
          d.temin_tarihi,
          d.dosya_acilis_tarihi,
          ${dateCol} as aktif_tarih,
          d.butce_yili,
          COALESCE(d.butce_kodu, d.e_butce, '') as odenek_tertibi,
          COALESCE(b.birim_adi, b.ad, d.birim, d.harcama_birimi, '') as birim,
          d.birim_id,
          COALESCE(d.status, 'devam_ediyor') as durum,
          COALESCE(d.ihale_sekli, '4734 Sayılı Kanun Md. 22/d') as madde,
          d.created_at,
          COALESCE(d.yaklasik_maliyet, 0) as yaklasik_maliyet,
          COALESCE(d.net_odenen, 0) as net_odenen,
          COALESCE(
            (
              SELECT f.teklif_toplami 
              FROM DATA_TeminFirma f 
              WHERE (f.temin_dosya_id = d.id OR f.dosya_id = d.id) AND (f.kazandi_mi = 1 OR f.kazanan_mi = 1)
              LIMIT 1
            ),
            d.net_odenen,
            d.yaklasik_maliyet,
            0
          ) as toplam_tutar,
          (
            SELECT COALESCE(tf.unvan, f.unvan)
            FROM DATA_TeminFirma f
            LEFT JOIN TANIM_Firma tf ON tf.id = f.firma_id
            WHERE (f.temin_dosya_id = d.id OR f.dosya_id = d.id) AND (f.kazandi_mi = 1 OR f.kazanan_mi = 1)
            LIMIT 1
          ) as kazanan_firma,
          (
            SELECT COALESCE(tf.vergi_no, f.vergi_no)
            FROM DATA_TeminFirma f
            LEFT JOIN TANIM_Firma tf ON tf.id = f.firma_id
            WHERE (f.temin_dosya_id = d.id OR f.dosya_id = d.id) AND (f.kazandi_mi = 1 OR f.kazanan_mi = 1)
            LIMIT 1
          ) as kazanan_vkn
        FROM DATA_TeminDosyasi d
        LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
        WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
        ORDER BY d.id DESC`
      )

      if (res.success && Array.isArray(res.data)) {
        const units = new Set<string>()
        const mapped: RaporDosyaItem[] = res.data.map((r: any) => {
          if (r.birim) units.add(r.birim)
          const rawTur = (r.alim_turu || r.tur || 'mal').toLowerCase()
          let normalizedTur = 'Mal Alımı'
          if (rawTur.includes('hizmet')) normalizedTur = 'Hizmet Alımı'
          else if (rawTur.includes('yapım') || rawTur.includes('yapim')) normalizedTur = 'Yapım İşi'
          else if (rawTur.includes('danışman') || rawTur.includes('danisman'))
            normalizedTur = 'Danışmanlık'

          const tutar = Number(r.toplam_tutar) || 0
          const kdvDahil = tutar * 1.2

          return {
            id: r.id,
            dosya_no: r.dosya_no || `#${r.id}`,
            temin_no: r.temin_no || '',
            is_adi: r.is_adi,
            konu: r.konu || '',
            tur: rawTur,
            alim_turu: normalizedTur,
            madde: r.madde || '4734 Sayılı Kanun Md. 22/d',
            tarih: r.aktif_tarih || r.temin_tarihi || r.dosya_acilis_tarihi || r.created_at?.split('T')[0] || '',
            temin_tarihi: r.temin_tarihi || '',
            dosya_acilis_tarihi: r.dosya_acilis_tarihi || r.created_at?.split('T')[0] || '',
            butce_yili: r.butce_yili ? String(r.butce_yili) : (r.aktif_tarih ? r.aktif_tarih.slice(0, 4) : ''),
            odenek_tertibi: r.odenek_tertibi || '',
            kullanilabilir_odenek: '',
            birim: r.birim || '',
            durum: r.durum || 'devam_ediyor',
            created_at: r.created_at || '',
            toplam_tutar: tutar,
            kdv_dahil_tutar: kdvDahil,
            kazanan_firma: r.kazanan_firma || 'Belirlenmedi / Teklif Aşamasında',
            kazanan_vkn: r.kazanan_vkn || ''
          }
        })

        setBirimlerList(Array.from(units))

        let filtered = mapped

        if (filters.seciliYil) {
          filtered = filtered.filter((item) => {
            const itemYear =
              item.butce_yili || item.tarih?.slice(0, 4) || item.created_at?.slice(0, 4)
            return itemYear === filters.seciliYil
          })
        }

        if (filters.tarihBaslangic) {
          filtered = filtered.filter((item) => !item.tarih || item.tarih >= filters.tarihBaslangic!)
        }
        if (filters.tarihBitis) {
          filtered = filtered.filter((item) => !item.tarih || item.tarih <= filters.tarihBitis!)
        }
        if (filters.seciliBirim && filters.seciliBirim !== 'tumu') {
          filtered = filtered.filter((item) => item.birim === filters.seciliBirim)
        }
        if (filters.alimTuru && filters.alimTuru !== 'tumu') {
          filtered = filtered.filter((item) =>
            item.alim_turu.toLowerCase().includes(filters.alimTuru!.toLowerCase())
          )
        }

        setData(filtered)
      } else {
        setData([])
      }
    } catch (err: any) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [
    filters.seciliYil,
    filters.seciliAy,
    filters.tarihEsasi,
    filters.tarihBaslangic,
    filters.tarihBitis,
    filters.seciliBirim,
    filters.alimTuru
  ])

  return { data, birimlerList, loading, error, refetch: fetchData }
}
