import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { EvrakItem, DosyaSummaryInfo } from './types'
import { loadDocumentPreviewData } from '../../components/DocumentPreviewModalV3/hooks/helpers/previewDataLoader'
import { DocumentEngine } from '@worksuite-360/document-engine'
import { resolveTemplateKey } from '@temin360/document-templates'

export function useDosyaEvrakAkisi() {
  const { activeDosyaId, setActiveDosyaId } = useWorkspaceStore()

  // Durum Yönetimi
  const [loading, setLoading] = useState<boolean>(true)
  const [docLoading, setDocLoading] = useState<boolean>(false)
  const [dosyalarList, setDosyalarList] = useState<Array<{ id: number; teminNo: string; konu: string }>>([])
  const [dosyaInfo, setDosyaInfo] = useState<DosyaSummaryInfo | null>(null)
  const [evraklar, setEvraklar] = useState<EvrakItem[]>([])
  const [selectedEvrakId, setSelectedEvrakId] = useState<string>('')
  
  // Görüntüleme Ayarları
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [stageFilter, setStageFilter] = useState<number | 'all'>('all')
  const [viewMode, setViewMode] = useState<'canvas' | 'pdf'>('pdf') // Varsayılan olarak doğrudan gerçek PDF önizlemesi
  const [previewScale, setPreviewScale] = useState<number>(1.0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Aktif Belge İçerik Verileri
  const [activeTemplateData, setActiveTemplateData] = useState<any>(null)
  const [activePdfBlobUrl, setActivePdfBlobUrl] = useState<string | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false)

  // 1. Tüm Dosyaları Çek (Dosya Değiştirici İçin)
  const fetchAllDosyalar = useCallback(async () => {
    if (!window.electron?.ipcRenderer) return
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, temin_no, konu FROM DATA_TeminDosyasi ORDER BY id DESC'
      )
      if (res?.success && Array.isArray(res.data)) {
        setDosyalarList(
          res.data.map((d: any) => ({
            id: d.id,
            teminNo: d.temin_no || `Dosya #${d.id}`,
            konu: d.konu || 'İsimsiz Doğrudan Temin Dosyası'
          }))
        )
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] Dosya listesi çekilemedi:', e)
    }
  }, [])

  // 2. Aktif Dosyanın Detaylarını ve Belge Akışını Derle
  const fetchDosyaEvraklari = useCallback(async () => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 2.1 Dosya Bilgisini Oku
      const fileRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT id, temin_no, konu, harcama_birimi, birim, alim_turu, tur, 
                sozlesme_yapilacak_mi, yaklasik_maliyet, net_odenen, durum, 
                evrak_sayisi, temin_tarihi, tarih, sablon_tercihleri, 
                kazanan_firma, kazanan_vkn, butce_kodu
         FROM DATA_TeminDosyasi WHERE id = ?`,
        [activeDosyaId]
      )

      const d = fileRes?.data?.[0]
      if (!d) {
        setDosyaInfo(null)
        setEvraklar([])
        setLoading(false)
        return
      }

      const sozlesmeliMi = Number(d.sozlesme_yapilacak_mi) === 1
      const alimTuru = (d.alim_turu || d.tur || 'mal').toLowerCase()

      const summary: DosyaSummaryInfo = {
        id: d.id,
        teminNo: d.temin_no || `2026/DT-${d.id}`,
        konu: d.konu || 'Doğrudan Temin Alımı',
        harcamaBirimi: d.harcama_birimi || d.birim || 'Fen İşleri Müdürlüğü',
        alimTuru: alimTuru === 'hizmet' ? 'Hizmet Alımı' : alimTuru === 'yapim' ? 'Yapım İşi' : 'Mal Alımı',
        sozlesmeliMi,
        yaklasikMaliyet: Number(d.yaklasik_maliyet) || 0,
        netOdenen: Number(d.net_odenen) || 0,
        durum: d.durum || 'Devam Ediyor',
        evrakSayisi: d.evrak_sayisi || '1',
        tarih: d.temin_tarihi || d.tarih || new Date().toISOString().slice(0, 10),
        butceKodu: d.butce_kodu,
        kazananFirma: d.kazanan_firma,
        kazananVkn: d.kazanan_vkn
      }
      setDosyaInfo(summary)

      // 2.2 Belge Snapshot'larını Çek (DATA_TeminBelgeSnapshot)
      const snapshotsMap = new Map<string, any>()
      try {
        const snapRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT id, sablon_kodu, updated_at, created_at 
           FROM DATA_TeminBelgeSnapshot 
           WHERE dosya_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
          [activeDosyaId]
        )
        if (snapRes?.success && Array.isArray(snapRes.data)) {
          for (const s of snapRes.data) {
            snapshotsMap.set(s.sablon_kodu.toLowerCase(), s)
            snapshotsMap.set(s.sablon_kodu.toLowerCase().replace(/_/g, '-'), s)
          }
        }
      } catch (err) {
        console.warn('[DosyaEvrakAkisi] Snapshotlar okunamadı:', err)
      }

      // 2.3 İmzalı ve Yüklenen Belgeleri Çek (DATA_TeminBelge)
      const signedDocsList: any[] = []
      try {
        const signedRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT id, belge_adi, is_signed, imzali_dosya_yolu, dosya_yolu, belge_tarihi, durum, created_at 
           FROM DATA_TeminBelge 
           WHERE temin_dosya_id = ? ORDER BY id ASC`,
          [activeDosyaId]
        )
        if (signedRes?.success && Array.isArray(signedRes.data)) {
          signedDocsList.push(...signedRes.data)
        }
      } catch (err) {
        console.warn('[DosyaEvrakAkisi] İmzalı belgeler okunamadı:', err)
      }

      // 2.4 Tercihlerdeki Ekler ve Fatura PDF'leri
      let preferences: any = {}
      if (d.sablon_tercihleri) {
        try {
          preferences = typeof d.sablon_tercihleri === 'string'
            ? JSON.parse(d.sablon_tercihleri)
            : d.sablon_tercihleri || {}
        } catch {
          preferences = {}
        }
      }

      // 2.5 Firmalar Yasaklılık Belgeleri
      const yasaklilikDocsList: any[] = []
      try {
        const firmaRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT id, unvan, yasaklilik_belgesi 
           FROM DATA_TeminFirma 
           WHERE temin_dosya_id = ? AND yasaklilik_belgesi IS NOT NULL AND yasaklilik_belgesi != ''`,
          [activeDosyaId]
        )
        if (firmaRes?.success && Array.isArray(firmaRes.data)) {
          yasaklilikDocsList.push(...firmaRes.data)
        }
      } catch (err) {
        console.warn('[DosyaEvrakAkisi] Yasaklılık belgeleri okunamadı:', err)
      }

      // 2.6 Süreç Standart Akış Belgelerini Oluştur
      const items: EvrakItem[] = []

      // ── 1. AŞAMA: HAZIRLIK & İHTİYAÇ ──
      const stage1Docs = [
        {
          code: 'ihtiyac_listesi',
          title: 'İhtiyaç Listesi & Malzeme İcmal Cetveli',
          iconType: 'file-text' as const,
          description: 'Talep edilen mal/hizmet kalemleri, birimleri ve miktarları'
        },
        {
          code: 'ihtiyac_talep_formu',
          title: 'İhtiyaç Talep Formu & Lüzum Müzekkeresi',
          iconType: 'file-text' as const,
          description: 'Harcama birimi resmi ihtiyaç gerekçesi ve olur yazısı'
        },
        {
          code: 'dogrudan_temin_onay_belgesi',
          title: 'Doğrudan Temin Onay Belgesi',
          iconType: 'shield' as const,
          description: 'Harcama Yetkilisi 4734 md. 22 onay ve yetki belgesi'
        },
        {
          code: 'harcama_talimati',
          title: 'Harcama Talimatı & Süreç Başlatma',
          iconType: 'file-text' as const,
          description: 'Mali harcama ve tahsisat talimatı'
        },
        {
          code: 'piyasa_fiyat_arastirma_gorevlendirmesi',
          title: 'Piyasa Fiyat Araştırma Görevlendirmesi',
          iconType: 'scale' as const,
          description: 'Piyasa araştırması yapacak görevli personelin atama kararı'
        }
      ]

      for (const doc of stage1Docs) {
        const snap = snapshotsMap.get(doc.code) || snapshotsMap.get(doc.code.replace(/_/g, '-'))
        const isHazir = Boolean(snap)
        items.push({
          id: `doc-${doc.code}`,
          code: doc.code,
          title: doc.title,
          stage: 1,
          stageName: '1. Hazırlık & İhtiyaç',
          type: 'template',
          status: isHazir ? 'hazir' : 'taslak',
          badge: isHazir
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800' }
            : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
          iconType: doc.iconType,
          date: snap?.updated_at || summary.tarih,
          snapshotExists: isHazir,
          description: doc.description
        })
      }

      // ── 2. AŞAMA: TEKLİFLER & PİYASA FİYAT ARAŞTIRMASI ──
      const stage2Docs = [
        {
          code: 'fiyat_arastirma_mektubu',
          title: 'Tedarikçi Teklif İsteme Mektubu',
          iconType: 'file-text' as const,
          description: 'Firmalara dağıtılan resmi teklif davet mektubu'
        },
        {
          code: 'birim_fiyat_teklif_mektubu',
          title: 'Birim Fiyat Teklif Cetveli',
          iconType: 'coins' as const,
          description: 'İsteklilerin doldurarak teslim ettiği fiyat teklif cetveli'
        },
        {
          code: 'piyasa_fiyat_arastirma_tutanagi',
          title: 'Piyasa Fiyat Araştırması Tutanağı',
          iconType: 'scale' as const,
          description: 'Tekliflerin karşılaştırıldığı ve en uygun teklifin tespit edildiği tutanak'
        },
        {
          code: 'yaklasik_maliyet_cetveli',
          title: 'Yaklaşık Maliyet Hesap Cetveli',
          iconType: 'coins' as const,
          description: 'Teklif aritmetik ortalaması veya en düşük fiyata göre hesaplanan maliyet'
        }
      ]

      for (const doc of stage2Docs) {
        const snap = snapshotsMap.get(doc.code) || snapshotsMap.get(doc.code.replace(/_/g, '-'))
        const isHazir = Boolean(snap)
        items.push({
          id: `doc-${doc.code}`,
          code: doc.code,
          title: doc.title,
          stage: 2,
          stageName: '2. Fiyat Araştırması',
          type: 'template',
          status: isHazir ? 'hazir' : 'taslak',
          badge: isHazir
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-indigo-50 dark:bg-indigo-950/40', textColor: 'text-indigo-700 dark:text-indigo-300', borderColor: 'border-indigo-200 dark:border-indigo-800' }
            : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
          iconType: doc.iconType,
          date: snap?.updated_at || summary.tarih,
          snapshotExists: isHazir,
          description: doc.description
        })
      }

      // ── 3. AŞAMA: KARAR & SİPARİŞ / SÖZLEŞME ──
      items.push({
        id: 'doc-dogrudan_temin_sonuc_onay_belgesi',
        code: 'dogrudan_temin_sonuc_onay_belgesi',
        title: 'Doğrudan Temin Karar & Sonuç Tutanağı',
        stage: 3,
        stageName: '3. Karar & Sözleşme',
        type: 'template',
        status: snapshotsMap.has('dogrudan_temin_sonuc_onay_belgesi') ? 'hazir' : 'taslak',
        badge: snapshotsMap.has('dogrudan_temin_sonuc_onay_belgesi')
          ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
          : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
        iconType: 'scale',
        date: summary.tarih,
        description: 'Alımın en uygun teklifi veren yükleniciye verilme kararı'
      })

      if (sozlesmeliMi) {
        items.push({
          id: 'doc-sozlesme_taslagi',
          code: 'sozlesme_taslagi',
          title: 'Doğrudan Temin Sözleşme Taslağı (4734)',
          stage: 3,
          stageName: '3. Karar & Sözleşme',
          type: 'template',
          status: snapshotsMap.has('sozlesme_taslagi') ? 'hazir' : 'taslak',
          badge: snapshotsMap.has('sozlesme_taslagi')
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' }
            : { label: 'Sözleşmeli Alım', color: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' },
          iconType: 'signature',
          date: summary.tarih,
          description: 'İdare ile yüklenici arasında imzalanacak resmi sözleşme metni'
        })
      } else {
        items.push({
          id: 'doc-siparis_mektubu',
          code: 'siparis_mektubu',
          title: 'Tedarikçi Sipariş & Temin Mektubu',
          stage: 3,
          stageName: '3. Karar & Sözleşme',
          type: 'template',
          status: snapshotsMap.has('siparis_mektubu') ? 'hazir' : 'taslak',
          badge: { label: 'Sözleşmesiz Alım', color: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200 dark:border-amber-800' },
          iconType: 'truck',
          date: summary.tarih,
          description: 'Sözleşme düzenlenmeyen doğrudan temin alımlarında resmi sipariş belgesi'
        })
      }

      // ── 4. AŞAMA: KABUL, FATURA & ÖDEME ──
      items.push({
        id: 'doc-muayene_kabul_tutanagi',
        code: 'muayene_kabul_tutanagi',
        title: 'Muayene ve Kabul Komisyonu Tutanağı',
        stage: 4,
        stageName: '4. Kabul & Ödeme',
        type: 'template',
        status: snapshotsMap.has('muayene_kabul_tutanagi') ? 'hazir' : 'taslak',
        badge: snapshotsMap.has('muayene_kabul_tutanagi')
          ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
          : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
        iconType: 'file-check',
        date: summary.tarih,
        description: 'Mal/hizmetin teknik şartname ve siparişe uygun teslim alındığına dair tutanak'
      })

      if (alimTuru === 'mal') {
        items.push({
          id: 'doc-teslim_tesellum_tutanagi',
          code: 'teslim_tesellum_tutanagi',
          title: 'Taşınır Teslim Tesellüm Belgesi (Ambar)',
          stage: 4,
          stageName: '4. Kabul & Ödeme',
          type: 'template',
          status: snapshotsMap.has('teslim_tesellum_tutanagi') ? 'hazir' : 'taslak',
          badge: { label: 'Mal Alımı Zorunlu', color: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800' },
          iconType: 'truck',
          date: summary.tarih,
          description: 'Taşınır Kayıt Yetkilisi / Ambar teslim tesellüm belgesi'
        })
      }

      items.push(
        {
          id: 'doc-hakedis_raporu',
          code: 'hakedis_raporu',
          title: 'Hakediş Raporu & Fatura İcmali (5018)',
          stage: 4,
          stageName: '4. Kabul & Ödeme',
          type: 'template',
          status: snapshotsMap.has('hakedis_raporu') ? 'hazir' : 'taslak',
          badge: snapshotsMap.has('hakedis_raporu')
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
            : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
          iconType: 'receipt',
          date: summary.tarih,
          description: 'Fatura tahakkuku ve yasal kesintiler icmal belgesi'
        },
        {
          id: 'doc-odeme_emri_belgesi',
          code: 'odeme_emri_belgesi',
          title: 'Muhasebe Ödeme Emri Belgesi (MİF)',
          stage: 4,
          stageName: '4. Kabul & Ödeme',
          type: 'template',
          status: snapshotsMap.has('odeme_emri_belgesi') ? 'hazir' : 'taslak',
          badge: snapshotsMap.has('odeme_emri_belgesi')
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
            : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
          iconType: 'receipt',
          date: summary.tarih,
          description: 'Harcama Yetkilisi ve Gerçekleştirme Görevlisi onaylı MİF ödeme emri'
        }
      )

      // ── 5. AŞAMA: İMZALI VE YÜKLENEN GERÇEK BELGELER (DATA_TeminBelge & Ekler) ──
      for (const signed of signedDocsList) {
        const filePath = signed.imzali_dosya_yolu || signed.dosya_yolu || ''
        items.push({
          id: `signed-${signed.id}`,
          code: `signed-${signed.id}`,
          title: signed.belge_adi || 'İmzalı Belge Dosyası',
          stage: 5,
          stageName: '5. İmzalı & Ek Belgeler',
          type: 'signed_pdf',
          status: signed.is_signed ? 'imzali' : 'hazir',
          badge: signed.is_signed
            ? { label: 'İmzalı PDF', color: 'bg-emerald-100 dark:bg-emerald-950/60', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-300 dark:border-emerald-700' }
            : { label: 'Yüklendi', color: 'bg-blue-100 dark:bg-blue-950/60', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-300 dark:border-blue-700' },
          iconType: 'signature',
          filePath,
          fileName: filePath.split(/[/\\]/).pop() || signed.belge_adi,
          date: signed.belge_tarihi || (signed.created_at ? String(signed.created_at).slice(0, 10) : undefined),
          signer: signed.is_signed ? 'Islak İmzalı / Taranmış Belge' : undefined,
          dbRecordId: signed.id,
          canDelete: true,
          description: 'Dosyaya taranarak eklenmiş ıslak imzalı resmi evrak'
        })
      }

      // Fatura PDF'leri (sablon_tercihleri.faturalar)
      if (Array.isArray(preferences.faturalar)) {
        preferences.faturalar.forEach((f: any, idx: number) => {
          if (f.pdfPath) {
            items.push({
              id: `fat-pdf-${idx}-${f.id || idx}`,
              code: `fat-pdf-${idx}`,
              title: `Fatura PDF'i: ${f.faturaNo || `FAT-${idx + 1}`}`,
              stage: 5,
              stageName: '5. İmzalı & Ek Belgeler',
              type: 'uploaded_pdf',
              status: 'imzali',
              badge: { label: 'Fatura PDF', color: 'bg-rose-50 dark:bg-rose-950/50', textColor: 'text-rose-700 dark:text-rose-300', borderColor: 'border-rose-200 dark:border-rose-800' },
              iconType: 'receipt',
              filePath: f.pdfPath,
              fileName: f.pdfAdi || f.pdfPath.split(/[/\\]/).pop(),
              date: f.faturaTarihi || summary.tarih,
              description: `Yüklenici faturasının orijinal elektronik PDF belgesi`
            })
          }
        })
      }

      // Firma Yasaklılık Belgeleri
      for (const y of yasaklilikDocsList) {
        items.push({
          id: `yasak-pdf-${y.id}`,
          code: `yasak-pdf-${y.id}`,
          title: `EKAP Yasaklılık Teyit Belgesi (${y.unvan})`,
          stage: 5,
          stageName: '5. İmzalı & Ek Belgeler',
          type: 'uploaded_pdf',
          status: 'hazir',
          badge: { label: 'EKAP Teyit', color: 'bg-amber-50 dark:bg-amber-950/50', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200 dark:border-amber-800' },
          iconType: 'shield',
          filePath: y.yasaklilik_belgesi,
          fileName: y.yasaklilik_belgesi.split(/[/\\]/).pop(),
          date: summary.tarih,
          description: 'KİK / EKAP İhale Yasaklılık Sorgulama Çıktısı'
        })
      }

      setEvraklar(items)

      // İlk evrak seçilmemişse veya seçilen evrak listede yoksa ilkini seç
      setSelectedEvrakId((prev) => {
        if (prev && items.some((it) => it.id === prev)) return prev
        return items[0]?.id || ''
      })
    } catch (e) {
      console.error('[DosyaEvrakAkisi] Evraklar derlenirken hata:', e)
    } finally {
      setLoading(false)
    }
  }, [activeDosyaId])

  useEffect(() => {
    fetchAllDosyalar()
    fetchDosyaEvraklari()
  }, [fetchAllDosyalar, fetchDosyaEvraklari])

  // Seçili Belgeyi Bul
  const selectedEvrak = useMemo(() => {
    return evraklar.find((e) => e.id === selectedEvrakId) || evraklar[0] || null
  }, [evraklar, selectedEvrakId])

  // Filtrelenmiş Evrak Listesi
  const filteredEvraklar = useMemo(() => {
    return evraklar.filter((item) => {
      if (stageFilter !== 'all' && item.stage !== stageFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(q)
        const matchesCode = item.code.toLowerCase().includes(q)
        const matchesDesc = (item.description || '').toLowerCase().includes(q)
        const matchesFile = (item.fileName || '').toLowerCase().includes(q)
        if (!matchesTitle && !matchesCode && !matchesDesc && !matchesFile) return false
      }
      return true
    })
  }, [evraklar, stageFilter, searchQuery])

  // Navigasyon İndeksleri
  const currentIndex = useMemo(() => {
    if (!selectedEvrak) return -1
    return filteredEvraklar.findIndex((e) => e.id === selectedEvrak.id)
  }, [filteredEvraklar, selectedEvrak])

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < filteredEvraklar.length - 1

  const selectPrevEvrak = useCallback(() => {
    if (hasPrev) {
      setSelectedEvrakId(filteredEvraklar[currentIndex - 1].id)
    }
  }, [hasPrev, currentIndex, filteredEvraklar])

  const selectNextEvrak = useCallback(() => {
    if (hasNext) {
      setSelectedEvrakId(filteredEvraklar[currentIndex + 1].id)
    }
  }, [hasNext, currentIndex, filteredEvraklar])

  // 3. Seçilen Belgenin İçeriğini Yükle
  useEffect(() => {
    if (!selectedEvrak) return

    let isMounted = true
    setDocLoading(true)
    setCurrentPage(1)
    setTotalPages(1)

    // Önceki blob url'ini temizle
    if (activePdfBlobUrl) {
      URL.revokeObjectURL(activePdfBlobUrl)
      setActivePdfBlobUrl(null)
    }

    const loadContent = async () => {
      try {
        if (selectedEvrak.type === 'template') {
          // DocumentEngine üzerinden canlı şablon verisini yükle
          const dataResult = await loadDocumentPreviewData({
            activeDosyaId: activeDosyaId || 0,
            resolvedId: selectedEvrak.code,
            selectedDocId: selectedEvrak.code
          })
          if (isMounted) {
            setActiveTemplateData(dataResult.finalData)
          }

          // Hazır şablon belgelerini doğrudan PDF olarak derle ve önizle
          if (window.electron?.ipcRenderer) {
            try {
              const targetKey = resolveTemplateKey(selectedEvrak.code) || selectedEvrak.code
              const html = DocumentEngine.compileHtml({
                templateKey: targetKey,
                data: dataResult.finalData,
                orientation: dataResult.finalData.orientation || 'portrait'
              })
              const pdfRes = await window.electron.ipcRenderer.invoke('belge:preview-pdf', html)
              if (isMounted && pdfRes?.success && pdfRes.data) {
                const byteCharacters = atob(pdfRes.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/pdf' })
                const url = URL.createObjectURL(blob)
                setActivePdfBlobUrl(url)
                setViewMode('pdf')
              } else if (isMounted) {
                setViewMode('canvas')
              }
            } catch (pdfErr) {
              console.warn('[DosyaEvrakAkisi] PDF derlenemedi, tuval moduna geçiliyor:', pdfErr)
              if (isMounted) setViewMode('canvas')
            }
          } else if (isMounted) {
            setViewMode('canvas')
          }
        } else if (selectedEvrak.type === 'signed_pdf' || selectedEvrak.type === 'uploaded_pdf') {
          // PDF dosyasını base64 okuyup Blob URL'e çevir
          if (selectedEvrak.filePath && window.electron?.ipcRenderer) {
            const res = await window.electron.ipcRenderer.invoke(
              'workspace:read-attachment-base64',
              selectedEvrak.filePath
            )
            if (isMounted && res?.success && res.data?.base64) {
              const byteCharacters = atob(res.data.base64)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const blob = new Blob([byteArray], { type: res.data.mimeType || 'application/pdf' })
              const url = URL.createObjectURL(blob)
              setActivePdfBlobUrl(url)
              setViewMode('pdf')
            }
          }
        }
      } catch (err) {
        console.error('[DosyaEvrakAkisi] Belge içeriği yüklenemedi:', err)
      } finally {
        if (isMounted) setDocLoading(false)
      }
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [selectedEvrak?.id, activeDosyaId])

  // 4. Şablon İçin Canlı PDF Üretme
  const generatePdfPreviewForTemplate = useCallback(async () => {
    if (!selectedEvrak || selectedEvrak.type !== 'template' || !activeTemplateData || !window.electron?.ipcRenderer) {
      return
    }

    try {
      setPdfGenerating(true)
      const targetKey = resolveTemplateKey(selectedEvrak.code) || selectedEvrak.code
      const html = DocumentEngine.compileHtml({
        templateKey: targetKey,
        data: activeTemplateData,
        orientation: activeTemplateData.orientation || 'portrait'
      })

      const pdfRes = await window.electron.ipcRenderer.invoke('belge:preview-pdf', html)
      if (pdfRes?.success && pdfRes.data) {
        const byteCharacters = atob(pdfRes.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        if (activePdfBlobUrl) URL.revokeObjectURL(activePdfBlobUrl)
        setActivePdfBlobUrl(url)
        setViewMode('pdf')
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] PDF derlenemedi:', e)
    } finally {
      setPdfGenerating(false)
    }
  }, [selectedEvrak, activeTemplateData, activePdfBlobUrl])

  // 5. Yeni İmzalı Belge / PDF Yükle
  const handleUploadSignedPdf = useCallback(async () => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) return

    try {
      const openRes = await window.electron.ipcRenderer.invoke('dialog:showOpenDialog', {
        title: 'İmzalı Belge / Ek PDF Dosyası Seç',
        filters: [{ name: 'PDF ve Dokümanlar', extensions: ['pdf', 'png', 'jpg', 'jpeg'] }]
      })

      if (!openRes?.success || !openRes.filePaths || openRes.filePaths.length === 0) {
        return
      }

      const sourcePath = openRes.filePaths[0]
      const uploadRes = await window.electron.ipcRenderer.invoke('workspace:upload-file', sourcePath)

      if (uploadRes?.success) {
        const baseName = sourcePath.split(/[/\\]/).pop()?.replace(/\.[^/.]+$/, '') || 'İmzalı Evrak'
        const currentDate = new Date().toISOString().slice(0, 10)

        const insertRes = await window.electron.ipcRenderer.invoke(
          'db:run',
          `INSERT INTO DATA_TeminBelge (temin_dosya_id, belge_adi, is_signed, imzali_dosya_yolu, belge_tarihi)
           VALUES (?, ?, 1, ?, ?)`,
          [activeDosyaId, `${baseName} (İmzalı)`, uploadRes.relativePath, currentDate]
        )

        if (insertRes?.success) {
          await fetchDosyaEvraklari()
        }
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] İmzalı belge yükleme hatası:', e)
    }
  }, [activeDosyaId, fetchDosyaEvraklari])

  // 6. İmzalı Belgeyi Sil
  const handleDeleteSignedDoc = useCallback(async (docId: number) => {
    if (!window.electron?.ipcRenderer) return
    const confirmed = window.confirm('Bu imzalı belge kaydını dosyadan silmek istediğinize emin misiniz?')
    if (!confirmed) return

    try {
      await window.electron.ipcRenderer.invoke('db:run', 'DELETE FROM DATA_TeminBelge WHERE id = ?', [docId])
      await fetchDosyaEvraklari()
    } catch (e) {
      console.error('[DosyaEvrakAkisi] İmzalı belge silinemedi:', e)
    }
  }, [fetchDosyaEvraklari])

  // 7. Harici PDF Okuyucuda Aç
  const handleOpenExternal = useCallback(async () => {
    if (!selectedEvrak || !window.electron?.ipcRenderer) return

    try {
      if (selectedEvrak.filePath) {
        await window.electron.ipcRenderer.invoke('workspace:open-file', selectedEvrak.filePath)
      } else if (activeTemplateData) {
        const targetKey = resolveTemplateKey(selectedEvrak.code) || selectedEvrak.code
        const html = DocumentEngine.compileHtml({
          templateKey: targetKey,
          data: activeTemplateData,
          orientation: activeTemplateData.orientation || 'portrait'
        })
        await window.electron.ipcRenderer.invoke('belge:open-pdf-external', { html })
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] Harici açma hatası:', e)
    }
  }, [selectedEvrak, activeTemplateData])

  // 8. Yazdır
  const handlePrint = useCallback(async () => {
    if (!window.electron?.ipcRenderer) return
    try {
      if (selectedEvrak?.type === 'template' && activeTemplateData) {
        const targetKey = resolveTemplateKey(selectedEvrak.code) || selectedEvrak.code
        const html = DocumentEngine.compileHtml({
          templateKey: targetKey,
          data: activeTemplateData,
          orientation: activeTemplateData.orientation || 'portrait'
        })
        await window.electron.ipcRenderer.invoke('belge:print-html', html)
      } else if (selectedEvrak?.filePath) {
        await window.electron.ipcRenderer.invoke('workspace:open-file', selectedEvrak.filePath)
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] Yazdırma hatası:', e)
    }
  }, [selectedEvrak, activeTemplateData])

  // 9. PDF Olarak Kaydet / Dışa Aktar
  const handleExportPdf = useCallback(async () => {
    if (!selectedEvrak || !window.electron?.ipcRenderer) return
    try {
      if (selectedEvrak.type === 'template' && activeTemplateData) {
        const targetKey = resolveTemplateKey(selectedEvrak.code) || selectedEvrak.code
        const html = DocumentEngine.compileHtml({
          templateKey: targetKey,
          data: activeTemplateData,
          orientation: activeTemplateData.orientation || 'portrait'
        })
        await window.electron.ipcRenderer.invoke('app:save-pdf-as', {
          html,
          defaultFileName: `${dosyaInfo?.teminNo || 'Dosya'}_${selectedEvrak.title}.pdf`
        })
      } else if (selectedEvrak.filePath) {
        await window.electron.ipcRenderer.invoke('workspace:open-file', selectedEvrak.filePath)
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] PDF dışa aktarma hatası:', e)
    }
  }, [selectedEvrak, activeTemplateData, dosyaInfo])

  // 10. Klavye Kısayolları (Yukarı / Aşağı ok ile belge değiştirme)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Eğer bir input veya textarea üzerinde yazı yazılıyorsa engelleme
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (hasPrev) {
          e.preventDefault()
          selectPrevEvrak()
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (hasNext) {
          e.preventDefault()
          selectNextEvrak()
        }
      } else if (e.key === '+' || e.key === '=') {
        setPreviewScale((s) => Math.min(1.75, Number((s + 0.1).toFixed(2))))
      } else if (e.key === '-' || e.key === '_') {
        setPreviewScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(2))))
      } else if (e.key === '0') {
        setPreviewScale(1.0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasPrev, hasNext, selectPrevEvrak, selectNextEvrak])

  return {
    loading,
    docLoading,
    pdfGenerating,
    activeDosyaId,
    setActiveDosyaId,
    dosyalarList,
    dosyaInfo,
    evraklar,
    filteredEvraklar,
    selectedEvrak,
    selectedEvrakId,
    setSelectedEvrakId,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    viewMode,
    setViewMode,
    previewScale,
    setPreviewScale,
    currentPage,
    setCurrentPage,
    totalPages,
    setTotalPages,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isFullscreen,
    setIsFullscreen,
    activeTemplateData,
    activePdfBlobUrl,
    currentIndex,
    hasPrev,
    hasNext,
    selectPrevEvrak,
    selectNextEvrak,
    generatePdfPreviewForTemplate,
    handleUploadSignedPdf,
    handleDeleteSignedDoc,
    handleOpenExternal,
    handlePrint,
    handleExportPdf,
    refreshAll: fetchDosyaEvraklari
  }
}
