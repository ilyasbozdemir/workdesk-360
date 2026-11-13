import React, { useState, useEffect } from 'react'
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
  Banknote
} from 'lucide-react'
import { KamuRole } from '../../types'
import { formatCurrency } from '@renderer/utils/formatters'

// ─── Tipler ────────────────────────────────────────────────────────────────

export interface FaturaKayit {
  id: string | number
  faturaNo: string
  faturaTarihi: string
  firmaTutar: number // brüt fatura tutarı
  kdvOrani: number
  odemeYontemi: string | null
  durum: 'beklemede' | 'odendi' | 'iptal'
  aciklama?: string
}

export interface DosyaOzet {
  id: number
  dosyaNo: string
  dosyaKonusu: string
  alimTuru: string
  toplamBedel: number
  kazananFirmaUnvani: string | null
  kazananFirmaVkn: string | null
  olusturmaTarihi: string
  harcamaBirimi: string
  durumAsamaId: number
  status: string | null
  faturalar: FaturaKayit[]
}

interface DosyalarVeFaturalariTabProps {
  activeRole: KamuRole
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
      <Clock size={10} className="text-amber-500" /> Beklemede
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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${info.cls}`}
    >
      {info.label}
    </span>
  )
}

// ─── Veritabanı Yükleme ve Çözümleme Fonksiyonu ─────────────────────────────

async function loadDosyalarVeFaturalar(): Promise<DosyaOzet[]> {
  if (typeof window === 'undefined' || !window.electron?.ipcRenderer) return []

  try {
    // DATA_TeminDosyasi tablosundaki gerçek kolonlar:
    // temin_no, konu, tur, yaklasik_maliyet, firma_id, created_at, sablon_tercihleri
    const dosyaRes = await window.electron.ipcRenderer.invoke(
      'db:query',
      `SELECT
         d.id,
         COALESCE(d.temin_no, '#' || d.id) AS dosya_no,
         COALESCE(d.konu, 'Doğrudan Temin Dosyası') AS dosya_konusu,
         COALESCE(d.tur, 'mal') AS alim_turu,
         COALESCE(d.yaklasik_maliyet, d.net_odenen, 0) AS toplam_bedel,
         COALESCE(f.unvan, tf.unvan, 'Yüklenici Belirlenmedi') AS kazanan_firma_unvani,
         COALESCE(f.vergi_no, tf.vergi_no, '-') AS kazanan_firma_vkn,
         COALESCE(d.temin_tarihi, d.dosya_acilis_tarihi, d.created_at, DATE('now')) AS olusturma_tarihi,
         d.sablon_tercihleri,
         COALESCE(d.durum_asama_id, 1) AS durum_asama_id,
         d.status,
         COALESCE(b.ad, d.harcama_birimi, 'Harcama Birimi') AS harcama_birimi
       FROM DATA_TeminDosyasi d
       LEFT JOIN TANIM_Firma f ON d.firma_id = f.id
       LEFT JOIN DATA_TeminFirma tf ON tf.temin_dosya_id = d.id AND (tf.kazanan_mi = 1 OR tf.kazandi_mi = 1)
       LEFT JOIN TANIM_Birim b ON d.birim_id = b.id
       WHERE (d.is_deleted = 0 OR d.is_deleted IS NULL)
       ORDER BY d.id DESC
       LIMIT 250`
    )

    const rawRows = dosyaRes?.success ? dosyaRes.data : Array.isArray(dosyaRes) ? dosyaRes : []
    if (!Array.isArray(rawRows) || rawRows.length === 0) return []

    return rawRows.map((d: any) => {
      // sablon_tercihleri içerisinden kabul tutanakları ve fatura listesini çözümle
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

      // 1. sablon_tercihleri.faturalar (Mali Hizmetler doğrudan fatura kayıtları)
      if (Array.isArray(preferences.faturalar) && preferences.faturalar.length > 0) {
        preferences.faturalar.forEach((f: any, idx: number) => {
          faturalar.push({
            id: f.id || `fatura-${d.id}-${idx}`,
            faturaNo: f.faturaNo || f.fatura_no || `FAT-${d.id}-${idx + 1}`,
            faturaTarihi: f.faturaTarihi || f.fatura_tarihi || d.olusturma_tarihi,
            firmaTutar: Number(f.firmaTutar || f.tutar || f.fatura_tutari || d.toplam_bedel || 0),
            kdvOrani: Number(f.kdvOrani ?? 20),
            odemeYontemi: f.odemeYontemi || 'Hazine / Muhasebat Ödeme Emri',
            durum: f.durum === 'odendi' || f.durum === 'iptal' ? f.durum : 'beklemede',
            aciklama: f.aciklama || ''
          })
        })
      }

      // 2. sablon_tercihleri.kabulTutanaklari (Kabul & Ödeme aşamasında girilen tutanaklar/faturalar)
      if (
        Array.isArray(preferences.kabulTutanaklari) &&
        preferences.kabulTutanaklari.length > 0
      ) {
        preferences.kabulTutanaklari.forEach((t: any, idx: number) => {
          const faturaNo = (t.faturaNo || t.tutanakNo || '').trim()
          // Mükerrer eklemeyi engelle
          const exists = faturalar.some((item) => item.faturaNo === faturaNo)
          if (!exists && faturaNo) {
            faturalar.push({
              id: t.id || `tutanak-fat-${d.id}-${idx}`,
              faturaNo: faturaNo,
              faturaTarihi: t.faturaTarihi || t.tutanakTarihi || d.olusturma_tarihi,
              firmaTutar: Number(t.tutar || d.toplam_bedel || 0),
              kdvOrani: 20,
              odemeYontemi: 'Hazine / Muhasebat Ödeme Emri',
              durum: t.durum === 'kabul' ? 'odendi' : t.durum === 'red' ? 'iptal' : 'beklemede',
              aciklama: t.notlar || 'Kabul Tutanağı Fatura Kaydı'
            })
          }
        })
      }

      // 3. Tekil faturaNo & faturaTarihi fallback
      if (preferences.faturaNo && faturalar.length === 0) {
        faturalar.push({
          id: `single-fat-${d.id}`,
          faturaNo: preferences.faturaNo,
          faturaTarihi: preferences.faturaTarihi || d.olusturma_tarihi,
          firmaTutar: Number(d.toplam_bedel || 0),
          kdvOrani: 20,
          odemeYontemi: 'Hazine / Muhasebat Ödeme Emri',
          durum: Number(d.durum_asama_id) >= 4 ? 'odendi' : 'beklemede',
          aciklama: 'Doğrudan Temin Faturası'
        })
      }

      return {
        id: d.id,
        dosyaNo: d.dosya_no,
        dosyaKonusu: d.dosya_konusu,
        alimTuru: d.alim_turu,
        toplamBedel: Number(d.toplam_bedel) || 0,
        kazananFirmaUnvani: d.kazanan_firma_unvani,
        kazananFirmaVkn: d.kazanan_firma_vkn,
        olusturmaTarihi: d.olusturma_tarihi,
        harcamaBirimi: d.harcama_birimi,
        durumAsamaId: d.durum_asama_id,
        status: d.status,
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
  const [dosyalar, setDosyalar] = useState<DosyaOzet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [alimFilter, setAlimFilter] = useState('all')
  const [faturaFilter, setFaturaFilter] = useState<'all' | 'with-invoice' | 'without-invoice'>('all')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  // Fatura Ekleme/Düzenleme Modalı State
  const [modalOpen, setModalOpen] = useState(false)
  const [seciliDosya, setSeciliDosya] = useState<DosyaOzet | null>(null)
  const [duzenlenenFatura, setDuzenlenenFatura] = useState<FaturaKayit | null>(null)
  const [formFaturaNo, setFormFaturaNo] = useState('')
  const [formFaturaTarihi, setFormFaturaTarihi] = useState('')
  const [formFaturaTutar, setFormFaturaTutar] = useState<number>(0)
  const [formKdvOrani, setFormKdvOrani] = useState<number>(20)
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

  // Fatura Ekle Modal Aç
  const handleOpenAddInvoice = (dosya: DosyaOzet) => {
    setSeciliDosya(dosya)
    setDuzenlenenFatura(null)
    setFormFaturaNo(`FAT-${dosya.dosyaNo?.replace(/[^a-zA-Z0-9]/g, '') || dosya.id}-01`)
    setFormFaturaTarihi(new Date().toISOString().slice(0, 10))
    setFormFaturaTutar(dosya.toplamBedel || 0)
    setFormKdvOrani(20)
    setFormOdemeYontemi('Hazine / Muhasebat Ödeme Emri')
    setFormDurum('beklemede')
    setFormAciklama(`${dosya.dosyaKonusu} hak ediş ve fatura kaydı.`)
    setModalOpen(true)
  }

  // Fatura Düzenle Modal Aç
  const handleOpenEditInvoice = (dosya: DosyaOzet, fatura: FaturaKayit) => {
    setSeciliDosya(dosya)
    setDuzenlenenFatura(fatura)
    setFormFaturaNo(fatura.faturaNo)
    setFormFaturaTarihi(fatura.faturaTarihi ? fatura.faturaTarihi.slice(0, 10) : '')
    setFormFaturaTutar(fatura.firmaTutar)
    setFormKdvOrani(fatura.kdvOrani)
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

      const updatedInvoice: FaturaKayit = {
        id: duzenlenenFatura?.id || `fat-${Date.now()}`,
        faturaNo: formFaturaNo.trim(),
        faturaTarihi: formFaturaTarihi,
        firmaTutar: Number(formFaturaTutar) || 0,
        kdvOrani: Number(formKdvOrani) || 20,
        odemeYontemi: formOdemeYontemi,
        durum: formDurum,
        aciklama: formAciklama.trim()
      }

      if (duzenlenenFatura) {
        // Güncelle
        const idx = existingInvoices.findIndex((item) => item.id === duzenlenenFatura.id)
        if (idx !== -1) {
          existingInvoices[idx] = updatedInvoice
        } else {
          existingInvoices.push(updatedInvoice)
        }
      } else {
        // Yeni ekle
        existingInvoices.push(updatedInvoice)
      }

      prefs.faturalar = existingInvoices
      // Geriye dönük uyumluluk için ana faturayı da güncelle
      prefs.faturaNo = updatedInvoice.faturaNo
      prefs.faturaTarihi = updatedInvoice.faturaTarihi

      await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
        [JSON.stringify(prefs), seciliDosya.id]
      )

      setModalOpen(false)
      reloadData()
    } catch (err) {
      console.error('[DosyalarVeFaturalariTab] Fatura kaydedilemedi:', err)
      alert('Fatura kaydedilirken bir hata oluştu!')
    } finally {
      setIsSaving(false)
    }
  }

  // Fatura Sil
  const handleDeleteInvoice = async (dosyaId: number, faturaId: string | number) => {
    if (!confirm('Bu fatura kaydını silmek istediğinize emin misiniz?')) return
    if (!window.electron?.ipcRenderer) return

    try {
      const fileRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT sablon_tercihleri FROM DATA_TeminDosyasi WHERE id = ?',
        [dosyaId]
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
        prefs.faturalar = prefs.faturalar.filter((f: any) => f.id !== faturaId)
      }
      if (Array.isArray(prefs.kabulTutanaklari)) {
        prefs.kabulTutanaklari = prefs.kabulTutanaklari.filter((t: any) => t.id !== faturaId)
      }

      await window.electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET sablon_tercihleri = ? WHERE id = ?',
        [JSON.stringify(prefs), dosyaId]
      )

      reloadData()
    } catch (err) {
      console.error('[DosyalarVeFaturalariTab] Fatura silinemedi:', err)
    }
  }

  // Arama & Filtreleme
  const filtered = dosyalar.filter((d) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      d.dosyaNo.toLowerCase().includes(q) ||
      d.dosyaKonusu.toLowerCase().includes(q) ||
      (d.kazananFirmaUnvani ?? '').toLowerCase().includes(q) ||
      (d.kazananFirmaVkn ?? '').includes(q) ||
      (d.harcamaBirimi ?? '').toLowerCase().includes(q) ||
      d.faturalar.some((f) => f.faturaNo.toLowerCase().includes(q))

    const matchesAlim = alimFilter === 'all' || d.alimTuru.toLowerCase().includes(alimFilter)

    const matchesFatura =
      faturaFilter === 'all' ||
      (faturaFilter === 'with-invoice' && d.faturalar.length > 0) ||
      (faturaFilter === 'without-invoice' && d.faturalar.length === 0)

    return matchesSearch && matchesAlim && matchesFatura
  })

  // Özet İstatistikler
  const toplamFatura = dosyalar.reduce((s, d) => s + d.faturalar.length, 0)
  const bekleyenFatura = dosyalar.reduce(
    (s, d) => s + d.faturalar.filter((f) => f.durum === 'beklemede').length,
    0
  )
  const odenenFaturaTutari = dosyalar.reduce(
    (s, d) =>
      s +
      d.faturalar
        .filter((f) => f.durum === 'odendi')
        .reduce((sub, f) => sub + Number(f.firmaTutar || 0), 0),
    0
  )
  const toplamBedel = dosyalar.reduce((s, d) => s + d.toplamBedel, 0)

  return (
    <div className="space-y-4">
      {/* ─── Özet Kartları ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Toplam Doğrudan Temin
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <FolderOpen size={15} />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {dosyalar.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            4734 Sayılı KİK doğrudan temin dosyaları
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Kayıtlı Faturalar
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Receipt size={15} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {toplamFatura}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              ({bekleyenFatura} Beklemede)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Muayene kabul ve tahakkuk faturaları</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Ödenen Fatura Tutarı
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600">
              <CheckCircle size={15} />
            </div>
          </div>
          <div className="text-base font-mono font-extrabold text-teal-600 dark:text-teal-400 truncate">
            {formatCurrency(odenenFaturaTutari)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ödemesi tamamlanmış fatura toplamı</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Toplam Temin Bedeli
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600">
              <Banknote size={15} />
            </div>
          </div>
          <div className="text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
            {formatCurrency(toplamBedel)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Doğrudan temin onay / taahhüt tutarı</div>
        </div>
      </div>

      {/* ─── Filtre Çubuğu ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dosya no, konu, yüklenici firma unvanı, VKN veya fatura no ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
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
            <option value="all">Tüm Dosyalar</option>
            <option value="with-invoice">Faturası Olanlar</option>
            <option value="without-invoice">Fatura Bekleyenler</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold shrink-0">
          Toplam <strong>{filtered.length}</strong> dosya listeleniyor
        </div>
      </div>

      {/* ─── Dosyalar ve Fatura Akordiyon Listesi ────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2">
            <Coins className="w-8 h-8 text-blue-500 animate-spin" />
            <span>Doğrudan temin ve fatura verileri yükleniyor...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2">
            <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Kayıtlı dosya veya fatura bulunamadı.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm text-center">
              Arama kriterlerinizi değiştiriniz veya Doğrudan Temin masasında kayıt oluşturulduğunda
              otomatik listelenecektir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.map((dosya) => {
              const isOpen = expanded.has(dosya.id)
              const faturaVar = dosya.faturalar.length > 0
              const faturaToplam = dosya.faturalar.reduce((s, f) => s + Number(f.firmaTutar || 0), 0)

              return (
                <div key={dosya.id} className="transition-colors">
                  {/* Dosya Başlık Satırı */}
                  <div className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors gap-3">
                    {/* Sol: Aç/Kapa Butonu + Dosya Temel Bilgileri */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(dosya.id)}
                      className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>

                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                        <FolderOpen size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                            {dosya.dosyaNo}
                          </span>
                          <AlimTuruBadge turu={dosya.alimTuru} />
                          {faturaVar ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                              <Receipt size={10} className="text-emerald-600" />
                              {dosya.faturalar.length} Fatura ({formatCurrency(faturaToplam)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                              Fatura Yok
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                          {dosya.dosyaKonusu}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                          {dosya.kazananFirmaUnvani && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium truncate max-w-xs">
                              <Building2 size={11} className="text-slate-400 shrink-0" />
                              {dosya.kazananFirmaUnvani}
                              {dosya.kazananFirmaVkn !== '-' ? ` (${dosya.kazananFirmaVkn})` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar size={11} className="shrink-0" />
                            {dosya.olusturmaTarihi ? dosya.olusturmaTarihi.slice(0, 10) : '—'}
                          </span>
                          <span className="text-slate-400">
                            Birim: {dosya.harcamaBirimi}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Sağ: Toplam Tutar ve Hızlı Fatura Ekleme */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-100">
                          {dosya.toplamBedel > 0 ? formatCurrency(dosya.toplamBedel) : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Doğrudan Temin Tutarı</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAddInvoice(dosya)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 text-xs font-bold transition-all border border-blue-200/60 dark:border-blue-800/40 cursor-pointer shadow-2xs"
                        title="Bu dosyaya fatura kaydı ekle"
                      >
                        <Plus size={13} />
                        Fatura Ekle
                      </button>
                    </div>
                  </div>

                  {/* Genişletilmiş Fatura Detay Alanı */}
                  {isOpen && (
                    <div className="bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 px-6 sm:px-12 py-3.5 space-y-3">
                      {!faturaVar ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-2.5 text-slate-500 text-xs">
                            <FileText size={15} className="text-slate-400" />
                            <span>
                              Bu doğrudan temin dosyasına ait sisteme işlenmiş bir fatura bulunmuyor.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddInvoice(dosya)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Plus size={12} />
                            Fatura Tanımla
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                                <th className="py-2.5 px-3">Fatura No</th>
                                <th className="py-2.5 px-3">Fatura Tarihi</th>
                                <th className="py-2.5 px-3 text-right">Brüt Tutar</th>
                                <th className="py-2.5 px-3 text-center">KDV %</th>
                                <th className="py-2.5 px-3">Ödeme Yöntemi</th>
                                <th className="py-2.5 px-3 text-center">Durum</th>
                                <th className="py-2.5 px-3 text-right">İşlemler</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                              {dosya.faturalar.map((f) => (
                                <tr
                                  key={f.id}
                                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                    <div className="flex items-center gap-1.5">
                                      <Receipt size={13} className="text-emerald-500 shrink-0" />
                                      {f.faturaNo}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500">
                                    {f.faturaTarihi ? f.faturaTarihi.slice(0, 10) : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {formatCurrency(f.firmaTutar)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-500">
                                    %{f.kdvOrani}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[160px]">
                                    {f.odemeYontemi || '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <FaturaDurumBadge durum={f.durum} />
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditInvoice(dosya, f)}
                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                        title="Düzenle"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteInvoice(dosya.id, f.id)}
                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                        title="Faturayı Sil"
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
            })}
          </div>
        )}
      </div>

      {/* ─── Fatura Ekle / Düzenle Modal ─────────────────────────────────── */}
      {modalOpen && seciliDosya && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Başlık */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                  <Receipt size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {duzenlenenFatura ? 'Fatura Bilgilerini Düzenle' : 'Doğrudan Temin Faturası Ekle'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {seciliDosya.dosyaNo} — {seciliDosya.dosyaKonusu}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveInvoice} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Fatura Numarası *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFaturaNo}
                    onChange={(e) => setFormFaturaNo(e.target.value)}
                    placeholder="Örn: FAT2026-0001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Fatura Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFaturaTarihi}
                    onChange={(e) => setFormFaturaTarihi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Brüt Tutar (₺) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formFaturaTutar}
                    onChange={(e) => setFormFaturaTutar(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    KDV Oranı (%)
                  </label>
                  <select
                    value={formKdvOrani}
                    onChange={(e) => setFormKdvOrani(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value={20}>%20 (Standart)</option>
                    <option value={10}>%10 (İndirimli)</option>
                    <option value={1}>%1 (Özel)</option>
                    <option value={0}>%0 (KDV Muaf)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Ödeme Durumu
                  </label>
                  <select
                    value={formDurum}
                    onChange={(e) => setFormDurum(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="beklemede">Beklemede (Ödeme Sırasında)</option>
                    <option value="odendi">Ödendi (Tamamlandı)</option>
                    <option value="iptal">İptal Edildi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Ödeme / Tahakkuk Kanalı
                  </label>
                  <input
                    type="text"
                    value={formOdemeYontemi}
                    onChange={(e) => setFormOdemeYontemi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Mali Açıklama / Not
                </label>
                <textarea
                  rows={2}
                  value={formAciklama}
                  onChange={(e) => setFormAciklama(e.target.value)}
                  placeholder="İlgili fatura ve ödemeye dair iç muhasebe notu..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              {/* Yüklenici Bilgi Kartı */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Yüklenici Firma:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {seciliDosya.kazananFirmaUnvani || 'Belirtilmedi'}
                </span>
              </div>

              {/* Butonlar */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <Clock size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
