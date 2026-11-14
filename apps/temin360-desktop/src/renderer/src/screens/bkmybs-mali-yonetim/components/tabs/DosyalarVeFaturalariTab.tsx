import React, { useState, useEffect, useMemo } from 'react'
import {
  FolderOpen,
  Receipt,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Coins,
  Building2,
  Calendar,
  X,
  Save,
  Banknote,
  ExternalLink,
  Calculator,
  Printer,
  ShieldCheck,
  Percent,
  Layers,
  ArrowRight
} from 'lucide-react'
import { KamuRole } from '../../types'
import { formatCurrency, formatDate } from '@renderer/utils/formatters'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'

// ─── Tipler ────────────────────────────────────────────────────────────────

export interface FaturaKayit {
  id: string | number
  faturaNo: string
  faturaTarihi: string
  firmaTutar: number // KDV dahil brüt fatura tutarı
  kdvOrani: number // %20, %10, %1, %0
  kdvTutari?: number
  matrah?: number // KDV hariç
  tevkifatOrani?: string // 'Yok', '2/10', '3/10', '4/10', '5/10', '7/10', '9/10', 'Tam'
  tevkifatTutari?: number
  damgaVergisi?: number // Binde 9,48
  kararPulu?: number // Binde 5,69
  netOdenecek?: number
  odemeYontemi?: string | null
  durum: 'beklemede' | 'odendi' | 'iptal'
  aciklama?: string
  kaynak?: 'sablon' | 'kabul_tutanagi' | 'mali_giris' | 'tahakkuk'
}

export interface DosyaOzet {
  id: number
  teminNo: string
  konu: string
  tur: string
  yaklasikMaliyet: number
  netOdenen: number
  butceKodu: string
  ekonomikKod: string
  kazananFirmaUnvani: string
  kazananFirmaVkn: string
  kazananFirmaIban: string
  olusturmaTarihi: string
  harcamaBirimi: string
  durumAsamaId: number
  status: string | null
  kesintiDamga: number
  kesintiKararPulu: number
  kesintiKdvTevkifat: number
  faturalar: FaturaKayit[]
}

interface DosyalarVeFaturalariTabProps {
  activeRole: KamuRole
}

// ─── Yardımcı Hesaplama Fonksiyonları ─────────────────────────────────────

export function calculateInvoiceFinancials(
  brutTutar: number,
  kdvOrani: number,
  tevkifatOrani: string = 'Yok',
  kararPuluUygula: boolean = true
) {
  const kdvMultiplier = (100 + kdvOrani) / 100
  const matrah = brutTutar > 0 ? Number((brutTutar / kdvMultiplier).toFixed(2)) : 0
  const kdvTutari = Number((brutTutar - matrah).toFixed(2))

  // Tevkifat Hesaplama
  let tevkifatKatsayisi = 0
  if (tevkifatOrani === '2/10') tevkifatKatsayisi = 0.2
  else if (tevkifatOrani === '3/10') tevkifatKatsayisi = 0.3
  else if (tevkifatOrani === '4/10') tevkifatKatsayisi = 0.4
  else if (tevkifatOrani === '5/10') tevkifatKatsayisi = 0.5
  else if (tevkifatOrani === '7/10') tevkifatKatsayisi = 0.7
  else if (tevkifatOrani === '9/10') tevkifatKatsayisi = 0.9
  else if (tevkifatOrani === 'Tam') tevkifatKatsayisi = 1.0

  const tevkifatTutari = Number((kdvTutari * tevkifatKatsayisi).toFixed(2))
  // Damga Vergisi (488 S.K. binde 9,48 - matrah üzerinden)
  const damgaVergisi = Number((matrah * 0.00948).toFixed(2))
  // Karar Pulu (binde 5,69 - matrah üzerinden)
  const kararPulu = kararPuluUygula ? Number((matrah * 0.00569).toFixed(2)) : 0

  const toplamKesinti = damgaVergisi + kararPulu + tevkifatTutari
  const netOdenecek = Number((brutTutar - toplamKesinti).toFixed(2))

  return {
    matrah,
    kdvTutari,
    tevkifatTutari,
    damgaVergisi,
    kararPulu,
    toplamKesinti,
    netOdenecek
  }
}

// ─── Durum Badge Bileşenleri ───────────────────────────────────────────────

function FaturaDurumBadge({ durum }: { durum: FaturaKayit['durum'] }) {
  if (durum === 'odendi') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
        <CheckCircle size={10} className="text-emerald-500" /> Ödendi
      </span>
    )
  }
  if (durum === 'iptal') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
        <AlertCircle size={10} className="text-rose-500" /> İptal
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
      <Clock size={10} className="text-amber-500" /> Ödeme Bekliyor
    </span>
  )
}

