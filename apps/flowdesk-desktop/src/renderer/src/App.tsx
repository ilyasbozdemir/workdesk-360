import React, { useState, useEffect } from 'react'
import {
  Layers,
  Play,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  XCircle,
  User,
  ShieldCheck,
  ListTodo,
  Paperclip,
  History,
  Sparkles,
  RefreshCw
} from 'lucide-react'

// Types
export interface TemplateStep {
  adimKodu: string
  baslik: string
  adimTuru: 'form' | 'document' | 'task' | 'approval' | 'condition' | 'action'
  sira: number
  sorumluKisi?: string
  sorumluRol?: string
  sorumluBirim?: string
  zorunluMu?: boolean
  formSemasi?: Array<{
    id: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'boolean'
    required: boolean
    options?: Array<{ label: string; value: string | number }>
  }>
}

export interface Template {
  id: string
  kod: string
  ad: string
  kategori: string
  aciklama?: string
  versiyon: number
  adimlar: TemplateStep[]
  aktif: boolean
}

export interface ProcessItem {
  id: string
  sablonId?: string
  baslik: string
  kategori: string
  aciklama?: string
  durum: 'taslak' | 'aktif' | 'beklemede' | 'tamamlandi' | 'iptal' | 'arsivlendi'
  baslatanKisi: string
  baslatanBirim?: string
  aktifAdimId?: string
  ilerlemeYuzdesi: number
  baslangicTarihi: string
  bitisTarihi?: string
  surecVerisi: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ProcessStep {
  id: string
  surecId: string
  adimKodu: string
  baslik: string
  adimTuru: 'form' | 'document' | 'task' | 'approval' | 'condition' | 'action'
  sira: number
  sorumluKisi?: string
  sorumluRol?: string
  sorumluBirim?: string
  durum: 'beklemede' | 'devam_ediyor' | 'tamamlandi' | 'reddedildi' | 'iade_edildi' | 'atlandi'
  formVerisi?: Record<string, unknown>
  tamamlayanKisi?: string
  tamamlanmaTarihi?: string
  notlar?: string
}

export interface ProcessTask {
  id: string
  surecId: string
  adimId?: string
  gorevTanimi: string
  atananKisi: string
  atananBirim?: string
  oncelik: 'dusuk' | 'normal' | 'yuksek' | 'acil'
  sonTarih?: string
  tamamlandi: boolean
  tamamlanmaTarihi?: string
  tamamlayanKisi?: string
  notlar?: string
  createdAt: string
}

export interface ProcessDoc {
  id: string
  surecId: string
  belgeAdi: string
  dosyaYolu: string
  mimeType?: string
  boyutBayt?: number
  aciklama?: string
  yukleyenKisi: string
  createdAt: string
}

export interface ProcessLog {
  id: string
  surecId: string
  adimId?: string
  islem: string
  yapanKisi: string
  tarih: string
  detay?: Record<string, unknown>
}

export interface ProcessDetail {
  surec: ProcessItem
  adimlar: ProcessStep[]
  gorevler: ProcessTask[]
  belgeler: ProcessDoc[]
  tarihce: ProcessLog[]
}

export interface Stats {
  totalProcesses: number
  activeProcesses: number
  completedProcesses: number
  pendingApprovals: number
  openTasks: number
  categories: Array<{ category: string; count: number }>
}

declare global {
  interface Window {
    flowdeskAPI?: {
      getTemplates: () => Promise<Template[]>
      getTemplateById: (id: string) => Promise<Template | null>
      createTemplate: (data: unknown) => Promise<Template>
      getProcesses: (filter?: unknown) => Promise<ProcessItem[]>
      getProcessById: (id: string) => Promise<ProcessDetail | null>
      startProcess: (params: unknown) => Promise<ProcessDetail>
      advanceStep: (params: unknown) => Promise<{ success: boolean; processCompleted?: boolean; message?: string }>
      rejectStep: (params: unknown) => Promise<{ success: boolean; message?: string }>
      returnStep: (params: unknown) => Promise<{ success: boolean; message?: string }>
      cancelProcess: (processId: string, actor: string, reason: string) => Promise<boolean>
      archiveProcess: (processId: string, actor: string) => Promise<boolean>
      getTasks: (filter?: unknown) => Promise<ProcessTask[]>
      createTask: (data: unknown) => Promise<ProcessTask>
      completeTask: (taskId: string, actor: string, notes?: string) => Promise<boolean>
      addDocument: (data: unknown) => Promise<ProcessDoc>
      getDashboardStats: () => Promise<Stats>
    }
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'processes' | 'new_process' | 'templates' | 'tasks' | 'isolation'>('processes')
  const [processes, setProcesses] = useState<ProcessItem[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [tasks, setTasks] = useState<ProcessTask[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProcesses: 0,
    activeProcesses: 0,
    completedProcesses: 0,
    pendingApprovals: 0,
    openTasks: 0,
    categories: []
  })

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Detail Modal
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<ProcessDetail | null>(null)
  const [detailTab, setDetailTab] = useState<'steps' | 'tasks' | 'documents' | 'history'>('steps')

  // New Process Form State
  const [newMode, setNewMode] = useState<'template' | 'custom'>('template')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [newTitle, setNewTitle] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('talep')
  const [newDescription, setNewDescription] = useState<string>('')
  const [newInitiator, setNewInitiator] = useState<string>('Mühendis Mehmet Öz')
  const [newInitiatorUnit, setNewInitiatorUnit] = useState<string>('Fen İşleri Dairesi')

  // Action input state
  const [stepFormData, setStepFormData] = useState<Record<string, string>>({})
  const [stepNotes, setStepNotes] = useState<string>('')
  const [actionActor, setActionActor] = useState<string>('Şube Müdürü Ali Kaya')

  // New task within process
  const [newTaskDesc, setNewTaskDesc] = useState<string>('')
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('Teknik Personel Can Demir')

  // New document reference
  const [newDocName, setNewDocName] = useState<string>('')
  const [newDocPath, setNewDocPath] = useState<string>('')

  const loadData = async () => {
    if (!window.flowdeskAPI) return
    try {
      const [pList, tList, taskList, statData] = await Promise.all([
        window.flowdeskAPI.getProcesses({ status: filterStatus, search: searchQuery }),
        window.flowdeskAPI.getTemplates(),
        window.flowdeskAPI.getTasks(),
        window.flowdeskAPI.getDashboardStats()
      ])
      setProcesses(pList)
      setTemplates(tList)
      setTasks(taskList)
      setStats(statData)

      if (tList.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(tList[0].id)
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterStatus, searchQuery])

  const openProcessDetail = async (id: string) => {
    if (!window.flowdeskAPI) return
    const detail = await window.flowdeskAPI.getProcessById(id)
    setSelectedDetail(detail)
    setSelectedProcessId(id)
    setStepFormData({})
    setStepNotes('')
  }

  const handleStartProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.flowdeskAPI || !newTitle.trim()) return

    const detail = await window.flowdeskAPI.startProcess({
      templateId: newMode === 'template' ? selectedTemplateId : undefined,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || undefined,
      initiator: newInitiator.trim(),
      initiatorUnit: newInitiatorUnit.trim()
    })

    setNewTitle('')
    setNewDescription('')
    setActiveTab('processes')
    loadData()
    openProcessDetail(detail.surec.id)
  }

  const handleAdvanceStep = async (stepId: string) => {
    if (!window.flowdeskAPI || !selectedProcessId) return
    await window.flowdeskAPI.advanceStep({
      processId: selectedProcessId,
      stepId,
      actor: actionActor,
      formData: stepFormData,
      notes: stepNotes
    })
    setStepFormData({})
    setStepNotes('')
    await openProcessDetail(selectedProcessId)
    await loadData()
  }

  const handleRejectStep = async (stepId: string) => {
    if (!window.flowdeskAPI || !selectedProcessId) return
    const reason = prompt('Reddetme gerekçesini giriniz:')
    if (!reason) return
    await window.flowdeskAPI.rejectStep({
      processId: selectedProcessId,
      stepId,
      actor: actionActor,
      reason
    })
    await openProcessDetail(selectedProcessId)
    await loadData()
  }

  const handleReturnStep = async (stepId: string) => {
    if (!window.flowdeskAPI || !selectedProcessId) return
    const reason = prompt('Düzeltme / İade gerekçesini giriniz:')
    if (!reason) return
    await window.flowdeskAPI.returnStep({
      processId: selectedProcessId,
      stepId,
      actor: actionActor,
      reason
    })
    await openProcessDetail(selectedProcessId)
    await loadData()
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.flowdeskAPI || !selectedProcessId || !newTaskDesc.trim()) return
    await window.flowdeskAPI.createTask({
      processId: selectedProcessId,
      taskDescription: newTaskDesc.trim(),
      assignedTo: newTaskAssignee.trim(),
      actor: actionActor
    })
    setNewTaskDesc('')
    await openProcessDetail(selectedProcessId)
    await loadData()
  }

