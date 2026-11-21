import { useCallback, useEffect, useState } from 'react'
import { useSettingsStore } from '../../../../../../store/settingsStore'
import { useWorkspaceStore } from '../../../../../../store/workspaceStore'
import { useDosyaAsamasiSablons } from '../../useDosyaAsamasiSablons'
import { FirmaStats, KabulTutanakItem, KomisyonUye } from './types'
import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import { resolveCommissionCategory } from '@temin360/document-templates'
import {
  FaturaKayit
} from '@renderer/screens/bkmybs-mali-yonetim/components/tabs/DosyalarVeFaturalariTab'
import { calculateInvoiceFinancials } from '@renderer/screens/bkmybs-mali-yonetim/utils/invoiceFinancials'
import { fetchCanonicalDossierPricing } from '../../../../../../services/dossier/dossierPriceSyncService'
import { useAppEventListener } from '../../../../../../utils/appEvents'

interface KabulDataCacheEntry {
  kazananFirmaId: number | null
  kazananFirmaUnvan: string
  komisyonBaskani: string
  komisyonUyeleri: KomisyonUye[]
  teslimYeri: string
  firmaStats: FirmaStats
  faturaNo: string
  faturaTarihi: string
  tutanaklar?: KabulTutanakItem[]
}

const kabulDataCache = new Map<number, KabulDataCacheEntry>()

