import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { EvrakItem, DosyaSummaryInfo } from './types'
import { loadDocumentPreviewData } from '../../components/DocumentPreviewModalV3/hooks/helpers/previewDataLoader'
import { compileDocumentHtml } from '../../components/DocumentPreviewModalV3/hooks/helpers/previewExportUtils'
import { resolveTemplateConfig } from '../../components/DocumentPreviewModalV3/templateResolver'
import {
  resolveTemplateRouteForDocument,
  getRotaConfigForTemplate
} from '@renderer/services/rotaDefaultsService'
import { formatDateString } from '../../contextBuilder/dateHelpers'
import { resolveTemplateKey, toTrDate } from '@temin360/document-templates'
import { PrintSettings } from '@renderer/components/ui/ExcelStylePrintModal'
import { APP_ROUTES } from '@renderer/constants/routeConstants'

export function getStageRoute(stage: number): string {
  switch (stage) {
    case 1:
      return APP_ROUTES.HAZIRLIK_VE_IHTIYAC
    case 2:
      return APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI
    case 3:
      return APP_ROUTES.SIPARIS_VE_SOZLESME
    case 4:
      return APP_ROUTES.KABUL_VE_ODEME
    case 5:
      return APP_ROUTES.IMZALI_BELGELER
    default:
      return APP_ROUTES.DOSYALAR
  }
}

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
  const [copyCount, setCopyCount] = useState<number>(1)
  const [activeViewVariant, setActiveViewVariant] = useState<'template' | 'signed'>('template')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<string[]>([])
  const [specificTargetCode, setSpecificTargetCode] = useState<string | undefined>(undefined)

  // Aktif Belge İçerik Verileri
  const [activeTemplateData, setActiveTemplateData] = useState<any>(null)
  const [personelListesi, setPersonelListesi] = useState<any[]>([])
  const [firmaListesi, setFirmaListesi] = useState<any[]>([])
  const [birimListesi, setBirimListesi] = useState<any[]>([])
  const [activePdfBlobUrl, setActivePdfBlobUrl] = useState<string | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false)
  const [isPrinting, setIsPrinting] = useState<boolean>(false)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

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
    if (!window.electron?.ipcRenderer) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 2.1 Dosya Bilgisini Oku (Hatasız ve Çok Katmanlı Güvenli Arama)
      let d: any = null
      const numId = Number(activeDosyaId)
      const strId = String(activeDosyaId || '').trim()

      if (activeDosyaId) {
        // 1. Doğrudan ID ile sorgula (sayısal veya metin olarak)
        const fileRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM DATA_TeminDosyasi WHERE id = ? OR id = ? LIMIT 1',
          [!isNaN(numId) ? numId : 0, strId]
        )
        d = fileRes?.data?.[0] || (Array.isArray(fileRes) ? fileRes[0] : null)

        // 2. Eğer id ile bulunamadıysa, temin_no veya kaynak_kayit_id ile sorgula
        if (!d && strId) {
          const altRes = await window.electron.ipcRenderer.invoke(
            'db:query',
            'SELECT * FROM DATA_TeminDosyasi WHERE temin_no = ? OR kaynak_kayit_id = ? OR temin_no LIKE ? LIMIT 1',
            [strId, !isNaN(numId) ? numId : 0, `%${strId}%`]
          )
          d = altRes?.data?.[0] || (Array.isArray(altRes) ? altRes[0] : null)
          if (d && d.id) {
            setActiveDosyaId(d.id)
          }
        }
      }

      // 3. Eğer hala dosya bulunamadıysa (örneğin oturumdan kalan geçersiz dosya ID'si), veritabanındaki en son aktif dosyayı seç
      if (!d) {
        const fallbackRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM DATA_TeminDosyasi ORDER BY id DESC LIMIT 1'
        )
        d = fallbackRes?.data?.[0] || (Array.isArray(fallbackRes) ? fallbackRes[0] : null)
        if (d && d.id) {
          setActiveDosyaId(d.id)
        }
      }

      if (!d) {
        setDosyaInfo(null)
        setEvraklar([])
        setLoading(false)
        return
      }

      const actualDosyaId = d.id

      // Kazanan veya İlgili İstekli Firma Bilgisini Çek
      let kazananFirmaUnvan = ''
      let kazananFirmaVkn = ''
      try {
        const firmRes = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT unvan, vergi_no FROM DATA_TeminFirma 
           WHERE temin_dosya_id = ? AND (kazanan_mi = 1 OR kazandi_mi = 1) 
           ORDER BY id DESC LIMIT 1`,
          [actualDosyaId]
        )
        if (firmRes?.success && firmRes.data?.[0]) {
          kazananFirmaUnvan = firmRes.data[0].unvan || ''
          kazananFirmaVkn = firmRes.data[0].vergi_no || ''
        } else {
          const fallbackFirm = await window.electron.ipcRenderer.invoke(
            'db:query',
            'SELECT unvan, vergi_no FROM DATA_TeminFirma WHERE temin_dosya_id = ? ORDER BY id ASC LIMIT 1',
            [actualDosyaId]
          )
          if (fallbackFirm?.success && fallbackFirm.data?.[0]) {
            kazananFirmaUnvan = fallbackFirm.data[0].unvan || ''
            kazananFirmaVkn = fallbackFirm.data[0].vergi_no || ''
          }
        }
      } catch (firmErr) {
        console.warn('[DosyaEvrakAkisi] Firma sorgusu atlandı:', firmErr)
      }

      const sozlesmeliMi = Number(d.sozlesme_yapilacak_mi) === 1 || d.sozlesme_yapilacak_mi === true
      const alimTuru = (d.alim_turu || d.tur || 'mal').toLowerCase()

      const summary: DosyaSummaryInfo = {
        id: actualDosyaId,
        teminNo: d.temin_no || `2026/DT-${actualDosyaId}`,
        konu: d.konu || 'Doğrudan Temin Alımı',
        harcamaBirimi: d.harcama_birimi || d.birim || 'Fen İşleri Müdürlüğü',
        alimTuru: alimTuru === 'hizmet' ? 'Hizmet Alımı' : alimTuru === 'yapim' ? 'Yapım İşi' : 'Mal Alımı',
        sozlesmeliMi,
        yaklasikMaliyet: Number(d.yaklasik_maliyet) || 0,
        netOdenen: Number(d.net_odenen) || 0,
        durum: d.durum || 'Devam Ediyor',
        evrakSayisi: d.evrak_sayisi || '1',
        tarih: d.temin_tarihi || d.tarih || d.dosya_acilis_tarihi || new Date().toISOString().slice(0, 10),
        butceKodu: d.butce_kodu,
        kazananFirma: kazananFirmaUnvan,
        kazananVkn: kazananFirmaVkn
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
          [actualDosyaId]
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
          `SELECT id, dosya_id, temin_dosya_id, belge_adi, is_signed, imzali_dosya_yolu, dosya_yolu, belge_tarihi, durum, veri_json, created_at 
           FROM DATA_TeminBelge 
           WHERE (temin_dosya_id = ? OR dosya_id = ?) 
           ORDER BY id ASC`,
          [actualDosyaId, actualDosyaId]
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
          [actualDosyaId]
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
          code: 'ihtiyac-listesi',
          title: 'İhtiyaç Listesi & Malzeme İcmal Cetveli',
          iconType: 'file-text' as const,
          description: 'Talep edilen mal/hizmet kalemleri, birimleri ve miktarları'
        },
        {
          code: 'ihtiyac-talep-formu',
          title: 'İhtiyaç Talep Formu & Lüzum Müzekkeresi',
          iconType: 'file-text' as const,
          description: 'Harcama birimi resmi ihtiyaç gerekçesi ve olur yazısı'
        },
        {
          code: 'dogrudan-temin-onay-belgesi',
          title: 'Doğrudan Temin Onay Belgesi',
          iconType: 'shield' as const,
          description: 'Harcama Yetkilisi 4734 md. 22 onay ve yetki belgesi'
        },
        {
          code: 'harcama-talimati',
          title: 'Harcama Talimatı & Süreç Başlatma',
          iconType: 'file-text' as const,
          description: 'Mali harcama ve tahsisat talimatı'
        },
        {
          code: 'piyasa-fiyat-arastirma-gorevlendirmesi',
          title: 'Piyasa Fiyat Araştırma Görevlendirmesi',
          iconType: 'scale' as const,
          description: 'Piyasa araştırması yapacak görevli personelin atama kararı'
        }
      ]

      for (const doc of stage1Docs) {
        const snap = snapshotsMap.get(doc.code) || snapshotsMap.get(doc.code.replace(/-/g, '_'))
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
          code: 'fiyat-arastirma-mektubu',
          title: 'Tedarikçi Teklif İsteme Mektubu',
          iconType: 'file-text' as const,
          description: 'Firmalara dağıtılan resmi teklif davet mektubu'
        },
        {
          code: 'birim-fiyat-teklif-mektubu',
          title: 'Birim Fiyat Teklif Cetveli',
          iconType: 'coins' as const,
          description: 'İsteklilerin doldurarak teslim ettiği fiyat teklif cetveli'
        },
        {
          code: 'piyasa-fiyat-arastirma-tutanagi',
          title: 'Piyasa Fiyat Araştırması Tutanağı',
          iconType: 'scale' as const,
          description: 'Tekliflerin karşılaştırıldığı ve en uygun teklifin tespit edildiği tutanak'
        },
        {
          code: 'yaklasik-maliyet-cetveli',
          title: 'Yaklaşık Maliyet Hesap Cetveli',
          iconType: 'coins' as const,
          description: 'Teklif aritmetik ortalaması veya en düşük fiyata göre hesaplanan maliyet'
        }
      ]

      for (const doc of stage2Docs) {
        const snap = snapshotsMap.get(doc.code) || snapshotsMap.get(doc.code.replace(/-/g, '_'))
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
        id: 'doc-kabul-edilen-teklif',
        code: 'kabul-edilen-teklif',
        title: 'Kabul Edilen Teklif / Teklif Değerlendirme Bildirimi',
        stage: 3,
        stageName: '3. Karar & Sözleşme',
        type: 'template',
        status: snapshotsMap.has('kabul_edilen_teklif') || snapshotsMap.has('kabul-edilen-teklif') ? 'hazir' : 'taslak',
        badge: snapshotsMap.has('kabul_edilen_teklif') || snapshotsMap.has('kabul-edilen-teklif')
          ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
          : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
        iconType: 'scale',
        date: summary.tarih,
        description: 'Teklifin uygun bulunduğunu ve alımın firmadan yapılacağını bildiren resmi yazı'
      })

      if (sozlesmeliMi) {
        items.push({
          id: 'doc-dogrudan-temin-sozlesmesi',
          code: 'dogrudan-temin-sozlesmesi',
          title: 'Doğrudan Temin Sözleşmesi (4734)',
          stage: 3,
          stageName: '3. Karar & Sözleşme',
          type: 'template',
          status: snapshotsMap.has('dogrudan_temin_sozlesmesi') || snapshotsMap.has('dogrudan-temin-sozlesmesi') ? 'hazir' : 'taslak',
          badge: snapshotsMap.has('dogrudan_temin_sozlesmesi') || snapshotsMap.has('dogrudan-temin-sozlesmesi')
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' }
            : { label: 'Sözleşmeli Alım', color: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' },
          iconType: 'signature',
          date: summary.tarih,
          description: 'İdare ile yüklenici arasında imzalanacak resmi sözleşme metni'
        })
        items.push({
          id: 'doc-sozlesmeye-davet',
          code: 'sozlesmeye-davet',
          title: 'Sözleşmeye Davet Mektubu',
          stage: 3,
          stageName: '3. Karar & Sözleşme',
          type: 'template',
          status: snapshotsMap.has('sozlesmeye_davet') || snapshotsMap.has('sozlesmeye-davet') ? 'hazir' : 'taslak',
          badge: { label: 'Sözleşme Daveti', color: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-300', borderColor: 'border-purple-200 dark:border-purple-800' },
          iconType: 'file-text',
          date: summary.tarih,
          description: 'Yüklenici firmaya sözleşme imzalaması için tebliğ edilen davet yazısı'
        })
      } else {
        items.push({
          id: 'doc-siparis-mektubu',
          code: 'fiyat-arastirma-mektubu',
          title: 'Sipariş Yazısı & Mal/Hizmet Teslim Talebi',
          stage: 3,
          stageName: '3. Karar & Sözleşme',
          type: 'template',
          status: snapshotsMap.has('siparis_mektubu') || snapshotsMap.has('siparis-mektubu') ? 'hazir' : 'taslak',
          badge: { label: 'Sözleşmesiz Alım', color: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-700 dark:text-amber-300', borderColor: 'border-amber-200 dark:border-amber-800' },
          iconType: 'truck',
          date: summary.tarih,
          description: 'Sözleşme düzenlenmeyen doğrudan temin alımlarında teslim süresi ve adresini bildiren resmi sipariş yazısı'
        })
      }

      // ── 4. AŞAMA: KABUL, FATURA & ÖDEME ──
      items.push({
        id: 'doc-muayene-kabul-tutanagi',
        code: 'muayene-kabul-tutanagi',
        title: 'Muayene ve Kabul Komisyonu Tutanağı',
        stage: 4,
        stageName: '4. Kabul & Ödeme',
        type: 'template',
        status: snapshotsMap.has('muayene_kabul_tutanagi') || snapshotsMap.has('muayene-kabul-tutanagi') ? 'hazir' : 'taslak',
        badge: snapshotsMap.has('muayene_kabul_tutanagi') || snapshotsMap.has('muayene-kabul-tutanagi')
          ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
          : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
        iconType: 'file-check',
        date: summary.tarih,
        description: 'Mal/hizmetin teknik şartname ve siparişe uygun teslim alındığına dair tutanak'
      })

      if (alimTuru === 'mal') {
        items.push({
          id: 'doc-teslim-tesellum-tutanagi',
          code: 'luzum-muzekkeresi-teslim-tesellum',
          title: 'Taşınır Teslim Tesellüm Belgesi (Ambar)',
          stage: 4,
          stageName: '4. Kabul & Ödeme',
          type: 'template',
          status: snapshotsMap.has('luzum_muzekkeresi_teslim_tesellum') || snapshotsMap.has('luzum-muzekkeresi-teslim-tesellum') ? 'hazir' : 'taslak',
          badge: { label: 'Mal Alımı Zorunlu', color: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800' },
          iconType: 'truck',
          date: summary.tarih,
          description: 'Taşınır Kayıt Yetkilisi / Ambar teslim tesellüm belgesi'
        })
      }

      items.push(
        {
          id: 'doc-odeme-yazisi',
          code: 'odeme-yazisi',
          title: 'Ödeme Emri Belgesi & Tahakkuk Müzekkeresi',
          stage: 4,
          stageName: '4. Kabul & Ödeme',
          type: 'template',
          status: snapshotsMap.has('odeme_yazisi') || snapshotsMap.has('odeme-yazisi') ? 'hazir' : 'taslak',
          badge: snapshotsMap.has('odeme_yazisi') || snapshotsMap.has('odeme-yazisi')
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
            : { label: 'Otomatik Taslak', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
          iconType: 'receipt',
          date: summary.tarih,
          description: 'Harcama Yetkilisi ve Gerçekleştirme Görevlisi onaylı MİF ödeme ve tahakkuk belgesi'
        },
        {
          id: 'doc-harcama-pusulasi',
          code: 'harcama-pusulasi',
          title: 'Harcama Pusulası & Gider Makbuzu',
          stage: 4,
          stageName: '4. Kabul & Ödeme',
          type: 'template',
          status: snapshotsMap.has('harcama_pusulasi') || snapshotsMap.has('harcama-pusulasi') ? 'hazir' : 'taslak',
          badge: snapshotsMap.has('harcama_pusulasi') || snapshotsMap.has('harcama-pusulasi')
            ? { label: 'Hazır (Kayıtlı)', color: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', borderColor: 'border-emerald-200 dark:border-emerald-800' }
            : { label: 'Gider Makbuzu', color: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-600 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700' },
          iconType: 'receipt',
          date: summary.tarih,
          description: 'Vergi Usul Kanunu ve 5018 sayılı kanun kapsamında düzenlenen harcama pusulası'
        }
      )

      // ── 5. AŞAMA: İMZALI VE YÜKLENEN GERÇEK BELGELERİ EŞLEŞTİRME & DİĞERLERİ ──
      // İmzalı belgelerin süreç şablonlarıyla akıllı eşleştirilmesi
      const matchedSignedMap = new Map<string, any>()
      const unmatchedSignedDocs: any[] = []

      for (const signed of signedDocsList) {
        let targetCode = ''
        if (signed.veri_json) {
          try {
            const parsed = typeof signed.veri_json === 'string' ? JSON.parse(signed.veri_json) : signed.veri_json
            if (parsed?.targetTemplateCode) {
              targetCode = parsed.targetTemplateCode
            }
          } catch {
            // ignore
          }
        }
        if (!targetCode) {
          const bName = (signed.belge_adi || '').toLowerCase()
          if (bName.includes('ihtiyaç') || bName.includes('ihtiyac') || bName.includes('lüzum') || bName.includes('talep')) targetCode = 'ihtiyac-listesi'
          else if (bName.includes('onay')) targetCode = 'dogrudan-temin-onay-belgesi'
          else if (bName.includes('harcama') && bName.includes('talimat')) targetCode = 'harcama-talimati'
          else if (bName.includes('görev') || bName.includes('gorev') || bName.includes('atama')) targetCode = 'piyasa-fiyat-arastirma-gorevlendirmesi'
          else if (bName.includes('isteme') || (bName.includes('fiyat') && bName.includes('mektup'))) targetCode = 'fiyat-arastirma-mektubu'
          else if (bName.includes('birim') && bName.includes('fiyat')) targetCode = 'birim-fiyat-teklif-mektubu'
          else if (bName.includes('piyasa') || bName.includes('tutanak') || bName.includes('arastirma')) targetCode = 'piyasa-fiyat-arastirma-tutanagi'
          else if (bName.includes('maliyet')) targetCode = 'yaklasik-maliyet-cetveli'
          else if (bName.includes('kabul') && bName.includes('teklif')) targetCode = 'kabul-edilen-teklif'
          else if (bName.includes('karar') || bName.includes('sonuç') || bName.includes('sonuc')) targetCode = 'dogrudan-temin-onay-belgesi'
          else if (bName.includes('sözleşme') || bName.includes('sozlesme')) targetCode = 'dogrudan-temin-sozlesmesi'
          else if (bName.includes('sipariş') || bName.includes('siparis')) targetCode = 'fiyat-arastirma-mektubu'
          else if (bName.includes('muayene') || bName.includes('kabul')) targetCode = 'muayene-kabul-tutanagi'
          else if (bName.includes('teslim') || bName.includes('tesellüm') || bName.includes('tesellum')) targetCode = 'luzum-muzekkeresi-teslim-tesellum'
          else if (bName.includes('ödeme') || bName.includes('odeme') || bName.includes('mif') || bName.includes('tahakkuk')) targetCode = 'odeme-yazisi'
          else if (bName.includes('pusula') || bName.includes('makbuz')) targetCode = 'harcama-pusulasi'
        }

        if (targetCode) {
          const normKey = targetCode.toLowerCase().replace(/_/g, '-')
          matchedSignedMap.set(targetCode, signed)
          matchedSignedMap.set(normKey, signed)
          matchedSignedMap.set(normKey.replace(/-/g, '_'), signed)
        } else {
          unmatchedSignedDocs.push(signed)
        }
      }

      // Süreç şablonlarına eşleşen imzalı belgeleri ata
      items.forEach((item) => {
        const itemCodeNorm = item.code.toLowerCase().replace(/_/g, '-')
        const itemCodeUnderscore = item.code.toLowerCase().replace(/-/g, '_')
        const matched = matchedSignedMap.get(item.code) || matchedSignedMap.get(itemCodeNorm) || matchedSignedMap.get(itemCodeUnderscore)

        if (item.type === 'template' && matched) {
          const filePath = matched.imzali_dosya_yolu || matched.dosya_yolu || ''
          let sayfaAraligi: string | undefined = undefined
          if (matched.veri_json) {
            try {
              const p = typeof matched.veri_json === 'string' ? JSON.parse(matched.veri_json) : matched.veri_json
              sayfaAraligi = p?.sayfaAraligi || undefined
            } catch {
              // ignore
            }
          }
          item.matchedSignedDoc = {
            id: matched.id,
            filePath,
            fileName: filePath.split(/[/\\]/).pop() || matched.belge_adi,
            date: matched.belge_tarihi || (matched.created_at ? String(matched.created_at).slice(0, 10) : undefined),
            sayfaAraligi
          }
          item.status = 'imzali'
          item.badge = {
            label: sayfaAraligi ? `İmzalı (${sayfaAraligi})` : 'İmzalı Nüsha Var',
            color: 'bg-emerald-50 dark:bg-emerald-950/40',
            textColor: 'text-emerald-700 dark:text-emerald-300',
            borderColor: 'border-emerald-200 dark:border-emerald-800'
          }
        }
      })

      // Herhangi bir şablonla eşleşmeyen bağımsız imzalı ve taranmış belgeler
      for (const signed of unmatchedSignedDocs) {
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
          // Eğer kullanıcı 'signed' varyantını seçtiyse ve bu şablonun imzalı nüshası varsa, imzalı PDF dosyasını yükle
          if (activeViewVariant === 'signed' && selectedEvrak.matchedSignedDoc?.filePath) {
            if (window.electron?.ipcRenderer) {
              const res = await window.electron.ipcRenderer.invoke(
                'workspace:read-attachment-base64',
                selectedEvrak.matchedSignedDoc.filePath
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
                return
              }
            }
          }

          const storeSettings = useSettingsStore.getState()
          // DocumentEngine üzerinden canlı şablon verisini yükle
          const dataResult = await loadDocumentPreviewData({
            activeDosyaId: activeDosyaId || 0,
            resolvedId: selectedEvrak.code,
            selectedDocId: selectedEvrak.code,
            showLogoLeft: storeSettings.showLogoLeft,
            showLogoRight: storeSettings.showLogoRight,
            logoLeft: storeSettings.logoLeft,
            logoRight: storeSettings.logoRight,
            institutionLogo: storeSettings.institutionLogo
          })

          const pList = dataResult.personelListesi || []
          const fList = dataResult.firmaListesi || []
          const bList = dataResult.birimListesi || []

          if (isMounted) {
            setPersonelListesi(pList)
            setFirmaListesi(fList)
            setBirimListesi(bList)
          }

          // DocumentPreviewModalV3 ile 100% uyumlu Rota ve Antet zenginleştirmesi
          const targetKey = selectedEvrak.code
          const { enrichedData } = resolveTemplateRouteForDocument(targetKey, dataResult.finalData, activeDosyaId)
          const defaultRotaConf = getRotaConfigForTemplate(targetKey, activeDosyaId)
          if (defaultRotaConf && enrichedData.olurYazisi === undefined && defaultRotaConf.olurYazisi !== undefined) {
            enrichedData.olurYazisi = defaultRotaConf.olurYazisi
          }

          const activeSolLogo =
            enrichedData.solLogo ||
            storeSettings.logoLeft ||
            storeSettings.institutionLogo ||
            null
          const activeSagLogo =
            enrichedData.sagLogo || storeSettings.logoRight || null

          const mergedData = {
            ...enrichedData,
            personelListesi: pList,
            firmaListesi: fList,
            birimListesi: bList,
            tarih: formatDateString(enrichedData.tarih) || formatDateString(enrichedData.onayaSunulanTarih) || toTrDate(new Date()),
            onayaSunulanTarih: formatDateString(enrichedData.onayaSunulanTarih) || formatDateString(enrichedData.tarih) || toTrDate(new Date()),
            onayTarihi: formatDateString(enrichedData.onayTarihi) || formatDateString(enrichedData.olurTarihi) || formatDateString(enrichedData.dosyaTarihi) || toTrDate(new Date()),
            dosyaTarihi: formatDateString(enrichedData.dosyaTarihi) || '',
            solLogo: storeSettings.showLogoLeft ? activeSolLogo : null,
            sagLogo: storeSettings.showLogoRight ? activeSagLogo : null,
            olurYazisi: enrichedData.olurYazisi !== false,
            orientation: dataResult.activeOrientation || enrichedData.orientation || 'portrait'
          }

          if (isMounted) {
            setActiveTemplateData(mergedData)
          }

          // DocumentPreviewModalV3 A4 derleyicisi ile tam stilli ve hatasız gerçek PDF üret
          if (window.electron?.ipcRenderer) {
            try {
              const { config: activeTemplateConf } = resolveTemplateConfig(selectedEvrak.code)
              const html = compileDocumentHtml({
                activeTemplateConf,
                formData: mergedData,
                personelListesi: pList,
                firmaListesi: fList,
                localShowLogoLeft: storeSettings.showLogoLeft,
                localShowLogoRight: storeSettings.showLogoRight,
                logoLeft: storeSettings.logoLeft,
                logoRight: storeSettings.logoRight,
                institutionLogo: storeSettings.institutionLogo,
                orientation: mergedData.orientation || 'portrait'
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
  }, [selectedEvrak?.id, activeDosyaId, refreshTrigger, activeViewVariant])

  // Şablon Seçenekleri (Eşleştirme Modalı İçin)
  const targetTemplateOptions = useMemo(() => {
    return evraklar
      .filter((e) => e.type === 'template')
      .map((e) => ({
        code: e.code,
        title: e.title,
        stageName: e.stageName
      }))
  }, [evraklar])

  // 4. Şablon İçin Canlı PDF Üretme
  const generatePdfPreviewForTemplate = useCallback(async () => {
    if (!selectedEvrak || selectedEvrak.type !== 'template' || !activeTemplateData || !window.electron?.ipcRenderer) {
      return
    }

    try {
      setPdfGenerating(true)
      const storeSettings = useSettingsStore.getState()
      const { config: activeTemplateConf } = resolveTemplateConfig(selectedEvrak.code)
      const html = compileDocumentHtml({
        activeTemplateConf,
        formData: activeTemplateData,
        personelListesi,
        firmaListesi,
        localShowLogoLeft: storeSettings.showLogoLeft,
        localShowLogoRight: storeSettings.showLogoRight,
        logoLeft: storeSettings.logoLeft,
        logoRight: storeSettings.logoRight,
        institutionLogo: storeSettings.institutionLogo,
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
  }, [selectedEvrak, activeTemplateData, personelListesi, firmaListesi, activePdfBlobUrl])

  // 5. Yeni İmzalı Belge / PDF Seç ve Eşleştirme Modalını Aç
  const handleUploadSignedPdf = useCallback(async (targetCode?: string) => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) return

    try {
      setSpecificTargetCode(targetCode)
      const openRes = await window.electron.ipcRenderer.invoke('dialog:showOpenDialog', {
        title: targetCode ? 'İmzalı Belge PDF Dosyasını Seçin' : 'İmzalı Belge / Ek PDF Dosyaları Seç',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'PDF ve Dokümanlar', extensions: ['pdf', 'png', 'jpg', 'jpeg'] }]
      })

      if (!openRes?.success || !openRes.filePaths || openRes.filePaths.length === 0) {
        return
      }

      setSelectedUploadFiles(openRes.filePaths)
      setIsUploadModalOpen(true)
    } catch (e) {
      console.error('[DosyaEvrakAkisi] İmzalı belge seçim hatası:', e)
    }
  }, [activeDosyaId])

  // 5.1 Çoklu Seçilen Belgeleri Yükle ve Belgeyle Eşleştirerek Kaydet
  const handleSaveBatchUpload = useCallback(async (batchItems: any[]) => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) return

    try {
      for (const item of batchItems) {
        const uploadRes = await window.electron.ipcRenderer.invoke('workspace:upload-file', item.filePath)
        if (uploadRes?.success) {
          const relativePath = uploadRes.relativePath || uploadRes.data?.relativePath || item.filePath
          const baseName = item.fileName?.replace(/\.[^/.]+$/, '') || 'İmzalı Evrak'
          const currentDate = new Date().toISOString().slice(0, 10)
          const veriJson = JSON.stringify({
            targetTemplateCode: item.targetTemplateCode,
            sayfaAraligi: item.sayfaAraligi || '',
            order: item.order
          })

          await window.electron.ipcRenderer.invoke(
            'db:run',
            `INSERT INTO DATA_TeminBelge (temin_dosya_id, dosya_id, belge_adi, is_signed, imzali_dosya_yolu, belge_tarihi, veri_json)
             VALUES (?, ?, ?, 1, ?, ?, ?)`,
            [activeDosyaId, activeDosyaId, `${baseName} (İmzalı)`, relativePath, currentDate, veriJson]
          )
        }
      }
      await fetchDosyaEvraklari()
    } catch (err) {
      console.error('[DosyaEvrakAkisi] Toplu yükleme hatası:', err)
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
        const storeSettings = useSettingsStore.getState()
        const { config: activeTemplateConf } = resolveTemplateConfig(selectedEvrak.code)
        const html = compileDocumentHtml({
          activeTemplateConf,
          formData: activeTemplateData,
          personelListesi,
          firmaListesi,
          localShowLogoLeft: storeSettings.showLogoLeft,
          localShowLogoRight: storeSettings.showLogoRight,
          logoLeft: storeSettings.logoLeft,
          logoRight: storeSettings.logoRight,
          institutionLogo: storeSettings.institutionLogo,
          orientation: activeTemplateData.orientation || 'portrait'
        })
        await window.electron.ipcRenderer.invoke('belge:open-pdf-external', { html })
      }
    } catch (e) {
      console.error('[DosyaEvrakAkisi] Harici açma hatası:', e)
    }
  }, [selectedEvrak, activeTemplateData, personelListesi, firmaListesi])

  // 8. Yazdır Diyaloğunu Aç (Excel Style Print Modal)
  const handlePrint = useCallback(() => {
    setIsPrintModalOpen(true)
  }, [])

  // 8.1 Belirlenen Ayarlarla Yazdır
  const handlePrintWithSettings = useCallback(
    async (settings: PrintSettings) => {
      if (!window.electron?.ipcRenderer) return
      try {
        setIsPrinting(true)
        if (selectedEvrak?.type === 'template' && activeTemplateData) {
          const storeSettings = useSettingsStore.getState()
          const { config: activeTemplateConf } = resolveTemplateConfig(selectedEvrak.code)
          const orientation = settings.orientation || activeTemplateData.orientation || 'portrait'
          const html = compileDocumentHtml({
            activeTemplateConf,
            formData: activeTemplateData,
            personelListesi,
            firmaListesi,
            localShowLogoLeft: storeSettings.showLogoLeft,
            localShowLogoRight: storeSettings.showLogoRight,
            logoLeft: storeSettings.logoLeft,
            logoRight: storeSettings.logoRight,
            institutionLogo: storeSettings.institutionLogo,
            orientation
          })

          const count = Math.max(1, settings.copies || 1)
          for (let i = 0; i < count; i++) {
            await window.electron.ipcRenderer.invoke('belge:print-html', {
              html,
              deviceName: settings.printerName,
              silent: settings.silent,
              color: settings.color,
              orientation
            })
          }
        } else if (selectedEvrak?.filePath) {
          await window.electron.ipcRenderer.invoke('workspace:open-file', selectedEvrak.filePath)
        }
        setIsPrintModalOpen(false)
      } catch (e) {
        console.error('[DosyaEvrakAkisi] Yazdırma hatası:', e)
      } finally {
        setIsPrinting(false)
      }
    },
    [selectedEvrak, activeTemplateData, personelListesi, firmaListesi]
  )

  // 9. PDF Olarak Kaydet / Dışa Aktar
  const handleExportPdf = useCallback(async () => {
    if (!selectedEvrak || !window.electron?.ipcRenderer) return
    try {
      if (selectedEvrak.type === 'template' && activeTemplateData) {
        const storeSettings = useSettingsStore.getState()
        const { config: activeTemplateConf } = resolveTemplateConfig(selectedEvrak.code)
        const html = compileDocumentHtml({
          activeTemplateConf,
          formData: activeTemplateData,
          personelListesi,
          firmaListesi,
          localShowLogoLeft: storeSettings.showLogoLeft,
          localShowLogoRight: storeSettings.showLogoRight,
          logoLeft: storeSettings.logoLeft,
          logoRight: storeSettings.logoRight,
          institutionLogo: storeSettings.institutionLogo,
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
  }, [selectedEvrak, activeTemplateData, personelListesi, firmaListesi, dosyaInfo])

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
    personelListesi,
    firmaListesi,
    birimListesi,
    activePdfBlobUrl,
    isModalOpen,
    setIsModalOpen,
    isPrintModalOpen,
    setIsPrintModalOpen,
    isPrinting,
    handlePrintWithSettings,
    refreshSelectedDocument: () => setRefreshTrigger((t) => t + 1),
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
    copyCount,
    setCopyCount,
    activeViewVariant,
    setActiveViewVariant,
    isUploadModalOpen,
    setIsUploadModalOpen,
    selectedUploadFiles,
    specificTargetCode,
    targetTemplateOptions,
    handleSaveBatchUpload,
    refreshAll: fetchDosyaEvraklari
  }
}
