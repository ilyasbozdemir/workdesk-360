import React, { useEffect, useMemo, useState } from 'react'
import {
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  Tag,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  History,
  Info,
  Check
} from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrency } from '@renderer/utils/formatters'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '../../../utils/cn'

interface StubFirmUsage {
  firma_id: number
  dosya_sayisi: number
  toplam_teklif: number
  kazandi_sayisi: number
}

interface AttachedDossier {
  dosya_id: number
  temin_no: string
  konu: string
  tur: string
  teklif_toplami: number
  kazandi_mi: number
  status: string
  temin_tarihi: string
}

interface MatchResult {
  masterFirma: any
  score: number
  reason: string
}

interface MergeHistoryItem {
  id: string
  timestamp: string
  stubName: string
  stubId: number
  masterName: string
  masterCode: string
  masterId: number
  dosyaCount: number
}

interface FirmaEslestirmeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

function cleanDigits(s?: string | null): string {
  if (!s) return ''
  return String(s).replace(/\D/g, '')
}

function normalizeTitle(s?: string | null): string {
  if (!s) return ''
  return String(s)
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,\-_/\\()&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleTokenSet(s?: string | null): Set<string> {
  const norm = normalizeTitle(s)
  const stopWords = new Set([
    'ltd',
    'sti',
    'şti',
    'as',
    'a',
    'ş',
    'san',
    'tic',
    've',
    'sanayi',
    'ticaret',
    'insaat',
    'inşaat',
    'taahhut',
    'taahhüt',
    'muh',
    'müh',
    'muhendislik',
    'mühendislik',
    'dan',
    'danismanlik',
    'danışmanlık',
    'hiz',
    'hizmetleri',
    'limited',
    'sirketi',
    'şirketi',
    'anonim',
    'gida',
    'gıda',
    'pet',
    'petrol',
    'nak',
    'nakliyat',
    'otom',
    'otomotiv',
    'yapı',
    'yapi'
  ])
  const tokens = norm.split(/\s+/).filter((t) => t.length >= 3 && !stopWords.has(t))
  return new Set(tokens)
}

function calculateMatchScore(stub: any, master: any): { score: number; reason: string } {
  // 1. VKN / TCKN match
  const stubVkn = cleanDigits(stub.vergi_no || stub.tc_kimlik_no)
  const masterVkn = cleanDigits(master.vergi_no || master.tc_kimlik_no)
  if (stubVkn && masterVkn && stubVkn.length >= 8 && stubVkn === masterVkn) {
    return { score: 100, reason: `Vergi No / TCKN Birebir (${stubVkn})` }
  }

  // 2. Telefon match
  const stubPhone = cleanDigits(stub.telefon)
  const masterPhone = cleanDigits(master.telefon)
  if (stubPhone && masterPhone && stubPhone.length >= 7) {
    const sSuffix = stubPhone.slice(-7)
    const mSuffix = masterPhone.slice(-7)
    if (sSuffix === mSuffix) {
      return { score: 98, reason: `Telefon Eşleşmesi (${stub.telefon})` }
    }
  }

  // 3. Compact Title Prefix Match
  const stubCompact = normalizeTitle(stub.unvan).replace(/\s+/g, '')
  const masterCompact = normalizeTitle(master.unvan).replace(/\s+/g, '')
  if (stubCompact.length >= 4) {
    if (masterCompact.startsWith(stubCompact) || stubCompact.startsWith(masterCompact)) {
      return { score: 95, reason: `Unvan Birebir Başlangıç Uyumu` }
    }
    if (masterCompact.includes(stubCompact) || stubCompact.includes(masterCompact)) {
      return { score: 90, reason: `Unvan Kapsama Uyumu` }
    }
  }

  // 4. Token Intersection Match
  const stubTokens = titleTokenSet(stub.unvan)
  const masterTokens = titleTokenSet(master.unvan)
  if (stubTokens.size > 0 && masterTokens.size > 0) {
    let intersection = 0
    for (const t of stubTokens) {
      if (masterTokens.has(t)) intersection++
    }
    if (intersection > 0) {
      const matchRatio = intersection / Math.min(stubTokens.size, masterTokens.size)
      if (matchRatio >= 0.8) {
        return { score: 85, reason: `Anahtar Kelime Benzerliği (${intersection} kelime)` }
      }
      if (matchRatio >= 0.5) {
        return { score: 70, reason: `Kısmi İsim Benzerliği` }
      }
    }
  }

  return { score: 0, reason: '' }
}

export function FirmaEslestirmeModal({
  isOpen,
  onClose,
  onSuccess
}: FirmaEslestirmeModalProps): React.JSX.Element {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'stubs' | 'manual' | 'history'>('stubs')
  const [loading, setLoading] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Data states
  const [allFirms, setAllFirms] = useState<any[]>([])
  const [usages, setUsages] = useState<Record<number, StubFirmUsage>>({})
  const [expandedDossiers, setExpandedDossiers] = useState<Record<number, AttachedDossier[]>>({})
  const [expandedStubId, setExpandedStubId] = useState<number | null>(null)
  const [selectedTargets, setSelectedTargets] = useState<Record<number, number>>({})
  const [mergeHistory, setMergeHistory] = useState<MergeHistoryItem[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'with_dossier' | 'with_suggestion'>('all')

  // Manual Merge tab state
  const [manualSourceId, setManualSourceId] = useState<number | null>(null)
  const [manualTargetId, setManualTargetId] = useState<number | null>(null)
  const [manualSourceSearch, setManualSourceSearch] = useState('')
  const [manualTargetSearch, setManualTargetSearch] = useState('')

  // Load all necessary data
  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch all TANIM_Firma
      const firmRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT * FROM TANIM_Firma ORDER BY unvan ASC'
      )
      if (!firmRes.success) throw new Error(firmRes.error)
      const firms = firmRes.data || []
      setAllFirms(firms)

      // 2. Fetch usage stats from DATA_TeminFirma
      const usageRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT
          df.firma_id,
          COUNT(DISTINCT df.temin_dosya_id) as dosya_sayisi,
          SUM(COALESCE(df.teklif_toplami, 0)) as toplam_teklif,
          SUM(CASE WHEN df.kazandi_mi = 1 OR df.kazanan_mi = 1 THEN 1 ELSE 0 END) as kazandi_sayisi
        FROM DATA_TeminFirma df
        GROUP BY df.firma_id`
      )
      const usageMap: Record<number, StubFirmUsage> = {}
      if (usageRes.success && usageRes.data) {
        for (const row of usageRes.data) {
          usageMap[row.firma_id] = {
            firma_id: row.firma_id,
            dosya_sayisi: Number(row.dosya_sayisi) || 0,
            toplam_teklif: Number(row.toplam_teklif) || 0,
            kazandi_sayisi: Number(row.kazandi_sayisi) || 0
          }
        }
      }
      setUsages(usageMap)
    } catch (err: any) {
      console.error('Firma yükleme hatası:', err)
      setFeedback({ type: 'error', message: 'Veriler yüklenirken hata oluştu: ' + (err.message || err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
      setFeedback(null)
    }
  }, [isOpen])

  // Split into master firms and stub firms
  const masterFirms = useMemo(() => {
    return allFirms.filter(
      (f) => f.firma_kodu && String(f.firma_kodu).trim() !== '' && String(f.firma_kodu).trim() !== '0000'
    )
  }, [allFirms])

  const stubFirms = useMemo(() => {
    return allFirms.filter(
      (f) => !f.firma_kodu || String(f.firma_kodu).trim() === '' || String(f.firma_kodu).trim() === '0000'
    )
  }, [allFirms])

  // Calculate suggestions for stub firms
  const stubItems = useMemo(() => {
    return stubFirms.map((stub) => {
      let bestMatch: MatchResult | null = null
      let highestScore = 0

      for (const master of masterFirms) {
        if (master.id === stub.id) continue
        const res = calculateMatchScore(stub, master)
        if (res.score > highestScore) {
          highestScore = res.score
          bestMatch = { masterFirma: master, score: res.score, reason: res.reason }
        }
      }

      const usage = usages[stub.id] || { firma_id: stub.id, dosya_sayisi: 0, toplam_teklif: 0, kazandi_sayisi: 0 }
      return {
        stub,
        usage,
        bestMatch
      }
    })
  }, [stubFirms, masterFirms, usages])

  // Initialize selected targets with best suggestions
  useEffect(() => {
    const initialTargets: Record<number, number> = {}
    for (const item of stubItems) {
      if (item.bestMatch?.masterFirma?.id) {
        initialTargets[item.stub.id] = item.bestMatch.masterFirma.id
      }
    }
    setSelectedTargets((prev) => ({ ...initialTargets, ...prev }))
  }, [stubItems])

  // Load attached dossiers when expanded
  const toggleDossierExpansion = async (stubId: number) => {
    if (expandedStubId === stubId) {
      setExpandedStubId(null)
      return
    }
    setExpandedStubId(stubId)
    if (!expandedDossiers[stubId]) {
      try {
        const res = await window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT
            d.id as dosya_id,
            d.temin_no,
            d.konu,
            d.tur,
            d.status,
            d.temin_tarihi,
            df.teklif_toplami,
            df.kazandi_mi
          FROM DATA_TeminFirma df
          JOIN DATA_TeminDosyasi d ON df.temin_dosya_id = d.id
          WHERE df.firma_id = ? AND d.is_deleted = 0
          ORDER BY d.id DESC`,
          [stubId]
        )
        if (res.success) {
          setExpandedDossiers((prev) => ({ ...prev, [stubId]: res.data || [] }))
        }
      } catch (err) {
        console.error('Dosya detayları yüklenemedi:', err)
      }
    }
  }

  // Filtered stub items
  const filteredStubItems = useMemo(() => {
    return stubItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.stub.unvan?.toLowerCase().includes(q)
        const matchPhone = item.stub.telefon?.includes(q)
        const matchVkn = item.stub.vergi_no?.includes(q)
        const matchTarget = item.bestMatch?.masterFirma?.unvan?.toLowerCase().includes(q)
        if (!matchTitle && !matchPhone && !matchVkn && !matchTarget) return false
      }

      // Filter pill
      if (filterType === 'with_dossier' && item.usage.dosya_sayisi === 0) return false
      if (filterType === 'with_suggestion' && (!item.bestMatch || item.bestMatch.score < 70)) return false

      return true
    })
  }, [stubItems, searchQuery, filterType])

  // Execute Merge
  const executeMerge = async (stubId: number, targetMasterId: number, stubObj?: any) => {
    const stub = stubObj || allFirms.find((f) => f.id === stubId)
    const master = masterFirms.find((m) => m.id === targetMasterId) || allFirms.find((m) => m.id === targetMasterId)

    if (!stub || !master) {
      setFeedback({ type: 'error', message: 'Geçerli bir kaynak ve hedef firma bulunamadı.' })
      return
    }

    if (stub.id === master.id) {
      setFeedback({ type: 'error', message: 'Bir firma kendisiyle birleştirilemez.' })
      return
    }

    setActionInProgress(stub.id)
    try {
      // 1. Detect existing tables in database
      const tablesRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      const existingTables = new Set((tablesRes.data || []).map((r: any) => r.name))

      const txQueries: { sql: string; params: any[] }[] = []

      // 2. DATA_TeminFirma update
      if (existingTables.has('DATA_TeminFirma')) {
        txQueries.push({
          sql: `UPDATE DATA_TeminFirma
                SET firma_id = ?,
                    unvan = COALESCE(NULLIF(?, ''), unvan),
                    vergi_no = COALESCE(NULLIF(?, ''), vergi_no)
                WHERE firma_id = ?`,
          params: [master.id, master.unvan, master.vergi_no || null, stub.id]
        })
      }

      // 3. DATA_TeminDosyasi (kazanan yüklenici firma_id)
      if (existingTables.has('DATA_TeminDosyasi')) {
        txQueries.push({
          sql: `UPDATE DATA_TeminDosyasi SET firma_id = ? WHERE firma_id = ?`,
          params: [master.id, stub.id]
        })
      }

      // 4. TANIM_FirmaIletisimNotu (not aktarımı)
      if (existingTables.has('TANIM_FirmaIletisimNotu')) {
        txQueries.push({
          sql: `UPDATE TANIM_FirmaIletisimNotu SET firma_id = ? WHERE firma_id = ?`,
          params: [master.id, stub.id]
        })
      }

      // 5. DATA_IhaleFirma (ihale katılımı)
      if (existingTables.has('DATA_IhaleFirma')) {
        txQueries.push({
          sql: `UPDATE DATA_IhaleFirma
                SET firma_id = ?,
                    unvan = COALESCE(NULLIF(?, ''), unvan),
                    vergi_no = COALESCE(NULLIF(?, ''), vergi_no)
                WHERE firma_id = ?`,
          params: [master.id, master.unvan, master.vergi_no || null, stub.id]
        })
      }

      // 6. DATA_IhaleDosyasi (ihale kazanan)
      if (existingTables.has('DATA_IhaleDosyasi')) {
        txQueries.push({
          sql: `UPDATE DATA_IhaleDosyasi SET firma_id = ? WHERE firma_id = ?`,
          params: [master.id, stub.id]
        })
      }

      // 7. Hedef Ana Firmayı eksik iletişim bilgileriyle zenginleştir
      txQueries.push({
        sql: `UPDATE TANIM_Firma
              SET telefon = CASE WHEN (telefon IS NULL OR TRIM(telefon) = '') THEN ? ELSE telefon END,
                  email = CASE WHEN (email IS NULL OR TRIM(email) = '') THEN ? ELSE email END,
                  adres = CASE WHEN (adres IS NULL OR TRIM(adres) = '') THEN ? ELSE adres END,
                  il = CASE WHEN (il IS NULL OR TRIM(il) = '') THEN ? ELSE il END,
                  ilce = CASE WHEN (ilce IS NULL OR TRIM(ilce) = '') THEN ? ELSE ilce END
              WHERE id = ?`,
        params: [
          stub.telefon || null,
          stub.email || null,
          stub.adres || null,
          stub.il || null,
          stub.ilce || null,
          master.id
        ]
      })

      // 8. Silinecek taslak firma
      txQueries.push({
        sql: `DELETE FROM TANIM_Firma WHERE id = ?`,
        params: [stub.id]
      })

      const txResult = await window.electron.ipcRenderer.invoke('db:transaction', txQueries)
      if (!txResult.success) {
        throw new Error(txResult.error || 'İşlem transaction sırasında başarısız oldu')
      }

      // Success! Update local state & react query
      const dosyaCount = usages[stub.id]?.dosya_sayisi || 0
      setMergeHistory((prev) => [
        {
          id: `${stub.id}-${master.id}-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          stubName: stub.unvan,
          stubId: stub.id,
          masterName: master.unvan,
          masterCode: master.firma_kodu || `#${master.id}`,
          masterId: master.id,
          dosyaCount
        },
        ...prev
      ])

      setFeedback({
        type: 'success',
        message: `✔ "${stub.unvan}" (ID: #${stub.id}) başarıyla "${master.firma_kodu || ''} ${master.unvan}" (ID: #${master.id}) ile birleştirildi. ${dosyaCount} adet doğrudan temin dosyası bağlandı.`
      })

      queryClient.invalidateQueries({ queryKey: ['firmalar'] })
      queryClient.invalidateQueries({ queryKey: ['temin_firmalari'] })
      if (onSuccess) onSuccess()

      // Reload fresh data
      await loadData()
    } catch (err: any) {
      console.error('Birleştirme hatası:', err)
      setFeedback({ type: 'error', message: 'Birleştirme işlemi başarısız: ' + (err.message || err) })
    } finally {
      setActionInProgress(null)
    }
  }

  // Assign Sequential Code to Genuine Independent Firm
  const assignCodeToStub = async (stubId: number) => {
    const stub = allFirms.find((f) => f.id === stubId)
    if (!stub) return

    setActionInProgress(stubId)
    try {
      const codeRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT firma_kodu FROM TANIM_Firma WHERE firma_kodu GLOB '[0-9][0-9][0-9][0-9]' ORDER BY CAST(firma_kodu AS INTEGER) DESC LIMIT 1`
      )
      let nextNum = 1
      if (codeRes.success && codeRes.data?.length > 0) {
        nextNum = parseInt(codeRes.data[0].firma_kodu, 10) + 1
      }
      const nextCode = String(nextNum).padStart(4, '0')

      const updRes = await window.electron.ipcRenderer.invoke(
        'db:query',
        'UPDATE TANIM_Firma SET firma_kodu = ? WHERE id = ?',
        [nextCode, stubId]
      )
      if (!updRes.success) throw new Error(updRes.error)

      setFeedback({
        type: 'success',
        message: `✔ "${stub.unvan}" bağımsız firma olarak tescillendi ve yeni firma kodu "${nextCode}" olarak atandı.`
      })

      queryClient.invalidateQueries({ queryKey: ['firmalar'] })
      if (onSuccess) onSuccess()
      await loadData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Kod atama hatası: ' + (err.message || err) })
    } finally {
      setActionInProgress(null)
    }
  }

  // Delete Unused Stub
  const deleteStub = async (stubId: number) => {
    const stub = allFirms.find((f) => f.id === stubId)
    if (!stub) return
    const usage = usages[stubId]
    if (usage && usage.dosya_sayisi > 0) {
      if (!confirm(`Bu firmaya ait ${usage.dosya_sayisi} adet doğrudan temin dosyası bulunmaktadır. Silmek yerine ana havuzdaki bir firmayla birleştirmeniz önerilir. Yine de silmek istiyor musunuz?`)) {
        return
      }
    } else {
      if (!confirm(`"${stub.unvan}" taslak firmasını kalıcı olarak silmek istiyor musunuz?`)) {
        return
      }
    }

    setActionInProgress(stubId)
    try {
      const delRes = await window.electron.ipcRenderer.invoke('db:query', 'DELETE FROM TANIM_Firma WHERE id = ?', [stubId])
      if (!delRes.success) throw new Error(delRes.error)

      setFeedback({ type: 'info', message: `"${stub.unvan}" kaydı sistemden silindi.` })
      queryClient.invalidateQueries({ queryKey: ['firmalar'] })
      if (onSuccess) onSuccess()
      await loadData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Silme hatası: ' + (err.message || err) })
    } finally {
      setActionInProgress(null)
    }
  }

  // Batch Auto-Merge
  const handleBatchMerge = async () => {
    const highConfidenceItems = stubItems.filter(
      (item) => item.bestMatch && item.bestMatch.score >= 80 && item.bestMatch.masterFirma
    )

    if (highConfidenceItems.length === 0) {
      alert('Yüksek güvenilirlikte (%80 ve üzeri) otomatik birleştirilebilecek firma bulunamadı.')
      return
    }

    if (
      !confirm(
        `Yüksek güvenilirlikli (${highConfidenceItems.length} adet) firma ana havuzdaki karşılıkları ile otomatik olarak birleştirilecektir.\n\nDevam etmek istiyor musunuz?`
      )
    ) {
      return
    }

    setLoading(true)
    let successCount = 0
    for (const item of highConfidenceItems) {
      try {
        await executeMerge(item.stub.id, item.bestMatch!.masterFirma.id, item.stub)
        successCount++
      } catch (err) {
        console.error('Toplu eşleştirme eleman hatası:', err)
      }
    }
    setLoading(false)
    setFeedback({
      type: 'success',
      message: `🎉 Toplu birleştirme tamamlandı! ${successCount} adet taslak firma ana havuza başarıyla aktarıldı.`
    })
  }

  // Summary counts
  const totalStubs = stubFirms.length
  const totalMaster = masterFirms.length
  const totalAffectedDossiers = useMemo(() => {
    return Object.values(usages).reduce((acc, curr) => acc + curr.dosya_sayisi, 0)
  }, [usages])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Firma ve Doğrudan Temin Eşleştirme & Birleştirme Merkezi"
      description="Doğrudan temin dosyalarından gelen veya kodu eksik taslak firmaları, ilişkisel ID (TANIM_Firma.id) üzerinden ana firma havuzuyla birleştirin."
      className="max-w-6xl w-full max-h-[92vh] flex flex-col p-0"
      contentClassName="p-0 overflow-hidden flex flex-col flex-1"
    >
      {/* ÜST STAT ŞERİDİ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Eşleşme Bekleyen</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {totalStubs} Taslak Firma
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Etkilenen Dosyalar</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {totalAffectedDossiers} Temin Dosyası
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ana Havuz</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {totalMaster} Kayıtlı Firma
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Oturumda Birleştirilen</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            {mergeHistory.length} Firma Çözüldü
          </div>
        </div>
      </div>

      {/* FEEDBACK BİLDİRİMİ */}
      {feedback && (
        <div
          className={cn(
            'px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b animate-in fade-in duration-200 shrink-0',
            feedback.type === 'success' && 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
            feedback.type === 'error' && 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
            feedback.type === 'info' && 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            {feedback.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100 ml-4 underline cursor-pointer"
          >
            Kapat
          </button>
        </div>
      )}

      {/* SEKME BAŞLIKLARI VE ARAÇ ÇUBUĞU */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stubs')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'stubs'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Taslak Firmalar & Öneriler ({stubFirms.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            Serbest / Manuel Birleştirme
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            )}
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            İşlem Geçmişi ({mergeHistory.length})
          </button>
        </div>

        {activeTab === 'stubs' && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBatchMerge}
              disabled={loading || stubFirms.length === 0}
              variant="outline"
              className="h-8 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              ⚡ Yüksek Güvenilirliklileri Birleştir
            </Button>
            <Button
              onClick={loadData}
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1', loading && 'animate-spin')} />
              Yenile
            </Button>
          </div>
        )}
      </div>

      {/* İÇERİK ALANI */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-950/20">
        {activeTab === 'stubs' && (
          <div className="space-y-4">
            {/* Arama ve Filtre Şeridi */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Taslak veya hedef firma ara..."
                  className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                    filterType === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  Tümü ({stubItems.length})
                </button>
                <button
                  onClick={() => setFilterType('with_dossier')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                    filterType === 'with_dossier'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <FileText className="w-3 h-3" />
                  Dosyası Olanlar ({stubItems.filter((i) => i.usage.dosya_sayisi > 0).length})
                </button>
                <button
                  onClick={() => setFilterType('with_suggestion')}
                  className={cn(
                    'px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                    filterType === 'with_suggestion'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Önerisi Hazır ({stubItems.filter((i) => i.bestMatch && i.bestMatch.score >= 70).length})
                </button>
              </div>
            </div>

            {/* FİRMA KARTLARI LİSTESİ */}
            {filteredStubItems.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Tebrikler! Eşleştirme Bekleyen Taslak Firma Bulunmuyor
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Sistemdeki tüm doğrudan temin teklifleri ve firma kayıtları resmi ID ile ana firma havuzuna
                  bağlanmıştır.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStubItems.map(({ stub, usage, bestMatch }) => {
                  const targetMasterId = selectedTargets[stub.id] || bestMatch?.masterFirma?.id || null
                  const selectedMaster = masterFirms.find((m) => m.id === targetMasterId)
                  const isProcessing = actionInProgress === stub.id
                  const isExpanded = expandedStubId === stub.id
                  const attachedList = expandedDossiers[stub.id] || []

                  return (
                    <div
                      key={stub.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Kart Ana Gövdesi (Sol: Kaynak / Orta: Ok & Neden / Sağ: Hedef Seçici) */}
                      <div className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                        {/* SOL: TASLAK KAYNAK FİRMA */}
                        <div className="flex-1 min-w-[280px]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Taslak ID: #{stub.id}
                            </span>
                            {usage.dosya_sayisi > 0 ? (
                              <button
                                onClick={() => toggleDossierExpansion(stub.id)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                {usage.dosya_sayisi} Doğrudan Temin Dosyası ({formatCurrency(usage.toplam_teklif)})
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium italic">
                                Bağlı dosya yok (0 teklif)
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {stub.unvan}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {stub.telefon && (
                              <span className="flex items-center gap-1">
                                📞 <span className="font-mono">{stub.telefon}</span>
                              </span>
                            )}
                            {stub.vergi_no && (
                              <span className="flex items-center gap-1">
                                🏢 VN: <span className="font-mono">{stub.vergi_no}</span>
                              </span>
                            )}
                            {stub.il && (
                              <span className="text-slate-400">
                                📍 {stub.ilce ? `${stub.ilce} / ` : ''}
                                {stub.il}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ORTA: EŞLEŞTİRME BAĞLANTISI VE BENZERLİK GÖSTERGESİ */}
                        <div className="flex flex-col items-center justify-center shrink-0 px-2 py-1">
                          {bestMatch && bestMatch.score > 0 ? (
                            <div className="flex flex-col items-center text-center">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold border mb-1 flex items-center gap-1',
                                  bestMatch.score >= 90
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                                )}
                              >
                                <Sparkles className="w-3 h-3" />%{bestMatch.score} Uyum
                              </span>
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="text-[10px] max-w-[130px] truncate" title={bestMatch.reason}>
                                  {bestMatch.reason}
                                </span>
                                <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="text-[10px] italic">Eşleştir</span>
                              <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                            </div>
                          )}
                        </div>

                        {/* SAĞ: HEDEF ANA HAVUZ FİRMASI SEÇİCİ */}
                        <div className="flex-1 min-w-[300px]">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Hedef Ana Havuz Firması (ID Eşleştirmesi)
                          </label>
                          <select
                            value={targetMasterId || ''}
                            onChange={(e) =>
                              setSelectedTargets((prev) => ({
                                ...prev,
                                [stub.id]: Number(e.target.value)
                              }))
                            }
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Bir Ana Firma Seçin --</option>
                            {masterFirms.map((m) => (
                              <option key={m.id} value={m.id}>
                                [{m.firma_kodu}] {m.unvan} (ID: #{m.id}
                                {m.vergi_no ? ` | VN: ${m.vergi_no}` : ''}
                                {m.telefon ? ` | 📞 ${m.telefon}` : ''})
                              </option>
                            ))}
                          </select>

                          {selectedMaster && (
                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                Kod: {selectedMaster.firma_kodu} (ID: #{selectedMaster.id})
                              </span>
                              <span>
                                {selectedMaster.il ? `📍 ${selectedMaster.il}` : ''}
                                {selectedMaster.vergi_no ? ` • VN: ${selectedMaster.vergi_no}` : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* BUTONLAR */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                          <Button
                            onClick={() => executeMerge(stub.id, targetMasterId!)}
                            disabled={!targetMasterId || isProcessing}
                            className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {isProcessing ? 'Aktarılıyor...' : 'Birleştir'}
                          </Button>

                          <Button
                            onClick={() => assignCodeToStub(stub.id)}
                            disabled={isProcessing}
                            variant="outline"
                            title="Bu firmayı ana havuza bağımsız yeni bir firma olarak ekle ve yeni bir kod ata"
                            className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                          >
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                            Kod Ata
                          </Button>

                          <Button
                            onClick={() => deleteStub(stub.id)}
                            disabled={isProcessing}
                            variant="ghost"
                            size="sm"
                            title="Taslağı Sil"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* AÇILIR DOSYA DETAYLARI LİSTESİ */}
                      {isExpanded && (
                        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 animate-in fade-in duration-200">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Bu Firmanın Yer Aldığı Doğrudan Temin Dosyaları:
                          </div>

                          {attachedList.length === 0 ? (
                            <div className="text-xs text-slate-400 italic">Dosya kayıtları aranıyor...</div>
                          ) : (
                            <div className="space-y-1.5">
                              {attachedList.map((d) => (
                                <div
                                  key={d.dosya_id}
                                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                                      #{d.temin_no || d.dosya_id}
                                    </span>
                                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                      {d.konu}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      {formatCurrency(d.teklif_toplami)}
                                    </span>
                                    {d.kazandi_mi === 1 ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        🏆 Kazanan Yüklenici
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                        Teklif Verdi
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
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
        )}

        {/* TAB 2: MANUEL / SERBEST BİRLEŞTİRME */}
        {activeTab === 'manual' && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                İki Firmayı Birbirine Aktar ve Birleştir
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Herhangi iki firmayı seçin. Kaynak firmanın tüm doğrudan temin teklifleri, sözleşmeleri ve kazanan
                durumları hedef firmanın kimliğine (TANIM_Firma.id) aktarılır ve kaynak firma silinir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kaynak Firma Seçici */}
              <div className="space-y-2 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  1. Kaynak Firma (Silinecek & Aktarılacak)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={manualSourceSearch}
                    onChange={(e) => setManualSourceSearch(e.target.value)}
                    placeholder="Kaynak firma filtrele..."
                    className="pl-8 h-7 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
                <select
                  size={8}
                  value={manualSourceId || ''}
                  onChange={(e) => setManualSourceId(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {allFirms
                    .filter((f) => !manualSourceSearch || f.unvan?.toLowerCase().includes(manualSourceSearch.toLowerCase()))
                    .map((f) => (
                      <option key={f.id} value={f.id} className="py-1">
                        {f.firma_kodu ? `[${f.firma_kodu}] ` : '[Taslak] '}
                        {f.unvan} (ID: #{f.id})
                      </option>
                    ))}
                </select>
                {manualSourceId && (
                  <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Seçilen: {allFirms.find((f) => f.id === manualSourceId)?.unvan} (ID: #{manualSourceId})
                  </div>
                )}
              </div>

              {/* Hedef Firma Seçici */}
              <div className="space-y-2 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/20">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                  2. Hedef Firma (Devralacak Ana Firma)
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={manualTargetSearch}
                    onChange={(e) => setManualTargetSearch(e.target.value)}
                    placeholder="Hedef firma filtrele..."
                    className="pl-8 h-7 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
                <select
                  size={8}
                  value={manualTargetId || ''}
                  onChange={(e) => setManualTargetId(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {allFirms
                    .filter((f) => !manualTargetSearch || f.unvan?.toLowerCase().includes(manualTargetSearch.toLowerCase()))
                    .map((f) => (
                      <option key={f.id} value={f.id} className="py-1">
                        {f.firma_kodu ? `[${f.firma_kodu}] ` : '[Taslak] '}
                        {f.unvan} (ID: #{f.id})
                      </option>
                    ))}
                </select>
                {manualTargetId && (
                  <div className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                    Seçilen: {allFirms.find((f) => f.id === manualTargetId)?.unvan} (ID: #{manualTargetId})
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => {
                  if (manualSourceId && manualTargetId) {
                    if (confirm('Kaynak firmanın tüm teklif ve dosya ilişkileri hedef firmaya aktarılacak ve kaynak firma silinecektir. Onaylıyor musunuz?')) {
                      executeMerge(manualSourceId, manualTargetId)
                    }
                  }
                }}
                disabled={!manualSourceId || !manualTargetId || manualSourceId === manualTargetId || loading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2"
              >
                <Sparkles className="w-4 h-4" />
                İki Firmayı Şimdi Birleştir
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: OTURUM İŞLEM GEÇMİŞİ */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Bu Oturumda Gerçekleştirilen Birleştirmeler
            </h3>

            {mergeHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Bu oturumda henüz bir birleştirme işlemi yapılmadı.
              </div>
            ) : (
              <div className="space-y-2">
                {mergeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 text-[11px]">{item.timestamp}</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400 line-through">
                        {item.stubName} (#{item.stubId})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        [{item.masterCode}] {item.masterName} (#{item.masterId})
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[11px]">
                      {item.dosyaCount} Dosya Aktarıldı
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500">
          İşlemler doğrudan SQLite veritabanı üzerinde atomik transaction ile gerçekleştirilir.
        </span>
        <Button onClick={onClose} variant="outline" className="text-xs">
          Kapat
        </Button>
      </div>
    </Modal>
  )
}

