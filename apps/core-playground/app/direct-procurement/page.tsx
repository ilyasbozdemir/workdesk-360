'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Boxes,
  Play,
  Layers,
  Sparkles,
  Printer,
  ShieldCheck,
  FileCheck2,
  Share2,
  Workflow,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FolderOpen,
  FileArchive,
  Upload,
  FilePlus,
  Plus,
  Building2,
  ShoppingBag,
  Receipt,
  FileText,
  Award,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Database,
  Paperclip,
  Check,
} from 'lucide-react'
import {
  testDirectProcurementArchitectureAction,
  fetchPlaygroundFilesAction,
  createPlaygroundFileAction,
  fetchPlaygroundFileAggregateAction,
  addPlaygroundItemAction,
  addPlaygroundOfferAction,
  updatePlaygroundStageAction,
  compilePlaygroundTemplateAction,
  loadPresetTeminPackageAction,
  uploadAndInspectTeminPackageAction,
  type TeminPackageInspectionResult,
  type PlaygroundProcurementFileAggregate,
} from '@/app/actions'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { StatusBadge } from '@/components/playground/StatusBadge'

interface ArchitectureTestCard {
  id: any
  title: string
  category: string
  description: string
  icon: React.ReactNode
  badge: string
}

const ARCHITECTURE_TESTS: ArchitectureTestCard[] = [
  {
    id: 'domain-entity',
    title: '1. Domain Entities & Aggregate Roots',
    category: 'Domain Layer',
    description: 'ProcurementFile nesnesi, aşama kontrolleri, yaklaşık maliyet ve iş kuralları.',
    icon: <Boxes className="w-5 h-5 text-indigo-500" />,
    badge: 'Saf Domain',
  },
  {
    id: 'repository-contract',
    title: '2. SQLite Repository Sözleşmeleri',
    category: 'Persistence Layer',
    description: 'IProcurementFileRepository ve somut SqliteProcurementFileRepository veri tabanı işlemleri.',
    icon: <Layers className="w-5 h-5 text-blue-500" />,
    badge: 'SQLite',
  },
  {
    id: 'application-service',
    title: '3. Uygulama Servisleri (Services)',
    category: 'Application Layer',
    description: 'ProcurementFileService ile Result<T, AppError> pattern altında koordinasyon.',
    icon: <Workflow className="w-5 h-5 text-cyan-500" />,
    badge: 'Result Pattern',
  },
  {
    id: 'presentation-mappers',
    title: '4. DTO -> 2 Mapper -> 2 ViewModel',
    category: 'Presentation Layer',
    description: 'Tek bir DTO üzerinden Liste Ekranı (4 alan) ve Detay Ekranı görünümü.',
    icon: <Share2 className="w-5 h-5 text-emerald-500" />,
    badge: 'Dual Mapper',
  },
  {
    id: 'printer-service',
    title: '5. Yazıcı Listeleme ve Baskı Servisi',
    category: 'DB Harici Servisler',
    description: 'PrinterService ile sistem yazıcılarını listeleme ve HTML belge basımı.',
    icon: <Printer className="w-5 h-5 text-amber-500" />,
    badge: 'IPrinterPort',
  },
  {
    id: 'compliance-policy',
    title: '6. Mevzuat Uyumluluğu & Tebliğ 40666',
    category: 'Mevzuat Motoru',
    description: '4734 md. 22/d limit denetimi, Rol İzolasyonu ve Mal vs Hizmet kabul kuralları.',
    icon: <ShieldCheck className="w-5 h-5 text-rose-500" />,
    badge: 'Tebliğ 40666',
  },
  {
    id: 'document-export',
    title: '7. EKAP Kayıt Formu & Belge Dışa Aktarımı',
    category: 'Dış Entegrasyon',
    description: 'KİK Doğrudan Temin Kayıt Formu (KİK Ek-1) JSON payload üretimi.',
    icon: <FileCheck2 className="w-5 h-5 text-violet-500" />,
    badge: 'EKAP JSON',
  },
  {
    id: 'direct-procurement-facade',
    title: '8. En Üst Seviye Master Facade',
    category: 'Master Orchestration',
    description: 'DirectProcurementFacade: Tüm servisleri tek bir merkezden yöneten cephe.',
    icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
    badge: 'En Üst Servis',
  },
  {
    id: 'di-container',
    title: '9. IoC / Dependency Injection Konteyneri',
    category: 'Composition Root',
    description: 'DirectProcurementContainer: Tüm servislerin lazy-loading singleton çözümlenmesi.',
    icon: <Cpu className="w-5 h-5 text-purple-500" />,
    badge: 'DI Container',
  },
]