function AlimTuruBadge({ turu }: { turu: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    mal: {
      label: 'Mal Alımı',
      cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40'
    },
    hizmet: {
      label: 'Hizmet Alımı',
      cls: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40'
    },
    danismanlik: {
      label: 'Danışmanlık',
      cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40'
    },
    yapim: {
      label: 'Yapım İşi',
      cls: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40'
    },
    yapim_isi: {
      label: 'Yapım İşi',
      cls: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40'
    }
  }
  const info = map[turu?.toLowerCase()] ?? {
    label: turu || 'Doğrudan Temin',
    cls: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${info.cls}`}>
      {info.label}
    </span>
  )
}

// ─── Veritabanı Yükleme ve Çözümleme Fonksiyonu ─────────────────────────────

async function loadDosyalarVeFaturalar(): Promise<DosyaOzet[]> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return []

  try {
    // 1. DATA_TeminDosyasi sorgusu (ŞEMA İLE %100 UYUMLU KOLONLAR)
    const dosyaRes = await window.electron.ipcRenderer.invoke(
      'db:query',
      `SELECT
         d.id,
         d.temin_no,
         d.konu,
         d.tur,
         d.yaklasik_maliyet,
         d.net_odenen,
         d.kdv,
         d.kesinti_damga,
         d.kesinti_karar_pulu,
         d.kesinti_kdv_tevkifat,
         d.butce_kodu,
         d.ekonomik_kod,
         d.harcama_birimi,
         d.durum_asama_id,
         d.status,
         d.created_at,
         d.temin_tarihi,
         d.dosya_acilis_tarihi,
         d.sablon_tercihleri,
         f.unvan   AS tanim_unvan,
         f.vergi_no AS tanim_vkn,
         f.hesap_no AS tanim_iban,
         tf.unvan  AS dosya_firma_unvan,
         tf.vergi_no AS dosya_firma_vkn,
         b.ad      AS birim_adi
       FROM DATA_TeminDosyasi d
       LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
       LEFT JOIN DATA_TeminFirma tf ON tf.temin_dosya_id = d.id AND (tf.kazanan_mi = 1 OR tf.kazandi_mi = 1)
       LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
       WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
       ORDER BY d.id DESC
       LIMIT 300`
    )

    const rawRows = dosyaRes?.success ? dosyaRes.data : Array.isArray(dosyaRes) ? dosyaRes : []
    if (!Array.isArray(rawRows) || rawRows.length === 0) return []

    // 2. DATA_TeminBelgeSnapshot tablosundan kabul & fatura şablonlarını re'sen oku
    const snapshotsByDosya = new Map<number, any[]>()
    try {
      const snapRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT dosya_id, sablon_kodu, veri_json 
         FROM DATA_TeminBelgeSnapshot 
         WHERE (is_deleted = 0 OR is_deleted IS NULL) 
           AND (
             sablon_kodu LIKE '%kabul%' OR 
             sablon_kodu LIKE '%fatura%' OR 
             sablon_kodu LIKE '%hakedis%' OR 
             sablon_kodu LIKE '%odeme%'
           )`
      )
      if (snapRes?.success && Array.isArray(snapRes.data)) {
        for (const row of snapRes.data) {
          const dId = Number(row.dosya_id)
          if (!dId) continue
          const list = snapshotsByDosya.get(dId) || []
          list.push(row)
          snapshotsByDosya.set(dId, list)
        }
      }
    } catch (e) {
      console.warn('[DosyalarVeFaturalariTab] Snapshot verileri okunamadı:', e)
    }

    return rawRows.map((d: any) => {
      let preferences: any = {}
      if (d.sablon_tercihleri) {
        try {
          preferences =
            typeof d.sablon_tercihleri === 'string'
              ? JSON.parse(d.sablon_tercihleri)
              : d.sablon_tercihleri || {}
        } catch {
          preferences = {}
        }
      }

      const faturalar: FaturaKayit[] = []
      const faturaNoSet = new Set<string>()

      const pushFatura = (f: FaturaKayit) => {
        const key = (f.faturaNo || '').trim().toLowerCase()
        if (key && !faturaNoSet.has(key)) {
          faturaNoSet.add(key)
          // Finansal tutarları hesapla
          const kdvDegeri = Number.isFinite(Number(f.kdvOrani)) ? Number(f.kdvOrani) : 20
          const fin = calculateInvoiceFinancials(
            f.firmaTutar,
            kdvDegeri,
            f.tevkifatOrani || 'Yok',
            true
          )
          faturalar.push({
            ...f,
            kdvOrani: kdvDegeri,
            matrah: f.matrah !== undefined ? f.matrah : fin.matrah,
            kdvTutari: f.kdvTutari !== undefined ? f.kdvTutari : fin.kdvTutari,
            tevkifatTutari: f.tevkifatTutari !== undefined ? f.tevkifatTutari : fin.tevkifatTutari,
            damgaVergisi: f.damgaVergisi !== undefined ? f.damgaVergisi : fin.damgaVergisi,
            kararPulu: f.kararPulu !== undefined ? f.kararPulu : fin.kararPulu,
            netOdenecek: f.netOdenecek !== undefined ? f.netOdenecek : fin.netOdenecek
          })
        }
      }

      // 1. sablon_tercihleri.faturalar (Mali Hizmetler faturası)
      if (Array.isArray(preferences.faturalar) && preferences.faturalar.length > 0) {
        preferences.faturalar.forEach((f: any, idx: number) => {
          pushFatura({
            id: f.id || `fat-pref-${d.id}-${idx}`,
            faturaNo: f.faturaNo || f.fatura_no || `FAT-${d.id}-${idx + 1}`,
            faturaTarihi: f.faturaTarihi || f.fatura_tarihi || d.temin_tarihi || d.created_at,
            firmaTutar: Number(f.firmaTutar || f.tutar || f.fatura_tutari || d.yaklasik_maliyet || 0),
            kdvOrani: Number(f.kdvOrani ?? 20),
            tevkifatOrani: f.tevkifatOrani || 'Yok',
            odemeYontemi: f.odemeYontemi || 'Hazine / Muhasebat Ödeme Emri',
            durum: f.durum === 'odendi' || f.durum === 'iptal' ? f.durum : 'beklemede',
            aciklama: f.aciklama || 'Mali Hizmetler Fatura Kaydı',
            kaynak: 'mali_giris'
          })
        })
      }

      // 2. sablon_tercihleri.kabulTutanaklari (Doğrudan Temin Kabul ve Ödeme sekmesi)
      if (Array.isArray(preferences.kabulTutanaklari) && preferences.kabulTutanaklari.length > 0) {
        preferences.kabulTutanaklari.forEach((t: any, idx: number) => {
          const fatNo = (t.faturaNo || t.tutanakNo || '').trim()
          if (fatNo) {
            pushFatura({
              id: t.id || `tut-fat-${d.id}-${idx}`,
              faturaNo: fatNo,
              faturaTarihi: t.faturaTarihi || t.tutanakTarihi || d.temin_tarihi || d.created_at,
              firmaTutar: Number(t.tutar || d.net_odenen || d.yaklasik_maliyet || 0),
              kdvOrani: 20,
              tevkifatOrani: 'Yok',
              odemeYontemi: 'Hazine / Muhasebat Ödeme Emri',
              durum: t.durum === 'kabul' ? 'odendi' : t.durum === 'red' ? 'iptal' : 'beklemede',
              aciklama: t.notlar || 'Doğrudan Temin Muayene ve Kabul Tutanağı Faturası',
              kaynak: 'kabul_tutanagi'
            })
          }
        })
      }

      // 3. Snapshot'lardan (muayene-kabul-tutanagi, fatura-ve-odeme-belgesi) gelen faturalar
      const snaps = snapshotsByDosya.get(Number(d.id))
      if (snaps && snaps.length > 0) {
        snaps.forEach((s: any, idx: number) => {
          if (s.veri_json) {
            try {
              const p = JSON.parse(s.veri_json)
              const fatNo = (p.faturaNo || p.fatura_no || p.evrakSayisi || '').trim()
              const tutar = Number(p.genelToplam || p.kdvDahilToplam || p.tutar || p.toplamTutar || 0)
              if (fatNo && tutar > 0) {
                pushFatura({
                  id: `snap-fat-${d.id}-${idx}`,
                  faturaNo: fatNo,
                  faturaTarihi: p.faturaTarihi || p.tutanakTarihi || p.dosyaTarihi || d.temin_tarihi || d.created_at,
                  firmaTutar: tutar,
                  kdvOrani: Number(p.kdvOrani ?? 20),
                  tevkifatOrani: p.tevkifatOrani || 'Yok',
                  odemeYontemi: 'Hazine / Muhasebat Ödeme Emri',
                  durum: Number(d.durum_asama_id) >= 4 ? 'odendi' : 'beklemede',
                  aciklama: `${s.sablon_kodu} resmî şablonundan derlenen fatura kaydı.`,
                  kaynak: 'sablon'
                })
              }
            } catch {}
          }
        })
      }

      // 4. Tekil fatura fallback
      if (preferences.faturaNo && faturalar.length === 0) {
        pushFatura({
          id: `single-fat-${d.id}`,
          faturaNo: preferences.faturaNo,
          faturaTarihi: preferences.faturaTarihi || d.temin_tarihi || d.created_at,
          firmaTutar: Number(d.net_odenen || d.yaklasik_maliyet || 0),
          kdvOrani: 20,
          tevkifatOrani: 'Yok',
          odemeYontemi: 'Hazine / Muhasebat Ödeme Emri',
          durum: Number(d.durum_asama_id) >= 4 ? 'odendi' : 'beklemede',
          aciklama: 'Doğrudan Temin Fatura Kaydı',
          kaynak: 'tahakkuk'
        })
      }

      const kazananUnvan = d.tanim_unvan || d.dosya_firma_unvan || 'Yüklenici Belirlenmedi'
      const kazananVkn = d.tanim_vkn || d.dosya_firma_vkn || '-'
      const kazananIban = d.tanim_iban || 'TR00 0000 0000 0000 0000 0000 00'

      return {
        id: Number(d.id),
        teminNo: d.temin_no || `DT-${d.id}`,
        konu: d.konu || 'Doğrudan Temin Dosyası',
        tur: d.tur || 'mal',
        yaklasikMaliyet: Number(d.yaklasik_maliyet || 0),
        netOdenen: Number(d.net_odenen || 0),
        butceKodu: d.butce_kodu || '03.2.1.01',
        ekonomikKod: d.ekonomik_kod || '03.2.1.01',
        kazananFirmaUnvani: kazananUnvan,
        kazananFirmaVkn: kazananVkn,
        kazananFirmaIban: kazananIban,
        olusturmaTarihi: d.temin_tarihi || d.dosya_acilis_tarihi || d.created_at || new Date().toISOString(),
        harcamaBirimi: d.birim_adi || d.harcama_birimi || 'Destek Hizmetleri',
        durumAsamaId: Number(d.durum_asama_id || 1),
        status: d.status,
        kesintiDamga: Number(d.kesinti_damga || 0),
        kesintiKararPulu: Number(d.kesinti_karar_pulu || 0),
        kesintiKdvTevkifat: Number(d.kesinti_kdv_tevkifat || 0),
        faturalar
      }
    })
  } catch (err) {
    console.warn('[DosyalarVeFaturalariTab] Veri yüklenemedi:', err)
    return []
  }
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────

