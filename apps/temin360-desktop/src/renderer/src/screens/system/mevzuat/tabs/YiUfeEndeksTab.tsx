import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { AY_ISIMLERI, YearEndeksGroup, yiUfeService } from '../../../../services/yiUfeService'
import { useWorkspaceStore } from '../../../../store/workspaceStore'
import { useDosyalarHooks } from '../../../dosyalar/dosyalar.hooks'
import { YiUfeHeroCard } from './components/yi-ufe/YiUfeHeroCard'
import { YiUfeSimulatorCard } from './components/yi-ufe/YiUfeSimulatorCard'
import { YiUfeMatrixTable } from './components/yi-ufe/YiUfeMatrixTable'
import { YiUfeAddEditModal } from './components/yi-ufe/YiUfeAddEditModal'

export function YiUfeEndeksTab(): React.JSX.Element {
  const [dataVersion, setDataVersion] = useState(0)
  const [yearGroups, setYearGroups] = useState<YearEndeksGroup[]>([])
  const [searchYear, setSearchYear] = useState('')
  const [selectedDecade, setSelectedDecade] = useState<
    'ALL' | '2020s' | '2010s' | '2000s' | '1990s'
  >('ALL')

  // Aktif Dosya ve Varsayılan Yıl Entegrasyonu
  const { activeDosyaId } = useWorkspaceStore()
  const { dosyalar } = useDosyalarHooks()
  const activeDosya = useMemo(
    () => (activeDosyaId ? dosyalar.find((d) => d.id === activeDosyaId) : undefined),
    [dosyalar, activeDosyaId]
  )

  const currentYear = useMemo(() => new Date().getFullYear(), [])

  // Aktif dosya açıksa dosyanın bütçe yılı / açılış yılı, değilse cari takvim yılı
  const defaultBaseYear = useMemo(() => {
    if (activeDosya?.butce_yili) {
      return Number(activeDosya.butce_yili)
    }
    if (activeDosya?.dosya_acilis_tarihi) {
      const parsed = new Date(activeDosya.dosya_acilis_tarihi).getFullYear()
      if (!isNaN(parsed) && parsed > 1990) return parsed
    }
    if (activeDosya?.temin_tarihi) {
      const parsed = new Date(activeDosya.temin_tarihi).getFullYear()
      if (!isNaN(parsed) && parsed > 1990) return parsed
    }
    return currentYear
  }, [activeDosya, currentYear])

  const defaultBaseMonth = useMemo(() => {
    if (activeDosya?.dosya_acilis_tarihi) {
      const m = new Date(activeDosya.dosya_acilis_tarihi).getMonth() + 1
      if (!isNaN(m) && m >= 1 && m <= 12) return m
    }
    if (activeDosya?.temin_tarihi) {
      const m = new Date(activeDosya.temin_tarihi).getMonth() + 1
      if (!isNaN(m) && m >= 1 && m <= 12) return m
    }
    return 1
  }, [activeDosya])

  // Modal Durumları
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalYil, setModalYil] = useState(2026)
  const [modalAy, setModalAy] = useState(9)
  const [modalEndeks, setModalEndeks] = useState('')
  const [modalAciklama, setModalAciklama] = useState('')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Canlı Simülatör State
  const [simTutar, setSimTutar] = useState('100000')
  const [userBaseYil, setUserBaseYil] = useState<number | null>(null)
  const [userBaseAy, setUserBaseAy] = useState<number | null>(null)
  const simBaseYil = userBaseYil ?? defaultBaseYear
  const simBaseAy = userBaseAy ?? defaultBaseMonth
  const [simTargetYil, setSimTargetYil] = useState(currentYear)
  const [simTargetAy, setSimTargetAy] = useState(8)

  useEffect(() => {
    yiUfeService.loadFromDatabase().then(() => {
      setYearGroups(yiUfeService.getGroupedByYears())
    })

    const handleUpdate = () => {
      setYearGroups(yiUfeService.getGroupedByYears())
      setDataVersion((v) => v + 1)
    }

    window.addEventListener('yi-ufe-updated', handleUpdate)
    return () => window.removeEventListener('yi-ufe-updated', handleUpdate)
  }, [dataVersion])

  const latest = useMemo(() => {
    return yiUfeService.getLatest()
  }, [yearGroups])

  const yillikDegisim = useMemo(() => {
    const prevYearVal = yiUfeService.getIndex(latest.yil - 1, latest.ay)
    if (!prevYearVal || prevYearVal <= 0) return null
    return ((latest.endeks - prevYearVal) / prevYearVal) * 100
  }, [latest])

  const aylikDegisim = useMemo(() => {
    const prevAy = latest.ay === 1 ? 12 : latest.ay - 1
    const prevYil = latest.ay === 1 ? latest.yil - 1 : latest.yil
    const prevVal = yiUfeService.getIndex(prevYil, prevAy)
    if (!prevVal || prevVal <= 0) return null
    return ((latest.endeks - prevVal) / prevVal) * 100
  }, [latest])

  const simResult = useMemo(() => {
    const tutar = parseFloat(simTutar.replace(/\./g, '').replace(/,/g, '.')) || 0
    return yiUfeService.calculateAdjustment({
      basePrice: tutar,
      baseYear: simBaseYil,
      baseMonth: simBaseAy,
      targetYear: simTargetYil,
      targetMonth: simTargetAy
    })
  }, [simTutar, simBaseYil, simBaseAy, simTargetYil, simTargetAy, yearGroups])

  const filteredGroups = useMemo(() => {
    return yearGroups.filter((g) => {
      if (searchYear.trim() && !String(g.yil).includes(searchYear.trim())) {
        return false
      }
      if (selectedDecade === '2020s' && (g.yil < 2020 || g.yil > 2029)) return false
      if (selectedDecade === '2010s' && (g.yil < 2010 || g.yil > 2019)) return false
      if (selectedDecade === '2000s' && (g.yil < 2000 || g.yil > 2009)) return false
      if (selectedDecade === '1990s' && (g.yil < 1990 || g.yil > 1999)) return false
      return true
    })
  }, [yearGroups, searchYear, selectedDecade])

  const allYearOptions = useMemo(() => {
    const list = yearGroups.map((g) => g.yil)
    if (!list.includes(defaultBaseYear)) {
      list.push(defaultBaseYear)
    }
    if (!list.includes(currentYear)) {
      list.push(currentYear)
    }
    return Array.from(new Set(list)).sort((a, b) => b - a)
  }, [yearGroups, defaultBaseYear, currentYear])

  const openAddForMonth = (yil: number, ay: number, currentVal?: number | null) => {
    setModalYil(yil)
    setModalAy(ay)
    setModalEndeks(currentVal ? currentVal.toString().replace('.', ',') : '')
    setModalAciklama('')
    setShowAddModal(true)
  }

  const handleSaveEndeks = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(modalEndeks.replace(/\./g, '').replace(/,/g, '.'))
    if (isNaN(num) || num <= 0) {
      alert('Lütfen geçerli bir endeks değeri giriniz.')
      return
    }

    await yiUfeService.saveOrUpdateEndeks(modalYil, modalAy, num, modalAciklama)
    setYearGroups(yiUfeService.getGroupedByYears())
    setShowAddModal(false)
    setSaveSuccessMsg(
      `${modalYil} ${AY_ISIMLERI[modalAy - 1]} Yİ-ÜFE endeksi başarıyla kaydedildi: ${modalEndeks}`
    )
    setTimeout(() => setSaveSuccessMsg(null), 3500)
  }

  const openHakedisOrg = () => {
    const url = 'https://www.hakedis.org/endeksler/yi-ufe-yurtici-uretici-fiyat-endeksi'
    if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('open-external-url', url)
    } else {
      window.open(url, '_blank')
    }
  }

  const formatNumber = (val: number | null | undefined, digits = 2) => {
    if (val === null || val === undefined || isNaN(val)) return '-'
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(val)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      {/* 1. HERO KARTI VE TEMEL İSTATİSTİKLER */}
      <YiUfeHeroCard
        latest={latest}
        aylikDegisim={aylikDegisim}
        yillikDegisim={yillikDegisim}
        formatNumber={formatNumber}
        onOpenAddForMonth={() => openAddForMonth(2026, latest.ay < 12 ? latest.ay + 1 : 12)}
        onOpenHakedisOrg={openHakedisOrg}
      />

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. CANLI Yİ-ÜFE FİYAT GÜNCELLEME & ESLEME HESAPLAYICI (SİMÜLATÖR) */}
      <YiUfeSimulatorCard
        simTutar={simTutar}
        setSimTutar={setSimTutar}
        simBaseYil={simBaseYil}
        setUserBaseYil={setUserBaseYil}
        simBaseAy={simBaseAy}
        setUserBaseAy={setUserBaseAy}
        defaultBaseYear={defaultBaseYear}
        activeDosya={activeDosya}
        simTargetYil={simTargetYil}
        setSimTargetYil={setSimTargetYil}
        simTargetAy={simTargetAy}
        setSimTargetAy={setSimTargetAy}
        allYearOptions={allYearOptions}
        simResult={simResult}
        formatNumber={formatNumber}
      />

      {/* 3. YILLARA GÖRE AYLIK Yİ-ÜFE MATRİS TABLOSU (1994 - 2026) */}
      <YiUfeMatrixTable
        filteredGroups={filteredGroups}
        selectedDecade={selectedDecade}
        setSelectedDecade={setSelectedDecade}
        searchYear={searchYear}
        setSearchYear={setSearchYear}
        onOpenAddForMonth={openAddForMonth}
        formatNumber={formatNumber}
      />

      {/* 4. YENİ AY / ENDEKS GİRİŞ & DÜZENLEME MODALI */}
      <YiUfeAddEditModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        modalYil={modalYil}
        setModalYil={setModalYil}
        modalAy={modalAy}
        setModalAy={setModalAy}
        modalEndeks={modalEndeks}
        setModalEndeks={setModalEndeks}
        modalAciklama={modalAciklama}
        setModalAciklama={setModalAciklama}
        onSave={handleSaveEndeks}
      />
    </div>
  )
}