export function useKabulVeOdemeData() {
  const {
    activeStarredDocs,
    sablons,
    ciktiLoading,
    dosyaContext,
    previewModalOpen,
    setPreviewModalOpen,
    previewData,
    handleOpenPreviewForSablon,
    quickPrint,
    quickExport,
    quickOpenExternal,
    isSablonDisabled
  } = useDosyaAsamasiSablons()

  const { disableDocumentGuidance } = useSettingsStore()
  const { activeDosyaId } = useWorkspaceStore()

  const cached = activeDosyaId ? kabulDataCache.get(activeDosyaId) : undefined
  const optimisticFirmaId =
    cached?.kazananFirmaId ??
    (dosyaContext?.firma_id ||
      (dosyaContext?.enAvantajliTeklifSahibi ? 1 : undefined))

  const optimisticUnvan =
    cached?.kazananFirmaUnvan ||
    dosyaContext?.enAvantajliTeklifSahibi ||
    dosyaContext?.kazanan_firma ||
    dosyaContext?.firma_unvani ||
    ''

  const [kazananFirmaId, setKazananFirmaId] = useState<number | null | undefined>(optimisticFirmaId)
  const [kazananFirmaUnvan, setKazananFirmaUnvan] = useState<string>(optimisticUnvan)
  const [komisyonBaskani, setKomisyonBaskani] = useState<string>(cached?.komisyonBaskani || '')
  const [komisyonUyeleri, setKomisyonUyeleri] = useState<KomisyonUye[]>(
    cached?.komisyonUyeleri || []
  )
  const [teslimYeri, setTeslimYeri] = useState<string>(
    cached?.teslimYeri || dosyaContext?.ihtiyac_yeri || ''
  )

  const [firmaStats, setFirmaStats] = useState<FirmaStats>(
    cached?.firmaStats || {
      teklifToplami: dosyaContext?.enAvantajliTeklifBedeli
        ? Number(dosyaContext.enAvantajliTeklifBedeli)
        : null,
      yaklasikMaliyet: dosyaContext?.yaklasikMaliyet ? Number(dosyaContext.yaklasikMaliyet) : null,
      teslimTarihi: null,
      yasaklilikDurumu: null,
      vergiNo: null,
      alimTuru: (dosyaContext?.alimTuru || 'mal') as 'mal' | 'hizmet' | 'yapim'
    }
  )

  const [faturaNo, setFaturaNo] = useState<string>(cached?.faturaNo || '')
  const [faturaTarihi, setFaturaTarihi] = useState<string>(cached?.faturaTarihi || '')
  const [dosyaFaturalari, setDosyaFaturalari] = useState<FaturaKayit[]>([])
  const [isTifModalOpen, setIsTifModalOpen] = useState(false)
  const [isKomisyonModalOpen, setIsKomisyonModalOpen] = useState(false)

  const [tutanaklar, setTutanaklar] = useState<KabulTutanakItem[]>(cached?.tutanaklar || [])
  const [dosyaKalemler, setDosyaKalemler] = useState<any[]>([])
  const [isTutanakModalOpen, setIsTutanakModalOpen] = useState(false)
  const [editingTutanak, setEditingTutanak] = useState<KabulTutanakItem | null>(null)

  const rawAlimTuru = String(
    firmaStats?.alimTuru ||
      dosyaContext?.alimTuru ||
      dosyaContext?.alim_turu ||
      dosyaContext?.tur ||
      'mal'
  ).toLowerCase()
  const isYapim =
    rawAlimTuru.includes('yapim') ||
    rawAlimTuru.includes('inşaat') ||
    rawAlimTuru.includes('insaat')
  const isHizmet =
    !isYapim && (rawAlimTuru.includes('hizmet') || rawAlimTuru.includes('danismanlik'))
  const isMal = !isYapim && !isHizmet
  const alimTuru = isYapim ? 'yapim' : isHizmet ? 'hizmet' : 'mal'

  const handleOpenAddTutanak = (): void => {
    setEditingTutanak(null)
    setIsTutanakModalOpen(true)
  }

  const handleOpenEditTutanak = (item: KabulTutanakItem): void => {
    setEditingTutanak(item)
    setIsTutanakModalOpen(true)
  }

  const handleSaveTutanak = async (tutanakItem: KabulTutanakItem): Promise<void> => {
    const exists = tutanaklar.some((t) => t.id === tutanakItem.id)
    const updated = exists
      ? tutanaklar.map((t) => (t.id === tutanakItem.id ? tutanakItem : t))
      : [...tutanaklar, tutanakItem]

    setTutanaklar(updated)

    if (tutanakItem.faturaNo) {
      setFaturaNo(tutanakItem.faturaNo)
    }
    if (tutanakItem.faturaTarihi) {
      setFaturaTarihi(tutanakItem.faturaTarihi)
    }

    if (activeDosyaId && window.electron) {
      try {
        const fileRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        )
        let existingObj: any = {}
        if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
          try {
            existingObj =
              typeof fileRes.data[0].sablon_tercihleri === 'string'
                ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
                : fileRes.data[0].sablon_tercihleri || {}
          } catch {}
        }
        existingObj.kabulTutanaklari = updated

        // ─── 5018 / BKMYBS Fatura Entegrasyonu ───
        // Tutanakta fatura bilgisi varsa mali masadaki faturalara otomatik senkronize et
        if (tutanakItem.faturaNo && tutanakItem.faturaNo.trim()) {
          const rawFatNo = tutanakItem.faturaNo.trim()
          const normFatNo = rawFatNo.toLowerCase()
          const currentFaturalar: FaturaKayit[] = Array.isArray(existingObj.faturalar)
            ? [...existingObj.faturalar]
            : []

          const idx = currentFaturalar.findIndex(
            (f) => f.faturaNo && f.faturaNo.trim().toLowerCase() === normFatNo
          )

          const tutarNum = Number(tutanakItem.tutar) || 0
          const fin = calculateInvoiceFinancials(tutarNum, 20, 'Yok', false)

          if (idx !== -1) {
            const existingFat = currentFaturalar[idx]
            currentFaturalar[idx] = {
              ...existingFat,
              faturaTarihi: tutanakItem.faturaTarihi || existingFat.faturaTarihi,
              firmaTutar: tutarNum > 0 ? tutarNum : existingFat.firmaTutar,
              matrah: tutarNum > 0 ? fin.matrah : existingFat.matrah,
              kdvTutari: tutarNum > 0 ? fin.kdvTutari : existingFat.kdvTutari,
              damgaVergisi: tutarNum > 0 ? fin.damgaVergisi : existingFat.damgaVergisi,
              kararPulu: 0, // Doğrudan teminde ihale karar pulu kesilmez
              netOdenecek: tutarNum > 0 ? fin.netOdenecek : existingFat.netOdenecek
            }
          } else {
            const newFat: FaturaKayit = {
              id: `fat-${Date.now()}`,
              faturaNo: rawFatNo,
              faturaTarihi: tutanakItem.faturaTarihi || new Date().toISOString().slice(0, 10),
              firmaTutar: tutarNum,
              kdvOrani: 20,
              matrah: fin.matrah,
              kdvTutari: fin.kdvTutari,
              tevkifatOrani: 'Yok',
              tevkifatTutari: 0,
              damgaVergisi: fin.damgaVergisi,
              kararPulu: 0,
              netOdenecek: fin.netOdenecek,
              odemeYontemi: 'Hazine / Muhasebat Ödeme Emri',
              durum: 'beklemede',
              aciklama: `${tutanakItem.tutanakNo || 'Kabul Tutanağı'} ile oluşturulan fatura.`,
              kaynak: 'kabul_tutanagi'
            }
            currentFaturalar.push(newFat)
          }

          existingObj.faturalar = currentFaturalar
          existingObj.faturaNo = rawFatNo
          existingObj.faturaTarihi = tutanakItem.faturaTarihi
          setDosyaFaturalari(currentFaturalar)
        }

        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
          [JSON.stringify(existingObj), activeDosyaId]
        )

        window.dispatchEvent(
          new CustomEvent('dossier:updated', {
            detail: { dosyaId: activeDosyaId }
          })
        )
      } catch (e) {
        console.error('Failed to save kabulTutanaklari:', e)
      }
    }
  }

  const handleDeleteTutanak = async (id: string): Promise<void> => {
    const deletedItem = tutanaklar.find((t) => t.id === id)
    const updated = tutanaklar.filter((t) => t.id !== id)
    setTutanaklar(updated)

    if (activeDosyaId && window.electron) {
      try {
        const fileRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        )
        let existingObj: any = {}
        if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
          try {
            existingObj =
              typeof fileRes.data[0].sablon_tercihleri === 'string'
                ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
                : fileRes.data[0].sablon_tercihleri || {}
          } catch {}
        }
        existingObj.kabulTutanaklari = updated

        // İlgili faturayı da mali masadaki fatura listesinden senkronize temizle
        if (deletedItem?.faturaNo && Array.isArray(existingObj.faturalar)) {
          const delNorm = deletedItem.faturaNo.trim().toLowerCase()
          existingObj.faturalar = existingObj.faturalar.filter(
            (f: any) => !f.faturaNo || f.faturaNo.trim().toLowerCase() !== delNorm
          )
          setDosyaFaturalari(existingObj.faturalar)
        }

        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
          [JSON.stringify(existingObj), activeDosyaId]
        )

        window.dispatchEvent(
          new CustomEvent('dossier:updated', {
            detail: { dosyaId: activeDosyaId }
          })
        )
      } catch (e) {
        console.error('Failed to delete kabulTutanaklari:', e)
      }
    }
  }

  const handleBulkDeleteTutanaklar = async (ids: string[]): Promise<void> => {
    const idSet = new Set(ids)
    const deletedFatNos = new Set(
      tutanaklar
        .filter((t) => idSet.has(t.id) && t.faturaNo)
        .map((t) => t.faturaNo!.trim().toLowerCase())
    )
    const updated = tutanaklar.filter((t) => !idSet.has(t.id))
    setTutanaklar(updated)

    if (activeDosyaId && window.electron) {
      try {
        const fileRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        )
        let existingObj: any = {}
        if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
          try {
            existingObj =
              typeof fileRes.data[0].sablon_tercihleri === 'string'
                ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
                : fileRes.data[0].sablon_tercihleri || {}
          } catch {}
        }
        existingObj.kabulTutanaklari = updated

        if (deletedFatNos.size > 0 && Array.isArray(existingObj.faturalar)) {
          existingObj.faturalar = existingObj.faturalar.filter(
            (f: any) => !f.faturaNo || !deletedFatNos.has(f.faturaNo.trim().toLowerCase())
          )
          setDosyaFaturalari(existingObj.faturalar)
        }

        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
          [JSON.stringify(existingObj), activeDosyaId]
        )

        window.dispatchEvent(
          new CustomEvent('dossier:updated', {
            detail: { dosyaId: activeDosyaId }
          })
        )
      } catch (e) {
        console.error('Failed to bulk delete kabulTutanaklari:', e)
      }
    }
  }

  const handleToggleApproveTutanak = async (id: string): Promise<void> => {
    const todayStr = new Date().toISOString().split('T')[0]
    const updated = tutanaklar.map((t) => {
      if (t.id === id) {
        const nextApproved = !(t.onaylandi ?? true) // varsayılan olarak true değilse toggle
        return {
          ...t,
          onaylandi: nextApproved,
          islenmisMi: nextApproved,
          onayTarihi: nextApproved ? t.onayTarihi || todayStr : undefined
        }
      }
      return t
    })
    setTutanaklar(updated)

    if (activeDosyaId && window.electron) {
      try {
        const fileRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        )
        let existingObj: any = {}
        if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
          try {
            existingObj =
              typeof fileRes.data[0].sablon_tercihleri === 'string'
                ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
                : fileRes.data[0].sablon_tercihleri || {}
          } catch {}
        }
        existingObj.kabulTutanaklari = updated
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
          [JSON.stringify(existingObj), activeDosyaId]
        )
      } catch (e) {
        console.error('Failed to toggle approve tutanak:', e)
      }
    }
  }

  const handleBulkApproveTutanaklar = async (ids: string[], approved = true): Promise<void> => {
    const idSet = new Set(ids)
    const todayStr = new Date().toISOString().split('T')[0]
    const updated = tutanaklar.map((t) => {
      if (idSet.has(t.id)) {
        return {
          ...t,
          onaylandi: approved,
          islenmisMi: approved,
          onayTarihi: approved ? t.onayTarihi || todayStr : undefined
        }
      }
      return t
    })
    setTutanaklar(updated)

    if (activeDosyaId && window.electron) {
      try {
        const fileRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        )
        let existingObj: any = {}
        if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
          try {
            existingObj =
              typeof fileRes.data[0].sablon_tercihleri === 'string'
                ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
                : fileRes.data[0].sablon_tercihleri || {}
          } catch {}
        }
        existingObj.kabulTutanaklari = updated
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
          [JSON.stringify(existingObj), activeDosyaId]
        )
      } catch (e) {
        console.error('Failed to bulk approve tutanaklar:', e)
      }
    }
  }

  const allStageSablons = sablons.filter(
    (s) =>
      s.kategori === '4-kabul-ve-odeme-islemleri' ||
      s.kategori === '4. Muayene & Kabul & Ödeme İşlemleri'
  )

  const stageSablons = allStageSablons.filter((s) => {
    const key = String(s.dosya_adi || s.id || '').toLowerCase()
    if (isYapim) {
      return (
        !key.includes('tasinir-islem-fisi') &&
        !key.includes('hizmet-isleri') &&
        !key.includes('muayene-kabul-tutanagi') &&
        !key.includes('muayene-kabul-komisyonu')
      )
    }
    if (isHizmet) {
      return (
        !key.includes('muayene-kabul-tutanagi') &&
        !key.includes('muayene-kabul-komisyonu') &&
        !key.includes('tasinir-islem-fisi') &&
        !key.includes('yapim') &&
        !key.includes('kik048') &&
        !key.includes('kik049') &&
        !key.includes('kik050') &&
        !key.includes('kik051')
      )
    } else {
      return (
        !key.includes('hizmet-isleri') &&
        !key.includes('hakedis-raporu') &&
        !key.includes('puantaj') &&
        !key.includes('yapim') &&
        !key.includes('kik048') &&
        !key.includes('kik049') &&
        !key.includes('kik050') &&
        !key.includes('kik051')
      )
    }
  })

  const handleQuickPreview = (sablonKey: string, tutanakItem?: KabulTutanakItem): void => {
    const found =
      sablons.find(
        (s) =>
          String(s.dosya_adi || s.id || '').toLowerCase() === sablonKey.toLowerCase() ||
          String(s.dosya_adi || s.id || '')
            .toLowerCase()
            .includes(sablonKey.toLowerCase())
      ) || ({ dosya_adi: sablonKey, ad: sablonKey } as any)

    // Build a per-tutanak override context when a specific row is opened
    let overrideCtx: Record<string, any> | undefined
    if (tutanakItem) {
      const fmt = (val: number | null | undefined) =>
        val != null
          ? new Intl.NumberFormat('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(val)
          : null

      overrideCtx = {
        ...(dosyaContext || {}),
        // Evrak kimliği
        evrakSayisi: tutanakItem.tutanakNo,
        dosyaTarihi: tutanakItem.tutanakTarihi,
        kabulTarihi: tutanakItem.tutanakTarihi,
        tutanakTarihi: tutanakItem.tutanakTarihi,
        // Fatura / irsaliye
        faturaNo: tutanakItem.faturaNo,
        faturaTarihi: tutanakItem.faturaTarihi,
        irsaliyeNo: tutanakItem.irsaliyeNo,
        irsaliyeTarihi: tutanakItem.irsaliyeTarihi,
        // Firma / Yüklenici
        yukleniciFirma: kazananFirmaUnvan,
        yukleniciAdi: kazananFirmaUnvan,
        yukleniciUnvani: kazananFirmaUnvan,
        // Tutarlar
        genelToplam: fmt(tutanakItem.tutar),
        kdvDahilToplam: fmt(tutanakItem.tutar),
        tutar: fmt(tutanakItem.tutar),
        kabulEdilenTutar: fmt(tutanakItem.tutar),
        tutanakNo: tutanakItem.tutanakNo,
        // Yapım Kabul Özel Alanları (KİK048, KİK049, KİK050, KİK051)
        isinAdi: dosyaContext?.is_adi || dosyaContext?.konu || dosyaContext?.ad || 'Yapım İşi',
        sozlesmeTarihi:
          dosyaContext?.sozlesme_tarihi || dosyaContext?.karar_tarihi || tutanakItem.tutanakTarihi,
        sozlesmeBedeli: fmt(tutanakItem.tutar || firmaStats?.teklifToplami),
        isinSuresi: dosyaContext?.isin_suresi || dosyaContext?.teslim_suresi || '30 Takvim Günü',
        isinBitirilmesiGerekenTarih:
          dosyaContext?.bitis_tarihi || dosyaContext?.teslim_tarihi || tutanakItem.tutanakTarihi,
        varsaSureUzatimlari: dosyaContext?.sure_uzatimi || 'Bulunmamaktadır.',
        sureUzatimiDahilBitisTarihi:
          dosyaContext?.sure_uzatimi_bitis ||
          dosyaContext?.bitis_tarihi ||
          tutanakItem.tutanakTarihi,
        isinBitirildigiTarih: tutanakItem.tutanakTarihi,
        geciciKabulItibarTarihi: tutanakItem.tutanakTarihi,
        geciciKabulTarihi: tutanakItem.tutanakTarihi,
        kesinKabulTarihi: tutanakItem.tutanakTarihi,
        teminatSuresi: dosyaContext?.teminat_suresi || '12 Ay',
        kusurVeNoksanlar: tutanakItem.notlar || '',
        onayTarihi: tutanakItem.onayTarihi || tutanakItem.tutanakTarihi,
        // Teslim
        teslimYeri: tutanakItem.teslimYeri,
        // Notlar
        tutanakNotu: tutanakItem.notlar,
        // Mal kalemleri → muayene-kabul-tutanagi şablonu için
        ihtiyacKalemleri: (tutanakItem.kalemler || []).map((k, i) => ({
          siraNo: k.siraNo || i + 1,
          malzemeAdi: k.malzemeAdi,
          ozelligi: k.ozelligi,
          birimi: k.birimi,
          miktar: k.miktari,
          buguneKadarKabulEdilen: k.oncekiTeslimAlinan ?? 0,
          bugunKabulEdilenMiktar: k.kabulMiktari,
          kalanMiktar: Math.max(0, k.miktari - (k.kabulMiktari || 0)),
          birimFiyat: k.birimFiyati,
          birimFiyati: fmt(k.birimFiyati),
          kalemTutari: fmt(k.toplamTutar || (k.kabulMiktari || 0) * (k.birimFiyati || 0)),
          teslimYeri: tutanakItem.teslimYeri
        })),
        // Komisyon heyeti
        komisyonUyeleri: komisyonUyeleri.map((u) => ({
          gorev: u.gorev || 'Üye',
          gorevi: u.gorev || 'Üye',
          adSoyad: u.ad_soyad,
          ad_soyad: u.ad_soyad,
          unvan: u.unvan || ''
        })),
        muayeneKomisyonu: komisyonUyeleri.map((u) => ({
          gorevi: u.gorev || 'Üye',
          adSoyad: u.ad_soyad,
          unvan: u.unvan || ''
        }))
      }
    }

    handleOpenPreviewForSablon(found, (found as any).ad || sablonKey, overrideCtx)
  }

  const reloadKomisyonUyeleri = async (): Promise<void> => {
    if (!activeDosyaId) return
    try {
      const allKomRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT tk.id, tk.komisyon_id, 
                COALESCE(NULLIF(tk.ad_soyad, ''), NULLIF(p.ad_soyad, ''), '') as ad_soyad, 
                COALESCE(NULLIF(tk.unvan, ''), NULLIF(p.unvan, ''), '') as unvan, 
                tk.gorev, tk.komisyon_turu, 
                COALESCE(tk.rol, 'Asil') as asli_yedek 
         FROM DATA_TeminKomisyon tk
         LEFT JOIN TANIM_Personel p ON (
           (tk.personel_id IS NOT NULL AND tk.personel_id > 0 AND tk.personel_id = p.id)
           OR
           ((tk.personel_id IS NULL OR tk.personel_id = 0) AND LOWER(TRIM(tk.ad_soyad)) = LOWER(TRIM(p.ad_soyad)))
         )
         WHERE tk.temin_dosya_id = ?
         ORDER BY (CASE WHEN LOWER(COALESCE(tk.gorev, '')) LIKE '%başkan%' OR LOWER(COALESCE(tk.gorev, '')) LIKE '%baskan%' THEN 0 ELSE 1 END) ASC, tk.id ASC`,
        [activeDosyaId]
      )
      if (allKomRes.success && Array.isArray(allKomRes.data)) {
        const muayeneMembers = allKomRes.data.filter(
          (k: any) => resolveCommissionCategory(k) === 'muayene'
        )
        setKomisyonUyeleri(muayeneMembers)
        const baskan = muayeneMembers.find(
          (k: any) =>
            k.gorev?.toLowerCase().includes('başkan') || k.gorev?.toLowerCase().includes('baskan')
        )
        setKomisyonBaskani(baskan ? baskan.ad_soyad : muayeneMembers[0]?.ad_soyad || '')
      }
    } catch (e) {
      console.error('Failed to reload komisyon:', e)
    }
  }

  const loadKabulData = useCallback(async (isMountedRef?: { current: boolean }): Promise<void> => {
    if (!activeDosyaId) {
      setKazananFirmaId(null)
      setKazananFirmaUnvan('')
      setTutanaklar([])
      setDosyaFaturalari([])
      setFaturaNo('')
      setFaturaTarihi('')
      setDosyaKalemler([])
      return
    }

    try {
      const [dosyaRes, komRes, canonical] = await Promise.all([
        window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT d.firma_id, f.unvan, f.vergi_no,
                  d.yaklasik_maliyet, d.teslim_tarihi,
                  d.fiyat_farki_dayanagi, COALESCE(NULLIF(d.tur, ''), 'mal') as alim_turu,
                  d.dosya_acilis_tarihi, d.temin_tarihi, d.tarih,
                  d.ihtiyac_yeri, d.sablon_tercihleri
           FROM DATA_TeminDosyasi d
           LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
           WHERE d.id = ?`,
          [activeDosyaId]
        ),
        window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT id, komisyon_id, ad_soyad, unvan, gorev, komisyon_turu, COALESCE(rol, 'Asil') as asli_yedek FROM DATA_TeminKomisyon
           WHERE temin_dosya_id = ?
           ORDER BY (CASE WHEN LOWER(COALESCE(gorev, '')) LIKE '%başkan%' OR LOWER(COALESCE(gorev, '')) LIKE '%baskan%' THEN 0 ELSE 1 END) ASC, id ASC`,
          [activeDosyaId]
        ),
        fetchCanonicalDossierPricing(activeDosyaId)
      ])

      if (isMountedRef && !isMountedRef.current) return

      if (dosyaRes.success && dosyaRes.data && dosyaRes.data.length > 0) {
        const row = dosyaRes.data[0]
        const winner = canonical?.kazananFirma || null
        const effectiveFirmaId = winner
          ? Number(winner.master_firma_id || winner.temin_firma_id)
          : row.firma_id || null
        const effectiveUnvan = winner?.unvan || row.unvan || ''
        const effectiveVergiNo = winner?.vergi_no || row.vergi_no || null
        const teklifToplami = canonical?.kazananTeklifToplami ?? null
        const yasaklilikDurumu = winner?.yasaklilik_durumu || null
        const canonicalKalemler = canonical?.kalemler || []

        // Yeni dosyaya geçildiğinde önceki dosyanın tutanak/fatura verilerinin taşınmasını engelle
        let nextTutanaklar: KabulTutanakItem[] = []
        let nextFaturalar: FaturaKayit[] = []
        let nextFaturaNo = ''
        let nextFaturaTarihi = ''

        if (row.sablon_tercihleri) {
          try {
            const prefs =
              typeof row.sablon_tercihleri === 'string'
                ? JSON.parse(row.sablon_tercihleri)
                : row.sablon_tercihleri

            if (Array.isArray(prefs?.kabulTutanaklari)) {
              // Tutanak içindeki kalem birim fiyatları 0 kalmışsa güncel teklif fiyatlarıyla senkronize et
              nextTutanaklar = prefs.kabulTutanaklari.map((tut: KabulTutanakItem) => {
                if (!Array.isArray(tut.kalemler) || canonicalKalemler.length === 0) {
                  if ((!tut.tutar || tut.tutar <= 0) && teklifToplami && teklifToplami > 0) {
                    return { ...tut, tutar: teklifToplami }
                  }
                  return tut
                }
                let recomputedSum = 0
                const syncedKalemler = tut.kalemler.map((tk, idx) => {
                  const matchCanon =
                    canonicalKalemler.find((ck) => ck.sira_no === tk.siraNo) ||
                    canonicalKalemler[idx]
                  const canonPrice = Number(matchCanon?.birim_fiyat || 0)
                  const currentPrice = Number(tk.birimFiyati || 0)
                  const finalPrice = canonPrice > 0 ? canonPrice : currentPrice
                  const kabulMik = Number(tk.kabulMiktari ?? tk.miktari ?? 0)
                  const lineTotal = Number((kabulMik * finalPrice).toFixed(2))
                  recomputedSum += lineTotal
                  return {
                    ...tk,
                    birimFiyati: finalPrice,
                    toplamTutar: lineTotal
                  }
                })
                return {
                  ...tut,
                  kalemler: syncedKalemler,
                  tutar: recomputedSum > 0 ? Number(recomputedSum.toFixed(2)) : tut.tutar || teklifToplami || undefined
                }
              })
            }

            if (Array.isArray(prefs?.faturalar)) {
              nextFaturalar = prefs.faturalar
              if (prefs.faturalar.length > 0) {
                const firstFat = prefs.faturalar[0]
                if (firstFat.faturaNo) nextFaturaNo = firstFat.faturaNo
                if (firstFat.faturaTarihi) nextFaturaTarihi = firstFat.faturaTarihi.slice(0, 10)
              }
            }
            if (prefs?.faturaNo && !nextFaturaNo) {
              nextFaturaNo = prefs.faturaNo
              if (prefs.faturaTarihi) nextFaturaTarihi = prefs.faturaTarihi.slice(0, 10)
            }
          } catch (err) {
            console.warn('Failed to parse kabulTutanaklari from prefs:', err)
          }
        }

        setTutanaklar(nextTutanaklar)
        setDosyaFaturalari(nextFaturalar)
        setFaturaNo(nextFaturaNo)
        setFaturaTarihi(nextFaturaTarihi)
        setDosyaKalemler(canonicalKalemler)

        let fetchedKomUyeleri: KomisyonUye[] = []
        let fetchedBaskan = ''

        const isMuayeneMember = (k: any): boolean => resolveCommissionCategory(k) === 'muayene'

        if (komRes.success && Array.isArray(komRes.data) && komRes.data.length > 0) {
          const muayeneMembers = komRes.data.filter(isMuayeneMember)
          if (muayeneMembers.length > 0) {
            fetchedKomUyeleri = muayeneMembers
          }
        }

        if (fetchedKomUyeleri.length > 0) {
          const baskan = fetchedKomUyeleri.find(
            (k) =>
              k.gorev?.toLowerCase().includes('başkan') ||
              k.gorev?.toLowerCase().includes('baskan')
          )
          fetchedBaskan = baskan ? baskan.ad_soyad : fetchedKomUyeleri[0]?.ad_soyad || ''
        }

        const nextStats: FirmaStats = {
          teklifToplami,
          yaklasikMaliyet: canonical?.toplamYaklasikMaliyet || row.yaklasik_maliyet || null,
          teslimTarihi: row.teslim_tarihi || null,
          yasaklilikDurumu,
          vergiNo: effectiveVergiNo || row.vergi_no || null,
          fiyatFarkiDayanagi: row.fiyat_farki_dayanagi || null,
          alimTuru: row.alim_turu || null,
          dosyaTarihi: row.temin_tarihi || row.dosya_acilis_tarihi || row.tarih || null
        }

        setKazananFirmaId(effectiveFirmaId)
        setKazananFirmaUnvan(effectiveUnvan)
        setTeslimYeri(row.ihtiyac_yeri || '')
        setKomisyonUyeleri(fetchedKomUyeleri)
        setKomisyonBaskani(fetchedBaskan)
        setFirmaStats(nextStats)

        kabulDataCache.set(activeDosyaId, {
          kazananFirmaId: effectiveFirmaId,
          kazananFirmaUnvan: effectiveUnvan,
          komisyonBaskani: fetchedBaskan,
          komisyonUyeleri: fetchedKomUyeleri,
          teslimYeri: row.ihtiyac_yeri || '',
          firmaStats: nextStats,
          faturaNo: nextFaturaNo,
          faturaTarihi: nextFaturaTarihi,
          tutanaklar: nextTutanaklar
        })
      } else {
        setKazananFirmaId(null)
        setTutanaklar([])
        setDosyaFaturalari([])
        setFaturaNo('')
        setFaturaTarihi('')
        setDosyaKalemler([])
      }
    } catch {
      if (!isMountedRef || isMountedRef.current) {
        setKazananFirmaId(null)
      }
    }
  }, [activeDosyaId])

  useEffect(() => {
    const isMountedRef = { current: true }
    loadKabulData(isMountedRef)
    return () => {
      isMountedRef.current = false
    }
  }, [activeDosyaId, loadKabulData])

  useAppEventListener(
    ['items:changed', 'bids:changed', 'dossier:updated', 'workspace:refreshed'],
    () => {
      if (activeDosyaId) {
        kabulDataCache.delete(activeDosyaId)
      }
      loadKabulData()
    }
  )

  return {
    activeDosyaId,
    activeStarredDocs,
    sablons,
    stageSablons,
    ciktiLoading,
    dosyaContext,
    dosyaKalemler,
    previewModalOpen,
    setPreviewModalOpen,
    previewData,
    handleOpenPreviewForSablon,
    quickPrint,
    quickExport,
    quickOpenExternal,
    isSablonDisabled,
    disableDocumentGuidance,
    kazananFirmaId,
    kazananFirmaUnvan,
    komisyonBaskani,
    komisyonUyeleri,
    teslimYeri,
    firmaStats,
    faturaNo,
    setFaturaNo,
    faturaTarihi,
    setFaturaTarihi,
    dosyaFaturalari,
    setDosyaFaturalari,
    isTifModalOpen,
    setIsTifModalOpen,
    isKomisyonModalOpen,
    setIsKomisyonModalOpen,
    tutanaklar,
    isTutanakModalOpen,
    setIsTutanakModalOpen,
    editingTutanak,
    setEditingTutanak,
    alimTuru,
    isMal,
    isHizmet,
    isYapim,
    handleOpenAddTutanak,
    handleOpenEditTutanak,
    handleSaveTutanak,
    handleDeleteTutanak,
    handleBulkDeleteTutanaklar,
    handleToggleApproveTutanak,
    handleBulkApproveTutanaklar,
    handleQuickPreview,
    reloadKomisyonUyeleri,
    handleReloadKomisyon: reloadKomisyonUyeleri,
    formatCurrency,
    formatDate
  }
}