export const DosyalarVeFaturalariTab: React.FC<DosyalarVeFaturalariTabProps> = ({
  activeRole: _activeRole
}) => {
  const { setActiveDosyaId } = useWorkspaceStore()
  const [dosyalar, setDosyalar] = useState<DosyaOzet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [alimFilter, setAlimFilter] = useState('all')
  const [faturaFilter, setFaturaFilter] = useState<'all' | 'with-invoice' | 'without-invoice' | 'paid' | 'pending'>('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Fatura Ekleme/Düzenleme Modalı State
  const [modalOpen, setModalOpen] = useState(false)
  const [seciliDosya, setSeciliDosya] = useState<DosyaOzet | null>(null)
  const [duzenlenenFatura, setDuzenlenenFatura] = useState<FaturaKayit | null>(null)
  const [formFaturaNo, setFormFaturaNo] = useState('')
  const [formFaturaTarihi, setFormFaturaTarihi] = useState('')
  const [formFaturaTutar, setFormFaturaTutar] = useState<number>(0)
  const [formKdvOrani, setFormKdvOrani] = useState<number>(20)
  const [formTevkifatOrani, setFormTevkifatOrani] = useState<string>('Yok')
  const [formOdemeYontemi, setFormOdemeYontemi] = useState('Hazine / Muhasebat Ödeme Emri')
  const [formDurum, setFormDurum] = useState<'beklemede' | 'odendi' | 'iptal'>('beklemede')
  const [formAciklama, setFormAciklama] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const reloadData = () => {
    setLoading(true)
    loadDosyalarVeFaturalar()
      .then((data) => {
        setDosyalar(data)
        setLoading(false)
        // İlk 3 dosyayı varsayılan olarak açık tut
        if (data.length > 0) {
          setExpanded(new Set(data.slice(0, 3).map((d) => d.id)))
        }
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    reloadData()

    const handleRefresh = () => reloadData()
    window.addEventListener('app:db-changed', handleRefresh)
    window.addEventListener('focus', handleRefresh)
    return () => {
      window.removeEventListener('app:db-changed', handleRefresh)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpanded(new Set(dosyalar.map((d) => d.id)))
  }

  const collapseAll = () => {
    setExpanded(new Set())
  }

  // Fatura Ekle Modal Aç
  const handleOpenAddInvoice = (dosya: DosyaOzet) => {
    setSeciliDosya(dosya)
    setDuzenlenenFatura(null)
    setFormFaturaNo(`FAT-${dosya.teminNo?.replace(/[^a-zA-Z0-9]/g, '') || dosya.id}-${(dosya.faturalar.length + 1).toString().padStart(2, '0')}`)
    setFormFaturaTarihi(new Date().toISOString().slice(0, 10))
    setFormFaturaTutar(dosya.netOdenen || dosya.yaklasikMaliyet || 0)
    setFormKdvOrani(20)
    setFormTevkifatOrani('Yok')
    setFormOdemeYontemi('Hazine / Muhasebat Ödeme Emri')
    setFormDurum('beklemede')
    setFormAciklama(`${dosya.konu} alımı hak ediş ve fatura kaydı.`)
    setModalOpen(true)
  }

  // Fatura Düzenle Modal Aç
  const handleOpenEditInvoice = (dosya: DosyaOzet, fatura: FaturaKayit) => {
    setSeciliDosya(dosya)
    setDuzenlenenFatura(fatura)
    setFormFaturaNo(fatura.faturaNo)
    setFormFaturaTarihi(fatura.faturaTarihi ? fatura.faturaTarihi.slice(0, 10) : '')
    setFormFaturaTutar(fatura.firmaTutar)
    setFormKdvOrani(Number.isFinite(Number(fatura.kdvOrani)) ? Number(fatura.kdvOrani) : 20)
    setFormTevkifatOrani(fatura.tevkifatOrani || 'Yok')
    setFormOdemeYontemi(fatura.odemeYontemi || 'Hazine / Muhasebat Ödeme Emri')
    setFormDurum(fatura.durum)
    setFormAciklama(fatura.aciklama || '')
    setModalOpen(true)
  }

  // Faturayı Kaydet (sablon_tercihleri içine kalıcı yazılır)
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seciliDosya || !window.electron?.ipcRenderer) return

    try {
      setIsSaving(true)
      const fileRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
        [seciliDosya.id]
      )

      let prefs: any = {}
      if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
        try {
          prefs =
            typeof fileRes.data[0].sablon_tercihleri === 'string'
              ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
              : fileRes.data[0].sablon_tercihleri || {}
        } catch {
          prefs = {}
        }
      }

      const existingInvoices: FaturaKayit[] = Array.isArray(prefs.faturalar)
        ? [...prefs.faturalar]
        : []

      const kdvVal = Number.isFinite(Number(formKdvOrani)) ? Number(formKdvOrani) : 20
      const fin = calculateInvoiceFinancials(
        Number(formFaturaTutar) || 0,
        kdvVal,
        formTevkifatOrani,
        true
      )

      const updatedInvoice: FaturaKayit = {
        id: duzenlenenFatura?.id || `fat-${Date.now()}`,
        faturaNo: formFaturaNo.trim(),
        faturaTarihi: formFaturaTarihi,
        firmaTutar: Number(formFaturaTutar) || 0,
        kdvOrani: kdvVal,
        matrah: fin.matrah,
        kdvTutari: fin.kdvTutari,
        tevkifatOrani: formTevkifatOrani,
        tevkifatTutari: fin.tevkifatTutari,
        damgaVergisi: fin.damgaVergisi,
        kararPulu: fin.kararPulu,
        netOdenecek: fin.netOdenecek,
        odemeYontemi: formOdemeYontemi,
        durum: formDurum,
        aciklama: formAciklama.trim(),
        kaynak: 'mali_giris'
      }

      // Aynı fatura numarasının mükerrer eklenmesini önle
      const normalizedNo = formFaturaNo.trim().toLowerCase()
      const isDuplicate = existingInvoices.some(
        (item) => item.faturaNo.trim().toLowerCase() === normalizedNo && item.id !== duzenlenenFatura?.id
      )
      if (isDuplicate) {
        alert(`Hata: "${formFaturaNo.trim()}" numaralı fatura bu dosyada zaten kayıtlıdır.`)
        setIsSaving(false)
        return
      }

      if (duzenlenenFatura) {
        const idx = existingInvoices.findIndex((item) => item.id === duzenlenenFatura.id)
        if (idx !== -1) {
          existingInvoices[idx] = updatedInvoice
        } else {
          existingInvoices.push(updatedInvoice)
        }
      } else {
        existingInvoices.push(updatedInvoice)
      }

      prefs.faturalar = existingInvoices
      prefs.faturaNo = updatedInvoice.faturaNo
      prefs.faturaTarihi = updatedInvoice.faturaTarihi

      const updateRes = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(prefs), seciliDosya.id]
      )

      if (!updateRes?.success) {
        alert('Fatura kaydedilirken veritabanı hatası oluştu: ' + (updateRes?.error || 'Bilinmeyen hata'))
        setIsSaving(false)
        return
      }

      setModalOpen(false)
      setIsSaving(false)
      reloadData()
    } catch (err: any) {
      console.error('[DosyalarVeFaturalariTab] Fatura kaydedilemedi:', err)
      alert('Fatura kaydedilirken beklenmeyen hata: ' + (err?.message || String(err)))
      setIsSaving(false)
    }
  }

  // Fatura Durumunu Hızlıca Değiştir (Ödendi / Beklemede)
  const handleToggleDurum = async (dosya: DosyaOzet, fatura: FaturaKayit) => {
    if (!window.electron?.ipcRenderer) return
    const yeniDurum = fatura.durum === 'odendi' ? 'beklemede' : 'odendi'

    try {
      const fileRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
        [dosya.id]
      )

      let prefs: any = {}
      if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
        try {
          prefs =
            typeof fileRes.data[0].sablon_tercihleri === 'string'
              ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
              : fileRes.data[0].sablon_tercihleri || {}
        } catch {
          prefs = {}
        }
      }

      const existingInvoices: FaturaKayit[] = Array.isArray(prefs.faturalar)
        ? [...prefs.faturalar]
        : []

      const idx = existingInvoices.findIndex((item) => item.id === fatura.id || item.faturaNo === fatura.faturaNo)
      if (idx !== -1) {
        existingInvoices[idx].durum = yeniDurum
      } else {
        existingInvoices.push({ ...fatura, durum: yeniDurum })
      }

      prefs.faturalar = existingInvoices

      const updateRes = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(prefs), dosya.id]
      )

      if (!updateRes?.success) {
        alert('Fatura durumu güncellenirken hata oluştu: ' + (updateRes?.error || 'Bilinmeyen hata'))
        return
      }

      reloadData()
    } catch (err: any) {
      console.error('Durum değiştirilemedi:', err)
      alert('Durum güncellenirken beklenmeyen hata: ' + (err?.message || String(err)))
    }
  }

  // Fatura Sil
  const handleDeleteInvoice = async (dosya: DosyaOzet, faturaId: string | number) => {
    if (!confirm('Bu fatura kaydını silmek istediğinize emin misiniz?')) return
    if (!window.electron?.ipcRenderer) return

    try {
      const fileRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
        [dosya.id]
      )

      let prefs: any = {}
      if (fileRes.success && fileRes.data?.[0]?.sablon_tercihleri) {
        try {
          prefs =
            typeof fileRes.data[0].sablon_tercihleri === 'string'
              ? JSON.parse(fileRes.data[0].sablon_tercihleri) || {}
              : fileRes.data[0].sablon_tercihleri || {}
        } catch {
          prefs = {}
        }
      }

      if (Array.isArray(prefs.faturalar)) {
        prefs.faturalar = prefs.faturalar.filter((item: any) => item.id !== faturaId)
      }

      const updateRes = await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ?, updated_at = datetime("now") WHERE id = ?',
        [JSON.stringify(prefs), dosya.id]
      )

      if (!updateRes?.success) {
        alert('Fatura silinirken hata oluştu: ' + (updateRes?.error || 'Bilinmeyen hata'))
        return
      }

      reloadData()
    } catch (err: any) {
      console.error('Fatura silinemedi:', err)
      alert('Fatura silinirken beklenmeyen hata: ' + (err?.message || String(err)))
    }
  }

  // Doğrudan Temin Dosyasına Git
  const handleOpenDosya = (dosyaId: number) => {
    setActiveDosyaId(dosyaId)
    window.location.hash = '#/dosya'
  }

  // Canlı Hesaplanan İstatistikler
  const stats = useMemo(() => {
    let totalFaturalar = 0
    let totalHarcama = 0
    let paidHarcama = 0
    let pendingHarcama = 0
    let totalDamga = 0
    let totalKararPulu = 0
    let totalTevkifat = 0

    dosyalar.forEach((d) => {
      d.faturalar.forEach((f) => {
        totalFaturalar++
        const tutar = Number(f.firmaTutar || 0)
        totalHarcama += tutar

        if (f.durum === 'odendi') {
          paidHarcama += tutar
        } else if (f.durum === 'beklemede') {
          pendingHarcama += tutar
        }

        totalDamga += Number(f.damgaVergisi || 0)
        totalKararPulu += Number(f.kararPulu || 0)
        totalTevkifat += Number(f.tevkifatTutari || 0)
      })
    })

    return {
      totalDosya: dosyalar.length,
      totalFaturalar,
      totalHarcama,
      paidHarcama,
      pendingHarcama,
      totalDamga,
      totalKararPulu,
      totalTevkifat,
      netHazineCikisi: totalHarcama - (totalDamga + totalKararPulu + totalTevkifat)
    }
  }, [dosyalar])

  // Filtreleme
  const filteredDosyalar = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return dosyalar.filter((d) => {
      const matchSearch =
        !term ||
        d.teminNo.toLowerCase().includes(term) ||
        d.konu.toLowerCase().includes(term) ||
        d.kazananFirmaUnvani.toLowerCase().includes(term) ||
        d.kazananFirmaVkn.toLowerCase().includes(term) ||
        d.harcamaBirimi.toLowerCase().includes(term) ||
        d.faturalar.some((f) => f.faturaNo.toLowerCase().includes(term))

      const matchAlim = alimFilter === 'all' || d.tur.toLowerCase() === alimFilter.toLowerCase()

      let matchFatura = true
      if (faturaFilter === 'with-invoice') {
        matchFatura = d.faturalar.length > 0
      } else if (faturaFilter === 'without-invoice') {
        matchFatura = d.faturalar.length === 0
      } else if (faturaFilter === 'paid') {
        matchFatura = d.faturalar.some((f) => f.durum === 'odendi')
      } else if (faturaFilter === 'pending') {
        matchFatura = d.faturalar.some((f) => f.durum === 'beklemede')
      }

      return matchSearch && matchAlim && matchFatura
    })
  }, [dosyalar, searchTerm, alimFilter, faturaFilter])

  // Canlı modal hesaplama
  const modalCalculations = useMemo(() => {
    return calculateInvoiceFinancials(
      formFaturaTutar || 0,
      Number.isFinite(Number(formKdvOrani)) ? Number(formKdvOrani) : 20,
      formTevkifatOrani,
      true
    )
  }, [formFaturaTutar, formKdvOrani, formTevkifatOrani])

  return (
    <div className="space-y-6">
      {/* ── Üst İstatistik Kartları (BKMYBS / 5018 Kurumsal Görünüm) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kart 1: Dosyalar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              5018 Kapsamında Dosyalar
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {stats.totalDosya}
              </span>
              <span className="text-xs font-semibold text-slate-500">Doğrudan Temin</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              {dosyalar.filter((d) => d.faturalar.length > 0).length} dosyanın faturası bağlı
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderOpen size={24} />
          </div>
        </div>

        {/* Kart 2: Fatura Durumu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Toplam Fatura Kaydı
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {stats.totalFaturalar}
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {dosyalar.flatMap((d) => d.faturalar).filter((f) => f.durum === 'beklemede').length} Bekleyen
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
              {dosyalar.flatMap((d) => d.faturalar).filter((f) => f.durum === 'odendi').length} Ödenen Fatura
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Receipt size={24} />
          </div>
        </div>

        {/* Kart 3: Harcama ve Tahakkuk Bedeli */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Toplam Harcama / Fatura Tutarı
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(stats.totalHarcama)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
              Ödenen: {formatCurrency(stats.paidHarcama)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote size={24} />
          </div>
        </div>

        {/* Kart 4: Kamu Yasal Kesintileri */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Yasal Kesintiler (Damga & Karar)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(stats.totalDamga + stats.totalKararPulu + stats.totalTevkifat)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
              Damga: {formatCurrency(stats.totalDamga)} | Karar: {formatCurrency(stats.totalKararPulu)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Percent size={24} />
          </div>
        </div>
      </div>

      {/* ── Filtreleme & Arama Çubuğu ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dosya no, konu, firma unvanı, VKN veya fatura no ara..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={alimFilter}
            onChange={(e) => setAlimFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Alım Türleri</option>
            <option value="mal">Mal Alımı</option>
            <option value="hizmet">Hizmet Alımı</option>
            <option value="danismanlik">Danışmanlık</option>
            <option value="yapim">Yapım İşi</option>
          </select>

          <select
            value={faturaFilter}
            onChange={(e) => setFaturaFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="with-invoice">Faturası Olanlar</option>
            <option value="without-invoice">Faturası Beklenenler</option>
            <option value="paid">Ödenen Faturalar</option>
            <option value="pending">Ödeme Bekleyenler</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
          >
            Tümünü Aç
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
          >
            Tümünü Kapat
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
          <span className="text-xs text-slate-500 font-bold">
            Toplam <strong>{filteredDosyalar.length}</strong> dosya listeleniyor
          </span>
        </div>
      </div>

      {/* ── Dosyalar ve Faturaları Listesi ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Clock className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Doğrudan Temin dosyaları ve faturaları derleniyor...
            </p>
          </div>
        ) : filteredDosyalar.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Kayıtlı dosya bulunamadı
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Arama kriterlerinize uyan Doğrudan Temin dosyası bulunamadı veya henüz dosya oluşturulmadı.
              </p>
            </div>
          </div>
        ) : (
          filteredDosyalar.map((dosya) => {
            const isExp = expanded.has(dosya.id)
            const faturaSayisi = dosya.faturalar.length
            const dosyaFaturaToplam = dosya.faturalar.reduce((acc, f) => acc + (f.firmaTutar || 0), 0)

            return (
              <div
                key={dosya.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Dosya Başlık Şeridi */}
                <div
                  onClick={() => toggleExpand(dosya.id)}
                  className="p-4 cursor-pointer flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                        {dosya.teminNo}
                      </span>
                      <AlimTuruBadge turu={dosya.tur} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {dosya.konu}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 size={11} className="text-slate-400" />
                          {dosya.kazananFirmaUnvani} (VKN: {dosya.kazananFirmaVkn})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers size={11} className="text-slate-400" />
                          {dosya.harcamaBirimi}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {formatDate(dosya.olusturmaTarihi)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sağ Taraf: Bedel ve Fatura Rozeti */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Yaklaşık Maliyet / Bedel
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {formatCurrency(dosya.yaklasikMaliyet || dosya.netOdenen)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Fatura Toplamı
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {faturaSayisi > 0 ? formatCurrency(dosyaFaturaToplam) : 'Fatura Yok'}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        faturaSayisi > 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {faturaSayisi > 0 ? `${faturaSayisi} Fatura Kayıtlı` : 'Fatura Bekleniyor'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDosya(dosya.id)
                      }}
                      title="Doğrudan Temin Dosyasını Aç"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/50 dark:text-slate-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>

                {/* Genişletilmiş Alan: Fatura Detay Tablosu & Mali İşlemler */}
                {isExp && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt size={14} className="text-blue-600 dark:text-blue-400" />
                        <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Doğrudan Temin Fatura & Hak Ediş Çizelgesi (5018 / BKMYBS)
                        </h5>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Bütçe Kodu: {dosya.butceKodu} | İBAN: {dosya.kazananFirmaIban}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAddInvoice(dosya)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          <Plus size={13} />
                          Fatura Ekle
                        </button>
                      </div>
                    </div>

                    {/* Fatura Tablosu */}
                    {dosya.faturalar.length === 0 ? (
                      <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          Bu dosyaya henüz bir fatura veya hak ediş kaydı bağlanmadı.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Doğrudan Temin ekranında Muayene ve Kabul Tutanağı düzenlendiğinde veya buradan Fatura Ekle butonuna tıklandığında fatura listelenecektir.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-3.5 py-2.5">Fatura No</th>
                              <th className="px-3.5 py-2.5">Fatura Tarihi</th>
                              <th className="px-3.5 py-2.5 text-right">KDV Matrahı (₺)</th>
                              <th className="px-3.5 py-2.5 text-center">KDV (%)</th>
                              <th className="px-3.5 py-2.5 text-right">Fatura Tutarı (Brüt)</th>
                              <th className="px-3.5 py-2.5 text-right">Damga Vergisi (%0.948)</th>
                              <th className="px-3.5 py-2.5 text-right">Karar Pulu (%0.569)</th>
                              <th className="px-3.5 py-2.5 text-right font-black text-blue-600 dark:text-blue-400">
                                Net Ödenecek (₺)
                              </th>
                              <th className="px-3.5 py-2.5 text-center">Durum</th>
                              <th className="px-3.5 py-2.5 text-right">İşlemler</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                            {dosya.faturalar.map((fatura) => (
                              <tr key={fatura.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                                <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {fatura.faturaNo}
                                </td>
                                <td className="px-3.5 py-2.5 text-slate-500">
                                  {formatDate(fatura.faturaTarihi)}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {formatCurrency(fatura.matrah || 0)}
                                </td>
                                <td className="px-3.5 py-2.5 text-center font-bold text-slate-500">
                                  %{Number.isFinite(Number(fatura.kdvOrani)) ? fatura.kdvOrani : 20}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                                  {formatCurrency(fatura.firmaTutar || 0)}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                                  {formatCurrency(fatura.damgaVergisi || 0)}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                                  {formatCurrency(fatura.kararPulu || 0)}
                                </td>
                                <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(fatura.netOdenecek || fatura.firmaTutar)}
                                </td>
                                <td className="px-3.5 py-2.5 text-center">
                                  <FaturaDurumBadge durum={fatura.durum} />
                                </td>
                                <td className="px-3.5 py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleToggleDurum(dosya, fatura)}
                                      title={fatura.durum === 'odendi' ? 'Beklemeye Al' : 'Ödendi Olarak İşaretle'}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                        fatura.durum === 'odendi'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                      }`}
                                    >
                                      {fatura.durum === 'odendi' ? 'Beklet' : 'Ödendi Yap'}
                                    </button>

                                    <button
                                      onClick={() => handleOpenEditInvoice(dosya, fatura)}
                                      title="Faturayı Düzenle"
                                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                    >
                                      <Edit2 size={13} />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteInvoice(dosya, fatura.id)}
                                      title="Faturayı Sil"
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Fatura Ekleme & Düzenleme Modalı ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {duzenlenenFatura ? 'Faturayı Düzenle' : 'Yeni Fatura & Hak Ediş Kaydı Ekle'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {seciliDosya?.teminNo} — {seciliDosya?.konu}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fatura / E-Arşiv No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFaturaNo}
                    onChange={(e) => setFormFaturaNo(e.target.value)}
                    placeholder="Örn: GIB20260000001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fatura Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFaturaTarihi}
                    onChange={(e) => setFormFaturaTarihi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fatura Tutarı (Brüt ₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formFaturaTutar}
                    onChange={(e) => setFormFaturaTutar(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    KDV Oranı (%)
                  </label>
                  <select
                    value={formKdvOrani}
                    onChange={(e) => setFormKdvOrani(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={20}>%20 Standart</option>
                    <option value={10}>%10 İndirimli</option>
                    <option value={1}>%1 Temel</option>
                    <option value={0}>%0 Muaf</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    KDV Tevkifatı
                  </label>
                  <select
                    value={formTevkifatOrani}
                    onChange={(e) => setFormTevkifatOrani(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Yok">Tevkifat Yok</option>
                    <option value="2/10">2/10</option>
                    <option value="3/10">3/10</option>
                    <option value="4/10">4/10</option>
                    <option value="5/10">5/10</option>
                    <option value="7/10">7/10</option>
                    <option value="9/10">9/10</option>
                    <option value="Tam">Tam Tevkifat</option>
                  </select>
                </div>
              </div>

              {/* Otomatik Yasal Kesinti Kartı */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Calculator size={13} className="text-blue-500" /> Otomatik 5018 / BKMYBS Hesaplaması:
                </span>
                <div className="flex justify-between text-slate-500">
                  <span>KDV Matrahı (KDV Hariç):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(modalCalculations.matrah)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Hesaplanan KDV Tutarı:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(modalCalculations.kdvTutari)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Damga Vergisi Kesintisi (488 S.K. binde 9,48):</span>
                  <span className="font-mono font-bold">-{formatCurrency(modalCalculations.damgaVergisi)}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Karar Pulu Kesintisi (binde 5,69):</span>
                  <span className="font-mono font-bold">-{formatCurrency(modalCalculations.kararPulu)}</span>
                </div>
                {modalCalculations.tevkifatTutari > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>KDV Tevkifat Kesintisi:</span>
                    <span className="font-mono font-bold">-{formatCurrency(modalCalculations.tevkifatTutari)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 flex justify-between font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  <span>Net Ödenecek Hazine Tutarı:</span>
                  <span className="font-mono">{formatCurrency(modalCalculations.netOdenecek)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ödeme Durumu
                  </label>
                  <select
                    value={formDurum}
                    onChange={(e) => setFormDurum(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="beklemede">Ödeme Bekliyor / Tahakkukta</option>
                    <option value="odendi">Ödendi (İşlem Tamamlandı)</option>
                    <option value="iptal">İptal / İade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ödeme Yöntemi
                  </label>
                  <input
                    type="text"
                    value={formOdemeYontemi}
                    onChange={(e) => setFormOdemeYontemi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mali Açıklama / Hak Ediş Notu
                </label>
                <textarea
                  rows={2}
                  value={formAciklama}
                  onChange={(e) => setFormAciklama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  {isSaving ? 'Kaydediliyor...' : 'Faturayı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default DosyalarVeFaturalariTab