  const handleCompleteTask = async (taskId: string) => {
    if (!window.flowdeskAPI || !selectedProcessId) return
    await window.flowdeskAPI.completeTask(taskId, actionActor, 'Görev başarıyla tamamlandı.')
    await openProcessDetail(selectedProcessId)
    await loadData()
  }

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!window.flowdeskAPI || !selectedProcessId || !newDocName.trim()) return
    await window.flowdeskAPI.addDocument({
      processId: selectedProcessId,
      fileName: newDocName.trim(),
      filePath: newDocPath.trim() || `belgeler/${newDocName.trim()}.pdf`,
      uploader: actionActor
    })
    setNewDocName('')
    setNewDocPath('')
    await openProcessDetail(selectedProcessId)
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* SOL MENÜ */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/90 backdrop-blur flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              FLOWDESK 360
            </h1>
            <p className="text-xs text-indigo-400 font-medium">Dinamik Süreç Masası</p>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('processes')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'processes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Süreçler Masası</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
              {stats.totalProcesses}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('new_process')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'new_process'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Süreç Başlat</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Süreç Şablonları</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Görevler Masası</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {stats.openTasks}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('isolation')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'isolation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Bağımsızlık Sınırları</span>
          </button>
        </nav>

        {/* Aktif Kullanıcı & Rol */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3 text-xs mb-1.5">
            <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-indigo-300 font-semibold shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] text-slate-400 font-medium">Aktif Yetkili / Rol:</label>
              <select
                value={actionActor}
                onChange={(e) => setActionActor(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value="Şube Müdürü Ali Kaya">Şube Müdürü Ali Kaya</option>
                <option value="Daire Başkanı Selim Çetin">Daire Başkanı Selim Çetin</option>
                <option value="Uzman Mehmet Öz">Uzman Mehmet Öz</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* ÜST BİLGİ & İSTATİSTİK ÇUBUĞU */}
        <header className="p-6 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeTab === 'processes' && 'Genel Amaçlı İş Süreçleri Masası'}
              {activeTab === 'new_process' && 'Dinamik Süreç Başlatma'}
              {activeTab === 'templates' && 'Kurumsal Süreç Şablonları Kütüphanesi'}
              {activeTab === 'tasks' && 'Tüm Adım ve Süreç Görevleri'}
              {activeTab === 'isolation' && 'FLOWDESK 360 Bağımsızlık ve Mimari Doğrulama'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mevzuattan bağımsız, dinamik adımlı kurumsal iş akışları ve kontrollü onay mekanizmaları
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('new_process')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Süreç</span>
            </button>
          </div>
        </header>

        {/* İÇERİK SEKMELERİ */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: SÜREÇLER MASASI */}
          {activeTab === 'processes' && (
            <div className="space-y-6">
              {/* İstatistik Kartları */}
              <div className="grid grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                  <p className="text-xs text-slate-400 font-medium">Toplam Süreç</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.totalProcesses}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                  <p className="text-xs text-indigo-400 font-medium">Aktif / Devam Eden</p>
                  <p className="text-2xl font-bold text-indigo-300 mt-1">{stats.activeProcesses}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                  <p className="text-xs text-amber-400 font-medium">Bekleyen Onaylar</p>
                  <p className="text-2xl font-bold text-amber-300 mt-1">{stats.pendingApprovals}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                  <p className="text-xs text-rose-400 font-medium">Açık Görevler</p>
                  <p className="text-2xl font-bold text-rose-300 mt-1">{stats.openTasks}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                  <p className="text-xs text-emerald-400 font-medium">Tamamlanan</p>
                  <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.completedProcesses}</p>
                </div>
              </div>

              {/* Filtre ve Arama */}
              <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 flex-1 max-w-md bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Süreç adı, başlatan kişi veya açıklama ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="aktif">Aktif</option>
                    <option value="tamamlandi">Tamamlanan</option>
                    <option value="iptal">İptal / Reddedilen</option>
                    <option value="arsivlendi">Arşivlenen</option>
                  </select>
                </div>
              </div>

              {/* Süreç Listesi */}
              {processes.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
                  <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-300">Henüz kayıtlı süreç bulunmuyor</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Yukarıdaki "Yeni Süreç" butonuna tıklayarak kurumsal talep veya iş akışınızı hemen başlatabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processes.map((p) => {
                    const isCompleted = p.durum === 'tamamlandi'
                    const isCancelled = p.durum === 'iptal'
                    return (
                      <div
                        key={p.id}
                        onClick={() => openProcessDetail(p.id)}
                        className="cursor-pointer group p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all shadow-md relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                            {p.kategori}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isCancelled
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {p.durum === 'aktif' && 'Devam Ediyor'}
                            {p.durum === 'tamamlandi' && 'Tamamlandı'}
                            {p.durum === 'iptal' && 'İptal / Red'}
                            {p.durum === 'arsivlendi' && 'Arşivde'}
                          </span>
                        </div>

                        <h3 className="font-semibold text-white text-base mt-3 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {p.baslik}
                        </h3>
                        {p.aciklama && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.aciklama}</p>
                        )}

                        {/* İlerleme Çubuğu */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>İlerleme</span>
                            <span className="font-semibold text-slate-300">%{p.ilerlemeYuzdesi}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                              style={{ width: `${p.ilerlemeYuzdesi}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center space-x-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate">{p.baslatanKisi}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: YENİ SÜREÇ BAŞLAT */}
          {activeTab === 'new_process' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Yeni Süreç Başlatma Sihirbazı</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hazır kurumsal şablonlardan seçin veya tamamen bağımsız adımlar belirleyin
                    </p>
                  </div>
                  <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setNewMode('template')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        newMode === 'template' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Şablondan Başlat
                    </button>
                    <button
                      onClick={() => setNewMode('custom')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        newMode === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Serbest Akış
                    </button>
                  </div>
                </div>

                <form onSubmit={handleStartProcess} className="space-y-4">
                  {newMode === 'template' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Süreç Şablonu Seçiniz
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => {
                          setSelectedTemplateId(e.target.value)
                          const t = templates.find((item) => item.id === e.target.value)
                          if (t) {
                            setNewCategory(t.kategori)
                            setNewTitle(`${t.ad} - ${new Date().toLocaleDateString('tr-TR')}`)
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.kod}] {t.ad} ({t.adimlar.length} Adım)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Süreç Başlığı / Konusu *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: 2026 Yılı Teknik Donanım ve Bakım İhtiyacı Talebi"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Kategori
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="talep">İç Talep & Satınalma İhtiyacı</option>
                        <option value="idari">Resmî Yazışma & Onay</option>
                        <option value="saha">Saha Denetim & İnceleme</option>
                        <option value="it">Bilgi İşlem & Teknik Destek</option>
                        <option value="genel">Genel Kurumsal Süreç</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Başlatan Personel
                      </label>
                      <input
                        type="text"
                        required
                        value={newInitiator}
                        onChange={(e) => setNewInitiator(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Başlatan Birim
                    </label>
                    <input
                      type="text"
                      value={newInitiatorUnit}
                      onChange={(e) => setNewInitiatorUnit(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Açıklama / Gerekçe
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Sürecin başlatılma gerekçesini ve detaylarını yazınız..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      <Play className="w-4 h-4" />
                      <span>Süreci Başlat</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: ŞABLONLAR KÜTÜPHANESİ */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-800/40">
                          {t.kod} (v{t.versiyon})
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{t.kategori}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white mt-3">{t.ad}</h3>
                      <p className="text-xs text-slate-400 mt-1">{t.aciklama}</p>

                      <div className="mt-5 space-y-2">
                        <p className="text-xs font-semibold text-slate-300">İş Akışı Adımları:</p>
                        <div className="space-y-1.5">
                          {t.adimlar.map((s, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
                            >
                              <span className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-slate-200 truncate flex-1">
                                {s.baslik}
                              </span>
                              <span className="text-[10px] uppercase font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 shrink-0">
                                {s.adimTuru}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedTemplateId(t.id)
                          setNewCategory(t.kategori)
                          setNewTitle(`${t.ad} - ${new Date().toLocaleDateString('tr-TR')}`)
                          setActiveTab('new_process')
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Bu Şablonla Süreç Başlat</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GÖREVLER MASASI */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">Tüm Süreç Görevleri</h3>
                  <p className="text-xs text-slate-400">Atanan kişilere göre tamamlanma durumu</p>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800">
                  <ListTodo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Henüz açık bir görev bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        t.tamamlandi
                          ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          disabled={t.tamamlandi}
                          onClick={() => handleCompleteTask(t.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            t.tamamlandi
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'border border-slate-600 hover:border-indigo-400 text-transparent hover:text-indigo-400'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              t.tamamlandi ? 'line-through text-slate-400' : 'text-slate-200'
                            }`}
                          >
                            {t.gorevTanimi}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                            <span className="text-slate-400 font-medium">Atanan: {t.atananKisi}</span>
                            <span>•</span>
                            <span className="capitalize">{t.oncelik} Öncelik</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        {t.tamamlandi ? (
                          <span className="text-emerald-400 font-medium">Tamamlandı</span>
                        ) : (
                          <span className="text-amber-400 font-medium">Açık</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BAĞIMSIZLIK SINIRLARI */}
          {activeTab === 'isolation' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center space-x-3 text-emerald-400 border-b border-slate-800 pb-4">
                  <ShieldCheck className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg font-bold text-white">FLOWDESK 360 Bağımsızlık Mimarisi</h3>
                    <p className="text-xs text-slate-400">
                      Uygulama izolasyonu ve mevzuat ayrışma durumu
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <p className="font-semibold text-white">1. TEMİN 360 İzolasyonu</p>
                    <p className="text-slate-400 mt-1">
                      FLOWDESK 360 doğrudan temin uygulaması değildir. TEMİN 360'ın .temin ve .hkmp dosyalarını,
                      veritabanını ve mevzuat motorunu değiştirmez veya otomatik taşıma yapmaz.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <p className="font-semibold text-white">2. 2886 Sayılı Kanun İzolasyonu</p>
                    <p className="text-slate-400 mt-1">
                      FLOWDESK 360 içinde 2886 Devlet İhale Kanunu'na yönelik ihale komisyonu, satış/kiralama
                      artırma turları veya ihale mevzuat ekranları bulunmaz. 2886 işlevleri bağımsız
                      <code>apps/devlet-ihale-2886-desktop</code> uygulamasında yürütülür.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <p className="font-semibold text-white">3. Bağımsız Kimlik & Dosya Formatı</p>
                    <p className="text-slate-400 mt-1">
                      FLOWDESK 360, <code>dev.ilyasbozdemir.flowdesk360</code> kimliğine, <code>flowdesk360.db</code>
                      bağımsız SQLite deposuna ve <code>.flowdesk</code> / <code>.flow</code> dosya uzantılarına sahiptir.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <p className="font-semibold text-white">4. Şablon İmmutability (Değişmezlik Garantisi)</p>
                    <p className="text-slate-400 mt-1">
                      Süreç başlatıldığında şablon adımları örneğin adımlarına kopyalanır. Şablon sonradan
                      güncellense veya silinse dahi aktif süreçlerin adımları ve geçmişi asla bozulmaz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SÜREÇ DETAY MODALI / YAN PANELİ */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                    {selectedDetail.surec.kategori}
                  </span>
                  <span className="text-xs text-slate-400">
                    Başlatan: {selectedDetail.surec.baslatanKisi} ({selectedDetail.surec.baslatanBirim || 'Birim'})
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1.5">{selectedDetail.surec.baslik}</h2>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-5 border-b border-slate-800 flex space-x-4 bg-slate-950/40 text-xs">
              <button
                onClick={() => setDetailTab('steps')}
                className={`py-3 font-semibold border-b-2 transition-all ${
                  detailTab === 'steps' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                Adımlar & Yürütme ({selectedDetail.adimlar.length})
              </button>
              <button
                onClick={() => setDetailTab('tasks')}
                className={`py-3 font-semibold border-b-2 transition-all ${
                  detailTab === 'tasks' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                Görevler ({selectedDetail.gorevler.length})
              </button>
              <button
                onClick={() => setDetailTab('documents')}
                className={`py-3 font-semibold border-b-2 transition-all ${
                  detailTab === 'documents' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                Belgeler & Ekler ({selectedDetail.belgeler.length})
              </button>
              <button
                onClick={() => setDetailTab('history')}
                className={`py-3 font-semibold border-b-2 transition-all ${
                  detailTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'
                }`}
              >
                Tarihçe & Denetim ({selectedDetail.tarihce.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* TAB 1: ADIMLAR & YÜRÜTME */}
              {detailTab === 'steps' && (
                <div className="space-y-6">
                  {/* Stepper Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      İş Akışı Aşamaları
                    </h4>
                    <div className="space-y-3">
                      {selectedDetail.adimlar.map((step, idx) => {
                        const isCurrent = step.id === selectedDetail.surec.aktifAdimId
                        const isDone = step.durum === 'tamamlandi'
                        const isRejected = step.durum === 'reddedildi'
                        const isReturned = step.durum === 'iade_edildi'

                        return (
                          <div
                            key={step.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isCurrent
                                ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                                : isDone
                                ? 'bg-slate-900/60 border-slate-800/80'
                                : 'bg-slate-900/30 border-slate-800/40 opacity-70'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isDone
                                      ? 'bg-emerald-500 text-white'
                                      : isCurrent
                                      ? 'bg-indigo-600 text-white animate-pulse'
                                      : isRejected
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-slate-200">{step.baslik}</p>
                                  <p className="text-[11px] text-slate-400">
                                    Tür: <span className="uppercase">{step.adimTuru}</span>
                                    {step.sorumluRol && ` • Sorumlu: ${step.sorumluRol}`}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                                  isDone
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : isCurrent
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : isRejected
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : isReturned
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {step.durum.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Aktif Adım Aksiyon Alanı */}
                            {isCurrent && selectedDetail.surec.durum === 'aktif' && (
                              <div className="mt-4 pt-4 border-t border-indigo-500/30 bg-slate-950/60 p-4 rounded-lg space-y-3">
                                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
                                  <Clock className="w-4 h-4" />
                                  <span>Aktif Adım İşlem Bekliyor</span>
                                </div>

                                {step.adimTuru === 'form' && (
                                  <div className="space-y-2">
                                    <label className="block text-xs text-slate-300">
                                      Veri Girişi / Talep Detayı:
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="Bu aşamada girilmesi gereken verileri veya açıklamayı yazınız..."
                                      value={stepFormData['detay'] || ''}
                                      onChange={(e) => setStepFormData({ ...stepFormData, detay: e.target.value })}
                                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                                    />
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <label className="block text-xs text-slate-300">İşlem Notu (Opsiyonel):</label>
                                  <input
                                    type="text"
                                    placeholder="İşleme ilişkin not veya referans..."
                                    value={stepNotes}
                                    onChange={(e) => setStepNotes(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                  />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                  {step.sira > 1 && (
                                    <button
                                      onClick={() => handleReturnStep(step.id)}
                                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium border border-amber-500/30"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>İade Et</span>
                                    </button>
                                  )}

                                  {step.adimTuru === 'approval' && (
                                    <button
                                      onClick={() => handleRejectStep(step.id)}
                                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Reddet</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleAdvanceStep(step.id)}
                                    className="ml-auto flex items-center space-x-1.5 px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                                  >
                                    <span>{step.adimTuru === 'approval' ? 'Onayla ve İlerlet' : 'Adımı Tamamla'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GÖREVLER */}
              {detailTab === 'tasks' && (
                <div className="space-y-4">
                  <form onSubmit={handleCreateTask} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Yeni Görev Ata</p>
                    <input
                      type="text"
                      placeholder="Görev tanımını yazınız..."
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Atanan Kişi"
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Görev Ekle
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {selectedDetail.gorevler.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">Bu süreçte atanmış görev bulunmuyor.</p>
                    ) : (
                      selectedDetail.gorevler.map((g) => (
                        <div key={g.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2.5">
                            <button
                              disabled={g.tamamlandi}
                              onClick={() => handleCompleteTask(g.id)}
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                g.tamamlandi ? 'bg-emerald-500 text-white' : 'border border-slate-600 text-transparent'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <div>
                              <p className={`font-medium ${g.tamamlandi ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {g.gorevTanimi}
                              </p>
                              <p className="text-[10px] text-slate-400">Atanan: {g.atananKisi}</p>
                            </div>
                          </div>
                          <span className={g.tamamlandi ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                            {g.tamamlandi ? 'Tamamlandı' : 'Açık'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: BELGELER */}
              {detailTab === 'documents' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddDocument} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Belge / Dosya Referansı Ekle</p>
                    <input
                      type="text"
                      placeholder="Belge Adı (Örn: Birim_Talep_Yazisi_2026.pdf)"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Dosya Yolu (Opsiyonel)"
                        value={newDocPath}
                        onChange={(e) => setNewDocPath(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Belgeyi Kaydet
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {selectedDetail.belgeler.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">Ekli belge bulunmuyor.</p>
                    ) : (
                      selectedDetail.belgeler.map((b) => (
                        <div key={b.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2.5 truncate">
                            <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-semibold text-slate-200 truncate">{b.belgeAdi}</p>
                              <p className="text-[10px] text-slate-500 truncate">{b.dosyaYolu}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(b.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TARİHÇE & DENETİM */}
              {detailTab === 'history' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Süreç Denetim Kayıtları (Audit Trail)
                  </h4>
                  <div className="space-y-2">
                    {selectedDetail.tarihce.map((log) => (
                      <div key={log.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-start space-x-3">
                        <History className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 capitalize">
                              {log.islem.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(log.tarih).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-0.5">Yapan: {log.yapanKisi}</p>
                          {log.detay && (
                            <pre className="mt-1 p-1.5 rounded bg-slate-900 text-[10px] text-slate-400 font-mono overflow-x-auto">
                              {JSON.stringify(log.detay, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