export default function DirectProcurementLaboratoryPage() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'workflow' | 'package'>('workflow')

  // Mimari Test State
  const [runningTest, setRunningTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  // Workflow State
  const [files, setFiles] = useState<any[]>([])
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [fileAggregate, setFileAggregate] = useState<PlaygroundProcurementFileAggregate | null>(null)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Yeni Dosya Form State
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileForm, setNewFileForm] = useState({
    konu: '',
    alim_turu: 'mal',
    yaklasik_maliyet: 75000,
    butce_yili: 2026,
    harcama_birimi: 'Destek Hizmetleri Dairesi Başkanlığı',
    madde: '4734 Sayılı Kanun Md. 22/d',
  })

  // Yeni Kalem Form State
  const [newItemForm, setNewItemForm] = useState({
    kalem_adi: '',
    miktar: 10,
    birim: 'Adet',
    birim_fiyat: 2500,
    kdv_orani: 20,
  })

  // Yeni Teklif Form State
  const [newOfferForm, setNewOfferForm] = useState({
    firma_adi: '',
    teklif_tutari: 22000,
    vergi_no: '1234567890',
  })

  // Şablon Derleme State
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('ihtiyac-listesi')
  const [compiledTemplateResult, setCompiledTemplateResult] = useState<any | null>(null)
  const [isCompilingTemplate, setIsCompilingTemplate] = useState(false)

  // .temin Paket İnceleme State
  const [inspectedPackage, setInspectedPackage] = useState<TeminPackageInspectionResult | null>(null)
  const [isLoadingPackage, setIsLoadingPackage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // İlk yüklemede dosyaları çek
  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setIsLoadingFiles(true)
    try {
      const rows = await fetchPlaygroundFilesAction()
      setFiles(rows)
      if (rows.length > 0 && !selectedFileId) {
        selectFile(rows[0].id)
      }
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const selectFile = async (id: number) => {
    setSelectedFileId(id)
    const agg = await fetchPlaygroundFileAggregateAction(id)
    setFileAggregate(agg)
    setCompiledTemplateResult(null)
  }

  // 1. Mimari Test Çalıştırıcı
  const handleRunTest = async (testId: string) => {
    setRunningTest(testId)
    try {
      const res = await testDirectProcurementArchitectureAction(testId as any)
      setTestResults((prev) => ({ ...prev, [testId]: res }))
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [testId]: { success: false, error: { message: err.message }, durationMs: 0 },
      }))
    } finally {
      setRunningTest(null)
    }
  }

  const handleRunAll = async () => {
    setRunningTest('all')
    try {
      const res = await testDirectProcurementArchitectureAction('all')
      setTestResults((prev) => ({ ...prev, all: res }))
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        all: { success: false, error: { message: err.message }, durationMs: 0 },
      }))
    } finally {
      setRunningTest(null)
    }
  }

  // 2. Yeni Dosya Aç
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileForm.konu.trim()) return
    setIsSubmitting(true)
    try {
      const res = await createPlaygroundFileAction(newFileForm)
      if (res.success && res.data?.id) {
        await loadFiles()
        await selectFile(res.data.id)
        setShowNewFileModal(false)
        setNewFileForm({
          konu: '',
          alim_turu: 'mal',
          yaklasik_maliyet: 75000,
          butce_yili: 2026,
          harcama_birimi: 'Destek Hizmetleri Dairesi Başkanlığı',
          madde: '4734 Sayılı Kanun Md. 22/d',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Kalem Ekle
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFileId || !newItemForm.kalem_adi.trim()) return
    setIsSubmitting(true)
    try {
      await addPlaygroundItemAction(selectedFileId, newItemForm)
      await selectFile(selectedFileId)
      setNewItemForm({
        kalem_adi: '',
        miktar: 10,
        birim: 'Adet',
        birim_fiyat: 2500,
        kdv_orani: 20,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. Teklif Ekle
  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFileId || !newOfferForm.firma_adi.trim()) return
    setIsSubmitting(true)
    try {
      await addPlaygroundOfferAction(selectedFileId, newOfferForm)
      await selectFile(selectedFileId)
      setNewOfferForm({
        firma_adi: '',
        teklif_tutari: 22000,
        vergi_no: '1234567890',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Aşama İlerlet
  const handleAdvanceStage = async (newStage: string) => {
    if (!selectedFileId) return
    setIsSubmitting(true)
    try {
      await updatePlaygroundStageAction(selectedFileId, newStage)
      await loadFiles()
      await selectFile(selectedFileId)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 6. Şablon Derle
  const handleCompileTemplate = async () => {
    if (!selectedFileId) return
    setIsCompilingTemplate(true)
    try {
      const res = await compilePlaygroundTemplateAction(selectedFileId, selectedTemplateKey)
      setCompiledTemplateResult(res)
    } finally {
      setIsCompilingTemplate(false)
    }
  }

  // 7. .temin Paketi Yükle / Aç
  const handleLoadPresetPackage = async () => {
    setIsLoadingPackage(true)
    try {
      const res = await loadPresetTeminPackageAction()
      if (res.success && res.data) {
        setInspectedPackage(res.data)
      }
    } finally {
      setIsLoadingPackage(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoadingPackage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadAndInspectTeminPackageAction(formData)
      if (res.success && res.data) {
        setInspectedPackage(res.data)
      }
    } finally {
      setIsLoadingPackage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Üst Başlık ve Sekme Navigasyonu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Doğrudan Temin 360 — Mimari & Test Laboratuvarı
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Canlı dosya oluşturma, ihtiyaç listesi, firma teklifleri, şablon derleme ve .temin arşiv paket yöneticisi
              </p>
            </div>
          </div>
        </div>

        {/* Ana Sekme Seçimi */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'workflow'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Canlı Dosya & Şablon Stüdyosu
          </button>
          <button
            onClick={() => setActiveTab('package')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'package'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            .temin Paket İnceleyici
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'architecture'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Mimari Katman Testleri (9)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKME 1: CANLI DOSYA & ŞABLON STÜDYOSU (Workflow Simulator)               */}
      {/* ========================================================================= */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {/* Dosya Seçim Çubuğu ve Yeni Dosya Butonu */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Kayıtlı Dosyalar ({files.length}):
              </span>
              {files.map((f) => (
                <button
                  key={f.id}
                  onClick={() => selectFile(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition flex items-center gap-2 ${
                    selectedFileId === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold">{f.dosya_no || f.temin_no || `#${f.id}`}</span>
                  <span className="truncate max-w-[120px]">{f.konu}</span>
                  <span className="text-[10px] opacity-75 uppercase">({f.durum || 'taslak'})</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNewFileModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition whitespace-nowrap"
            >
              <FilePlus className="w-4 h-4" />
              Yeni Dosya Aç
            </button>
          </div>

          {/* Yeni Dosya Oluşturma Modalı / Formu */}
          {showNewFileModal && (
            <div className="bg-indigo-50/50 dark:bg-slate-900/50 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-indigo-600" />
                  Yeni Doğrudan Temin Dosyası Aç (4734 Sayılı Kanun Md. 22)
                </h3>
                <button
                  onClick={() => setShowNewFileModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Vazgeç
                </button>
              </div>

              <form onSubmit={handleCreateFile} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Alım Konusu / İhtiyacın Tanımı
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Bilgisayar ve Donanım Malzemesi Alımı"
                    value={newFileForm.konu}
                    onChange={(e) => setNewFileForm({ ...newFileForm, konu: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Alım Türü
                  </label>
                  <select
                    value={newFileForm.alim_turu}
                    onChange={(e) => setNewFileForm({ ...newFileForm, alim_turu: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="mal">Mal Alımı (Teslim Tesellüm Esas)</option>
                    <option value="hizmet">Hizmet Alımı (Hizmet Kabul Tutanağı)</option>
                    <option value="yapim_isi">Yapım İşi (KİK048 Geçici Kabul)</option>
                    <option value="danismanlik">Danışmanlık Hizmeti</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Tahmini / Yaklaşık Maliyet (₺)
                  </label>
                  <input
                    type="number"
                    value={newFileForm.yaklasik_maliyet}
                    onChange={(e) =>
                      setNewFileForm({ ...newFileForm, yaklasik_maliyet: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Harcama Birimi
                  </label>
                  <input
                    type="text"
                    value={newFileForm.harcama_birimi}
                    onChange={(e) =>
                      setNewFileForm({ ...newFileForm, harcama_birimi: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Yasal Dayanak / Madde
                  </label>
                  <input
                    type="text"
                    value={newFileForm.madde}
                    onChange={(e) => setNewFileForm({ ...newFileForm, madde: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Açılıyor...' : 'Dosyayı Kaydet & Başlat'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Seçili Dosya Çalışma Masası */}
          {fileAggregate && (
            <div className="space-y-6">
              {/* Dosya Özet Başlığı ve Aşama İlerleme Barı */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md">
                        {fileAggregate.file.dosya_no || `Dosya #${fileAggregate.file.id}`}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded">
                        Tür: {fileAggregate.file.alim_turu || fileAggregate.file.tur || 'mal'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded uppercase">
                        {fileAggregate.file.durum || 'taslak'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {fileAggregate.file.konu}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Birim: {fileAggregate.file.harcama_birimi || 'Destek Hizmetleri'} | Dayanak: {fileAggregate.file.madde || 'Md. 22/d'}
                    </p>
                  </div>

                  {/* Aşama İlerletme Butonları */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdvanceStage('fiyat_arastirmasi')}
                      className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                    >
                      Piyasa Araştırmasına Geç
                    </button>
                    <button
                      onClick={() => handleAdvanceStage('onaylandi')}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Onay Belgesini İmzala
                    </button>
                    <button
                      onClick={() => handleAdvanceStage('tamamlandi')}
                      className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                    >
                      Kabul & Tamamla
                    </button>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Toplam Kalem</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {fileAggregate.stats.totalItems} Kalem
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Hesaplanan Yaklaşık Maliyet</div>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {fileAggregate.stats.calculatedTotal.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Alınan Teklif Sayısı</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {fileAggregate.offers.length} Firma
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">En Uygun Teklif</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {fileAggregate.stats.bestOffer
                        ? `${fileAggregate.stats.bestOffer.teklif_tutari.toLocaleString('tr-TR')} ₺`
                        : 'Teklif Yok'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alt Çalışma Alanı: 2 Kolon (Kalemler & Teklifler) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. İhtiyaç Kalemleri Tablosu & Kalem Ekleme Formu */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <ShoppingBag className="w-4 h-4 text-indigo-500" />
                      İhtiyaç Listesi Kalemleri ({fileAggregate.items.length})
                    </h3>
                  </div>

                  {/* Kalem Tablosu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase">
                        <tr>
                          <th className="p-2">Kalem Adı</th>
                          <th className="p-2">Miktar</th>
                          <th className="p-2">Birim Fiyat</th>
                          <th className="p-2">KDV</th>
                          <th className="p-2">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fileAggregate.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 font-medium">{item.kalem_adi}</td>
                            <td className="p-2">
                              {item.miktar} {item.birim}
                            </td>
                            <td className="p-2">{Number(item.birim_fiyat || 0).toLocaleString('tr-TR')} ₺</td>
                            <td className="p-2">%{item.kdv_orani || 20}</td>
                            <td className="p-2 font-semibold">
                              {(Number(item.miktar || 0) * Number(item.birim_fiyat || 0)).toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Hızlı Kalem Ekle Formu */}
                  <form onSubmit={handleAddItem} className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Kalem Adı"
                      value={newItemForm.kalem_adi}
                      onChange={(e) => setNewItemForm({ ...newItemForm, kalem_adi: e.target.value })}
                      className="col-span-2 px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Miktar"
                      value={newItemForm.miktar}
                      onChange={(e) => setNewItemForm({ ...newItemForm, miktar: Number(e.target.value) })}
                      className="px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Birim Fiyat"
                      value={newItemForm.birim_fiyat}
                      onChange={(e) => setNewItemForm({ ...newItemForm, birim_fiyat: Number(e.target.value) })}
                      className="px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition"
                    >
                      + Ekle
                    </button>
                  </form>
                </div>

                {/* 2. Piyasa Fiyat Araştırması Teklifleri & Teklif Formu */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      Piyasa Teklifleri ({fileAggregate.offers.length})
                    </h3>
                  </div>

                  {/* Teklif Tablosu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase">
                        <tr>
                          <th className="p-2">Tedarikçi Firma</th>
                          <th className="p-2">Teklif Tutarı</th>
                          <th className="p-2">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fileAggregate.offers.map((offer, idx) => (
                          <tr key={idx} className={offer.kazanan_mi ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}>
                            <td className="p-2 font-medium">
                              {offer.unvan || offer.firma_adi || `Firma #${offer.firma_id || idx + 1}`}
                            </td>
                            <td className="p-2 font-semibold">
                              {Number(offer.teklif_tutari || offer.toplam_teklif || 0).toLocaleString('tr-TR')} ₺
                            </td>
                            <td className="p-2">
                              {offer.kazanan_mi ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                  <Award className="w-3 h-3" /> En Avantajlı (Kazanan)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Geçerli Teklif</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Hızlı Teklif Ekle Formu */}
                  <form onSubmit={handleAddOffer} className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Firma Adı / Unvanı"
                      value={newOfferForm.firma_adi}
                      onChange={(e) => setNewOfferForm({ ...newOfferForm, firma_adi: e.target.value })}
                      className="col-span-2 px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Teklif Tutarı (₺)"
                      value={newOfferForm.teklif_tutari}
                      onChange={(e) => setNewOfferForm({ ...newOfferForm, teklif_tutari: Number(e.target.value) })}
                      className="px-2.5 py-1.5 text-xs border rounded-lg bg-slate-50 dark:bg-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition"
                    >
                      + Teklif Ver
                    </button>
                  </form>
                </div>
              </div>

              {/* 3. Şablon & Belge Derleme Laboratuvarı (Document Engine Önizleme) */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Document Engine Şablon Derleme & Resmî Yazışma Önizlemesi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Resmî Yazışma Yönetmeliği T.C. anteti, ihtiyaç kalemleri, firma teklif matrisi ve imza bloklarıyla canlı derleme
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedTemplateKey}
                      onChange={(e) => setSelectedTemplateKey(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-medium"
                    >
                      <option value="ihtiyac-listesi">İhtiyaç Listesi ve Talep Formu</option>
                      <option value="dogrudan-temin-onay-belgesi">Doğrudan Temin Onay Belgesi (KİK022)</option>
                      <option value="piyasa-fiyat-arastirma-tutanagi">Piyasa Fiyat Araştırması Tutanağı</option>
                      <option value="harcama-talimati">Harcama Talimatı / Onayı</option>
                      <option value="muayene-kabul-komisyonu">Muayene ve Kabul Komisyonu Tutanağı</option>
                    </select>

                    <button
                      onClick={handleCompileTemplate}
                      disabled={isCompilingTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {isCompilingTemplate ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Şablonu Derle & Önizle
                    </button>
                  </div>
                </div>

                {/* Derlenmiş Belge A4 Önizleme Kartı */}
                {compiledTemplateResult && compiledTemplateResult.success && compiledTemplateResult.data && (
                  <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-8 max-w-4xl mx-auto shadow-lg space-y-6 text-slate-800 dark:text-slate-200">
                    {/* Resmî Antet */}
                    <div className="text-center space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="text-sm font-bold tracking-widest uppercase">
                        {compiledTemplateResult.data.institutionalHeader.country}
                      </div>
                      <div className="text-base font-extrabold uppercase">
                        {compiledTemplateResult.data.institutionalHeader.ministry}
                      </div>
                      <div className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                        {compiledTemplateResult.data.institutionalHeader.spendingUnit}
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-2">
                        <span>Sayı: {compiledTemplateResult.data.institutionalHeader.documentNumber}</span>
                        <span>Tarih: {compiledTemplateResult.data.institutionalHeader.date}</span>
                      </div>
                    </div>

                    {/* Belge Başlığı */}
                    <div className="text-center py-2">
                      <h4 className="text-base font-extrabold tracking-wide uppercase underline decoration-2 underline-offset-4">
                        {compiledTemplateResult.data.documentTitle}
                      </h4>
                    </div>

                    {/* Süreç Bilgileri */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg text-xs space-y-2 border">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><span className="font-semibold text-slate-400">Dosya No:</span> {compiledTemplateResult.data.procurementSummary.fileNo}</div>
                        <div><span className="font-semibold text-slate-400">Alım Türü:</span> <span className="uppercase">{compiledTemplateResult.data.procurementSummary.procurementType}</span></div>
                        <div><span className="font-semibold text-slate-400">Yasal Dayanak:</span> {compiledTemplateResult.data.procurementSummary.legalBasis}</div>
                        <div><span className="font-semibold text-slate-400">Yaklaşık Maliyet:</span> <span className="font-bold text-indigo-600">{compiledTemplateResult.data.procurementSummary.estimatedCost.toLocaleString('tr-TR')} ₺</span></div>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400">İşin Konusu:</span> {compiledTemplateResult.data.procurementSummary.subject}
                      </div>
                    </div>

                    {/* Kalemler Tablosu */}
                    {compiledTemplateResult.data.itemTable.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                          Alımı Yapılacak Mal / Hizmet / Yapım İşi Kalemleri
                        </div>
                        <table className="w-full text-left text-xs border border-collapse border-slate-300 dark:border-slate-700">
                          <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                              <th className="border p-2 w-12 text-center">Sıra</th>
                              <th className="border p-2">Malın / İşin Adı ve Açıklaması</th>
                              <th className="border p-2 w-24 text-center">Miktar</th>
                              <th className="border p-2 w-28 text-right">Birim Fiyat</th>
                              <th className="border p-2 w-28 text-right">Toplam Tutar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compiledTemplateResult.data.itemTable.map((item: any) => (
                              <tr key={item.siraNo}>
                                <td className="border p-2 text-center">{item.siraNo}</td>
                                <td className="border p-2 font-medium">{item.kalemAdi}</td>
                                <td className="border p-2 text-center">{item.miktar} {item.birim}</td>
                                <td className="border p-2 text-right">{Number(item.birimFiyat).toLocaleString('tr-TR')} ₺</td>
                                <td className="border p-2 text-right font-semibold">{Number(item.toplamTutar).toLocaleString('tr-TR')} ₺</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Teklif Karşılaştırma Matrisi */}
                    {compiledTemplateResult.data.offerComparison.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                          Piyasa Fiyat Araştırması Teklif Değerlendirme Tablosu
                        </div>
                        <table className="w-full text-left text-xs border border-collapse border-slate-300 dark:border-slate-700">
                          <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                              <th className="border p-2 w-12 text-center">Sıra</th>
                              <th className="border p-2">Teklif Veren Tedarikçi / Yüklenici</th>
                              <th className="border p-2 w-36 text-right">Teklif Edilen Tutar</th>
                              <th className="border p-2 w-36 text-center">Karar Durumu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compiledTemplateResult.data.offerComparison.map((of: any) => (
                              <tr key={of.siraNo} className={of.kazandiMi ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''}>
                                <td className="border p-2 text-center">{of.siraNo}</td>
                                <td className="border p-2 font-medium">{of.firmaAdi}</td>
                                <td className="border p-2 text-right font-bold">{Number(of.teklifTutari).toLocaleString('tr-TR')} ₺</td>
                                <td className="border p-2 text-center">
                                  {of.kazandiMi ? (
                                    <span className="font-bold text-emerald-600">✓ En Avantajlı Teklif</span>
                                  ) : (
                                    <span className="text-slate-400">Geçerli</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* İmzalar */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-center text-xs">
                      {compiledTemplateResult.data.signatures.map((sig: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="font-semibold text-slate-500">{sig.role}</div>
                          <div className="pt-8 font-bold">{sig.name}</div>
                          <div className="text-[11px] text-slate-400">{sig.title}</div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between text-[11px] text-slate-400">
                      <span>Mevzuat Denetimi: {compiledTemplateResult.data.verifiedLegislation}</span>
                      <span>Derleme: {new Date(compiledTemplateResult.data.compiledAt).toLocaleTimeString('tr-TR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 2: .temin PAKET İNCELEYİCİ & DOSYA SEÇİCİ                            */}
      {/* ========================================================================= */}
      {activeTab === 'package' && (
        <div className="space-y-6">
          {/* Paket Yükleme ve Seçme Kartı */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950 border border-indigo-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileArchive className="w-5 h-5 text-indigo-600" />
                  .temin Arşiv Paketi Canlı İnceleyici (Archive & SQLite Inspector)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Doğrudan Temin 360 uygulamasının ürettiği <code>.temin</code> paketini seçin; arşiv içindeki <code>meta.json</code>, <code>database.sqlite</code> ve ekleri ayıklayıp canlı görüntüleyin.
                </p>
              </div>

              {/* Seçim ve Yükleme Butonları */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".temin,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingPackage}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Bilgisayarımdan .temin Dosyası Seç
                </button>

                <button
                  onClick={handleLoadPresetPackage}
                  disabled={isLoadingPackage}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {isLoadingPackage ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileArchive className="w-4 h-4 text-purple-600" />
                  )}
                  Örnek (test-projesi.temin) Paketini Aç
                </button>
              </div>
            </div>
          </div>

          {/* Ayıklanan Paket Analiz Raporu */}
          {inspectedPackage && (
            <div className="space-y-6">
              {/* Paket Üst Bilgileri */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded">
                        {inspectedPackage.fileName}
                      </span>
                      <span className="text-xs text-slate-400">({inspectedPackage.fileSizeKb} KB)</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {inspectedPackage.meta.institution || 'Doğrudan Temin 360 İdari Kurumu'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Proje ID: {inspectedPackage.meta.project_id} | DB Dosyası: {inspectedPackage.activeDbFileName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-400">Dosya Sayısı</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {inspectedPackage.counts.files}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-400">Kalem Sayısı</div>
                      <div className="text-base font-bold text-indigo-600">
                        {inspectedPackage.counts.items}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-400">Firma Sayısı</div>
                      <div className="text-base font-bold text-amber-600">
                        {inspectedPackage.counts.firms}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="text-xs text-slate-400">Ek Dosyalar</div>
                      <div className="text-base font-bold text-emerald-600">
                        {inspectedPackage.counts.attachments}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ek Dosyalar Bölümü (varsa) */}
                {inspectedPackage.attachments.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      Arşiv İçindeki Ek Dosyalar (attachments/):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inspectedPackage.attachments.map((att: any, idx: number) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs flex items-center gap-2"
                        >
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>{att.fileName}</span>
                          <span className="text-[10px] text-slate-400">({Math.round(att.size / 1024)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Paket İçindeki DATA_TeminDosyasi Tablosu */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Paket İçi Veritabanı Dosyaları (DATA_TeminDosyasi - {inspectedPackage.files.length} Kayıt)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Dosya No</th>
                        <th className="p-2.5">Alım Konusu</th>
                        <th className="p-2.5">Tür</th>
                        <th className="p-2.5">Durum</th>
                        <th className="p-2.5 text-right">Yaklaşık Maliyet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {inspectedPackage.files.map((f: any) => (
                        <tr key={f.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-400">#{f.id}</td>
                          <td className="p-2.5 font-medium">{f.dosya_no || f.temin_no || '-'}</td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">{f.konu}</td>
                          <td className="p-2.5 uppercase">{f.alim_turu || f.tur || 'mal'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded text-[11px] uppercase">
                              {f.durum}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-indigo-600">
                            {Number(f.yaklasik_maliyet || 0).toLocaleString('tr-TR')} ₺
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paket İçi Kalemler Tablosu */}
              {inspectedPackage.items.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    Paket İçi İhtiyaç Kalemleri (DATA_TeminKalem - {inspectedPackage.items.length} Kayıt)
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase">
                        <tr>
                          <th className="p-2">Dosya ID</th>
                          <th className="p-2">Kalem Adı</th>
                          <th className="p-2">Miktar</th>
                          <th className="p-2">Birim</th>
                          <th className="p-2 text-right">Birim Fiyat</th>
                          <th className="p-2 text-right">KDV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {inspectedPackage.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 font-bold text-slate-400">#{item.temin_dosya_id}</td>
                            <td className="p-2 font-medium">{item.kalem_adi}</td>
                            <td className="p-2">{item.miktar}</td>
                            <td className="p-2">{item.birim}</td>
                            <td className="p-2 text-right">{Number(item.birim_fiyat || 0).toLocaleString('tr-TR')} ₺</td>
                            <td className="p-2 text-right">%{item.kdv_orani || 20}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEKME 3: 9 MİMARİ KATMAN TESTİ (Mevcut Doğrulama Paketi)                   */}
      {/* ========================================================================= */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Direct Procurement Clean Architecture Katman Doğrulaması
            </h3>
            <button
              onClick={handleRunAll}
              disabled={runningTest !== null}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 text-xs"
            >
              {runningTest === 'all' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Tüm Katmanları Test Et (9)
            </button>
          </div>

          {/* Toplu Test Özeti */}
          {testResults['all'] && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Tüm Mimari Katmanların Test Özeti
                </h2>
                <StatusBadge status={testResults['all'].success ? 'success' : 'error'} />
              </div>
              <ResultDisplay result={testResults['all']} />
            </div>
          )}

          {/* Test Kartları Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ARCHITECTURE_TESTS.map((test) => {
              const result = testResults[test.id]
              const isRunning = runningTest === test.id

              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        {test.icon}
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                        {test.badge}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                      {test.category}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      {test.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleRunTest(test.id)}
                      disabled={runningTest !== null}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition disabled:opacity-50"
                    >
                      {isRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {isRunning ? 'Çalıştırılıyor...' : 'Testi Çalıştır'}
                    </button>

                    {result && (
                      <div className="mt-3">
                        <ResultDisplay result={result} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
