import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderGit2,
  History,
  Layers,
  LayoutDashboard,
  ListTodo,
  Minus,
  Moon,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  X,
} from "lucide-react";

declare global {
  interface Window {
    flowdeskAPI?: {
      getTemplates: () => Promise<unknown[]>;
      getProcesses: (kategori?: string) => Promise<unknown[]>;
      getProcessById: (id: string) => Promise<unknown>;
      getSteps: (surecId: string) => Promise<unknown[]>;
      getTasks: (surecId: string) => Promise<unknown[]>;
      getDocuments: (surecId: string) => Promise<unknown[]>;
      getHistory: (surecId: string) => Promise<unknown[]>;
      createProcess: (data: {
        sablonId?: string;
        baslik: string;
        aciklama?: string;
        baslatanKisi: string;
        baslatanBirim?: string;
      }) => Promise<unknown>;
      updateStepStatus: (data: {
        stepId: string;
        durum:
          | "beklemede"
          | "devam_ediyor"
          | "tamamlandi"
          | "reddedildi"
          | "iade_edildi"
          | "atlandi";
        tamamlayanKisi?: string;
        notlar?: string;
        formVerisi?: Record<string, unknown>;
      }) => Promise<unknown>;
      updateProcessStatus: (data: {
        processId: string;
        durum:
          | "taslak"
          | "aktif"
          | "beklemede"
          | "tamamlandi"
          | "iptal"
          | "arsivlendi";
        yapanKisi: string;
        aciklama?: string;
      }) => Promise<unknown>;
      addTask: (data: {
        surecId: string;
        adimId?: string;
        gorevTanimi: string;
        atananKisi: string;
        atananBirim?: string;
        oncelik?: "dusuk" | "normal" | "yuksek" | "acil";
        sonTarih?: string;
      }) => Promise<unknown>;
      completeTask: (data: {
        taskId: string;
        tamamlayanKisi: string;
        notlar?: string;
      }) => Promise<unknown>;
    };
  }
}

// Types
export interface TemplateStep {
  adimKodu: string;
  baslik: string;
  adimTuru: "form" | "document" | "task" | "approval" | "condition" | "action";
  sira: number;
  sorumluKisi?: string;
  sorumluRol?: string;
  sorumluBirim?: string;
  zorunluMu?: boolean;
  formSemasi?: Array<{
    id: string;
    label: string;
    type:
      | "text"
      | "textarea"
      | "number"
      | "currency"
      | "date"
      | "select"
      | "boolean";
    required: boolean;
    options?: Array<{ label: string; value: string | number }>;
  }>;
}

export interface Template {
  id: string;
  kod: string;
  ad: string;
  kategori: string;
  aciklama?: string;
  versiyon: number;
  adimlar: TemplateStep[];
  aktif: boolean;
}

export interface ProcessItem {
  id: string;
  sablonId?: string;
  baslik: string;
  kategori: string;
  aciklama?: string;
  durum:
    | "taslak"
    | "aktif"
    | "beklemede"
    | "tamamlandi"
    | "iptal"
    | "arsivlendi";
  baslatanKisi: string;
  baslatanBirim?: string;
  aktifAdimId?: string;
  ilerlemeYuzdesi: number;
  baslangicTarihi: string;
  bitisTarihi?: string;
  surecVerisi: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStep {
  id: string;
  surecId: string;
  adimKodu: string;
  baslik: string;
  adimTuru: "form" | "document" | "task" | "approval" | "condition" | "action";
  sira: number;
  sorumluKisi?: string;
  sorumluRol?: string;
  sorumluBirim?: string;
  durum:
    | "beklemede"
    | "devam_ediyor"
    | "tamamlandi"
    | "reddedildi"
    | "iade_edildi"
    | "atlandi";
  formVerisi?: Record<string, unknown>;
  tamamlayanKisi?: string;
  tamamlanmaTarihi?: string;
  notlar?: string;
}

export interface ProcessTask {
  id: string;
  surecId: string;
  adimId?: string;
  gorevTanimi: string;
  atananKisi: string;
  atananBirim?: string;
  oncelik: "dusuk" | "normal" | "yuksek" | "acil";
  sonTarih?: string;
  tamamlandi: boolean;
  tamamlanmaTarihi?: string;
  tamamlayanKisi?: string;
  notlar?: string;
  createdAt: string;
}

export interface ProcessDocument {
  id: string;
  surecId: string;
  adimId?: string;
  belgeAdi: string;
  belgeTuru: string;
  dosyaYolu?: string;
  mimeTipi?: string;
  olusturanKisi: string;
  createdAt: string;
}

export interface ProcessHistory {
  id: string;
  surecId: string;
  adimId?: string;
  eylem: string;
  eskiDurum?: string;
  yeniDurum?: string;
  aciklama?: string;
  yapanKisi: string;
  tarihSaat: string;
}

export function App(): React.JSX.Element {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<
    "processes" | "kanban" | "templates" | "tasks" | "history"
  >("processes");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("flowdesk-theme") === "dark" || true;
  });

  // Data states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null,
  );
  const [selectedProcessSteps, setSelectedProcessSteps] = useState<
    ProcessStep[]
  >([]);
  const [selectedProcessTasks, setSelectedProcessTasks] = useState<
    ProcessTask[]
  >([]);
  const [selectedProcessDocs, setSelectedProcessDocs] = useState<
    ProcessDocument[]
  >([]);
  const [selectedProcessHistory, setSelectedProcessHistory] = useState<
    ProcessHistory[]
  >([]);

  // UI Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const [newProcessTitle, setNewProcessTitle] = useState("");
  const [newProcessDesc, setNewProcessDesc] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Actor / Role Selector
  const [activeActorRole, setActiveActorRole] = useState<
    "personel" | "amir" | "uzman" | "yetkili"
  >("amir");
  const [activeActorName, setActiveActorName] = useState(
    "Ahmet Yılmaz (Şube Müdürü)",
  );

  // Loading
  const [loading, setLoading] = useState(false);

  // Apply theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("flowdesk-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("flowdesk-theme", "light");
    }
  }, [isDarkMode]);

  // Initial load from SQLite via IPC
  const refreshData = async (): Promise<void> => {
    setLoading(true);
    try {
      if (window.flowdeskAPI) {
        const tpls = await window.flowdeskAPI.getTemplates();
        setTemplates(tpls as Template[]);

        const procs = await window.flowdeskAPI.getProcesses();
        setProcesses(procs as ProcessItem[]);

        if (selectedProcessId) {
          await loadProcessDetails(selectedProcessId);
        }
      }
    } catch (err) {
      console.error("Veri yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const loadProcessDetails = async (id: string): Promise<void> => {
    try {
      if (window.flowdeskAPI) {
        const steps = await window.flowdeskAPI.getSteps(id);
        setSelectedProcessSteps(steps as ProcessStep[]);

        const tasks = await window.flowdeskAPI.getTasks(id);
        setSelectedProcessTasks(tasks as ProcessTask[]);

        const docs = await window.flowdeskAPI.getDocuments(id);
        setSelectedProcessDocs(docs as ProcessDocument[]);

        const history = await window.flowdeskAPI.getHistory(id);
        setSelectedProcessHistory(history as ProcessHistory[]);
      }
    } catch (err) {
      console.error("Süreç detayları yüklenemedi:", err);
    }
  };

  const handleSelectProcess = (proc: ProcessItem): void => {
    setSelectedProcessId(proc.id);
    loadProcessDetails(proc.id);
  };

  // Create Process
  const handleCreateProcess = async (): Promise<void> => {
    if (!newProcessTitle.trim() || !selectedTemplateId) return;
    try {
      if (window.flowdeskAPI) {
        const newProc = await window.flowdeskAPI.createProcess({
          sablonId: selectedTemplateId,
          baslik: newProcessTitle,
          aciklama: newProcessDesc,
          baslatanKisi: activeActorName,
        });
        setShowNewProcessModal(false);
        setNewProcessTitle("");
        setNewProcessDesc("");
        await refreshData();
        if (newProc && (newProc as ProcessItem).id) {
          handleSelectProcess(newProc as ProcessItem);
        }
      }
    } catch (err) {
      console.error("Süreç oluşturma hatası:", err);
    }
  };

  // Step Status Advance / Complete
  const handleCompleteStep = async (step: ProcessStep): Promise<void> => {
    if (!selectedProcessId) return;
    try {
      if (window.flowdeskAPI) {
        await window.flowdeskAPI.updateStepStatus({
          stepId: step.id,
          durum: "tamamlandi",
          tamamlayanKisi: activeActorName,
          notlar: "Adım başarıyla tamamlandı ve onaylandı.",
        });
        await refreshData();
      }
    } catch (err) {
      console.error("Adım tamamlama hatası:", err);
    }
  };

  // Step Rejection / Return
  const handleRejectStep = async (step: ProcessStep): Promise<void> => {
    if (!selectedProcessId) return;
    try {
      if (window.flowdeskAPI) {
        await window.flowdeskAPI.updateStepStatus({
          stepId: step.id,
          durum: "reddedildi",
          tamamlayanKisi: activeActorName,
          notlar: "Mevzuata veya birim standartlarına uygun bulunmadı.",
        });
        await refreshData();
      }
    } catch (err) {
      console.error("Adım reddetme hatası:", err);
    }
  };

  // Filtered Processes
  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      const matchSearch =
        p.baslik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.aciklama &&
          p.aciklama.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === "all" || p.durum === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [processes, searchQuery, statusFilter]);

  // Selected Process Object
  const currentProcess = useMemo(() => {
    return processes.find((p) => p.id === selectedProcessId) || null;
  }, [processes, selectedProcessId]);

  // Stats
  const stats = useMemo(() => {
    const total = processes.length;
    const active = processes.filter((p) => p.durum === "aktif").length;
    const pending = processes.filter((p) => p.durum === "beklemede").length;
    const completed = processes.filter((p) => p.durum === "tamamlandi").length;
    return { total, active, pending, completed };
  }, [processes]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      {
        /* =========================================================================
          1. HEADER (Temin 360 & İhale 360 Kurumsal Standart Üst Çubuk)
          ========================================================================= */
      }
      <header
        className="flex flex-col bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-50 select-none shadow-xs"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Üst Vurgu Çizgisi */}
        <div className="h-0.5 w-full bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-400" />

        {/* Üst Satır (Menüler & Pencere Kontrolleri) */}
        <div className="h-9 flex items-center justify-between px-3 border-b border-slate-200/50 dark:border-slate-800/50">
          {/* Sol: Logo & Uygulama Menüleri */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm tracking-tight">
              <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                F
              </div>
              <span>FLOWDESK 360</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                Süreç Masası
              </span>
            </div>

            {/* Menü Öğeleri */}
            <nav className="flex items-center space-x-1 pl-3 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setShowNewProcessModal(true)}
              >
                Dosya
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setActiveTab("processes")}
              >
                Süreçler
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setActiveTab("templates")}
              >
                Şablonlar
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setActiveTab("kanban")}
              >
                Görünüm
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setActiveTab("history")}
              >
                Denetim
              </button>
              <button
                type="button"
                className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
                onClick={refreshData}
              >
                <span className={loading ? "animate-spin inline-block" : ""}>
                  ↻
                </span>
                <span>{loading ? "Yükleniyor..." : "Yenile"}</span>
              </button>
            </nav>
          </div>

          {/* Orta: Aktif Çalışma Süreci */}
          <div className="flex-1 flex items-center justify-center px-4">
            {currentProcess
              ? (
                <div className="flex items-center space-x-2 text-xs bg-slate-200/50 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-300/40 dark:border-slate-700/50 max-w-md truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {currentProcess.baslik}
                  </span>
                  <span className="text-slate-400">({currentProcess.id})</span>
                </div>
              )
              : (
                <span className="text-xs text-slate-400">
                  Genel Kurumsal Süreç Çalışma Alanı
                </span>
              )}
          </div>

          {/* Sağ: Arama, Tema ve Pencere Kontrolleri */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title={isDarkMode ? "Açık Tema" : "Koyu Tema"}
            >
              {isDarkMode
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />}
            </button>

            {/* Pencere Kontrolleri */}
            <div className="flex items-center pl-2 space-x-1 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                onClick={() => {}}
                title="Simge Durumuna Küçült"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                onClick={() => {}}
                title="Ekranı Kapla"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-red-600 hover:text-white text-slate-500 dark:text-slate-400 transition-colors"
                onClick={() => {}}
                title="Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Alt Satır (Hızlı Eylem Çubuğu & Aktör / Rol Seçici) */}
        <div className="h-11 px-4 flex items-center justify-between bg-slate-100/90 dark:bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowNewProcessModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Süreç Başlat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hazır Şablonlar ({templates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
              <span>Görev Panosu</span>
            </button>
          </div>

          {/* Aktif Rol & Sorumlu Seçici (Temin 360 Yetkili Seçici Tarzı) */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Aktif Makam / Rol:</span>
            </span>
            <select
              value={activeActorRole}
              onChange={(e) => {
                const val = e.target.value as
                  | "personel"
                  | "amir"
                  | "uzman"
                  | "yetkili";
                setActiveActorRole(val);
                if (val === "amir") {
                  setActiveActorName("Ahmet Yılmaz (Şube Müdürü)");
                } else if (val === "yetkili") {
                  setActiveActorName("Mehmet Kaya (Harcama Yetkilisi)");
                } else if (val === "uzman") {
                  setActiveActorName("Elif Demir (Süreç Uzmanı)");
                } else setActiveActorName("Ali Veli (Birim Personeli)");
              }}
              className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="amir">Şube Müdürü / Birim Amiri</option>
              <option value="yetkili">Harcama / İhale Yetkilisi</option>
              <option value="uzman">Süreç ve Muayene Uzmanı</option>
              <option value="personel">Talep Eden Personel</option>
            </select>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
              {activeActorName}
            </span>
          </div>
        </div>
      </header>

      {
        /* =========================================================================
          2. GÖVDE: SIDEBAR + CONTENT (Temin 360 Birebir Düzen)
          ========================================================================= */
      }
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR (Katlanabilir Koyu Kurumsal Menü) */}
        <aside
          className={`flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-200 relative shrink-0 z-40 select-none ${
            sidebarCollapsed ? "w-16" : "w-60"
          }`}
        >
          {/* Sidebar Üst Başlık */}
          <div className="h-12 flex items-center justify-between px-3 border-b border-slate-800">
            {!sidebarCollapsed
              ? (
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-wide text-white uppercase">
                      Kurum Yönetimi
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Dinamik İş Akışları
                    </span>
                  </div>
                </div>
              )
              : <Building2 className="w-5 h-5 text-blue-400 mx-auto" />}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title={sidebarCollapsed ? "Genişlet" : "Daralt"}
            >
              {sidebarCollapsed
                ? <ChevronRight className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Menü Grupları */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {/* 1. Grup: Süreç Yönetimi */}
            <div>
              {!sidebarCollapsed && (
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  Süreç Yönetimi
                </div>
              )}
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("processes")}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "processes"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title="Aktif Süreçler"
                >
                  <FolderGit2 className="w-4 h-4 shrink-0 text-blue-400" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">Tüm Süreçler</span>
                  )}
                  {!sidebarCollapsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {processes.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("kanban")}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "kanban"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title="Süreç Panosu (Kanban)"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-indigo-400" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">Kanban Panosu</span>
                  )}
                </button>
              </nav>
            </div>

            {/* 2. Grup: Şablonlar & Tasarım */}
            <div>
              {!sidebarCollapsed && (
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  Şablonlar & Formlar
                </div>
              )}
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("templates")}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "templates"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title="Hazır Şablonlar"
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">Süreç Şablonları</span>
                  )}
                  {!sidebarCollapsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300">
                      {templates.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* 3. Grup: Görevler & Belgeler */}
            <div>
              {!sidebarCollapsed && (
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  Görevler & Onaylar
                </div>
              )}
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("tasks")}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "tasks"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title="Görevler ve Onaylar"
                >
                  <ListTodo className="w-4 h-4 shrink-0 text-emerald-400" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">Görev Listesi</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    activeTab === "history"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title="Denetlenebilir Tarihçe"
                >
                  <History className="w-4 h-4 shrink-0 text-cyan-400" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">İşlem Tarihçesi</span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Sidebar Alt Profil & Ayarlar */}
          <div className="p-2 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-2 px-2 py-2 rounded-md bg-slate-800/60">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                AY
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white truncate text-[11px]">
                    {activeActorName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    flowdesk.db (Aktif)
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ANA ÇALIŞMA ALANI */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
          {/* Üst Özet / İstatistik Kartları (Temin 360 Stili 4'lü Grid) */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
            {/* Kart 1: Toplam Süreç */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Toplam Süreç
                </span>
                <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                  {stats.total}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FolderGit2 className="w-5 h-5" />
              </div>
            </div>

            {/* Kart 2: Aktif / Devam Eden */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Aktif Yürütülen
                </span>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {stats.active}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Play className="w-5 h-5" />
              </div>
            </div>

            {/* Kart 3: Bekleyen Onay / İşlem */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Bekleyen Onaylar
                </span>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {stats.pending}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Kart 4: Tamamlanan Süreçler */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Sonuçlanan / Tamamlanan
                </span>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {stats.completed}
                </div>
              </div>
              <div className="w-9 h-9 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filtre ve Arama Çubuğu (Temin 360 Tablo Üstü Standart Bar) */}
          <div className="px-4 pb-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Süreç adı, kodu veya açıklama ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Durum Filtresi */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="aktif">Aktif Yürütülen</option>
                <option value="beklemede">Beklemede / Onayda</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="iptal">İptal Edildi</option>
              </select>
            </div>

            {/* Görünüm Geçiş Sekmeleri */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-md text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("processes")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === "processes"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Tablo Listesi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("kanban")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === "kanban"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Kanban Kartları
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("templates")}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === "templates"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Şablon Kataloğu
              </button>
            </div>
          </div>

          {/* Dinamik İçerik Alanı (Tablo & Detay Drawer) */}
          <div className="flex-1 flex overflow-hidden px-4 pb-3 gap-3">
            {/* Sol: Süreç Tablosu / Listesi */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden">
              {activeTab === "processes" && (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold sticky top-0">
                        <th className="py-2.5 px-3">Süreç Kodu & Adı</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Başlatan / Birim</th>
                        <th className="py-2.5 px-3">Durum</th>
                        <th className="py-2.5 px-3">İlerleme</th>
                        <th className="py-2.5 px-3">Tarih</th>
                        <th className="py-2.5 px-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredProcesses.length === 0
                        ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center py-12 text-slate-400"
                            >
                              Henüz kayıtlı süreç bulunmuyor. Yeni bir süreç
                              başlatabilirsiniz.
                            </td>
                          </tr>
                        )
                        : (
                          filteredProcesses.map((proc) => {
                            const isSelected = proc.id === selectedProcessId;
                            return (
                              <tr
                                key={proc.id}
                                onClick={() => handleSelectProcess(proc)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                                    {proc.baslik}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {proc.id}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                    {proc.kategori}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                                  <div>{proc.baslatanKisi}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {proc.baslatanBirim || "Genel Birim"}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      proc.durum === "aktif"
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                        : proc.durum === "beklemede"
                                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                        : proc.durum === "tamamlandi"
                                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    {proc.durum.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{
                                        width: `${proc.ilerlemeYuzdesi}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    %{proc.ilerlemeYuzdesi}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                                  {proc.createdAt.slice(0, 10)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectProcess(proc);
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                  >
                                    İncele &gt;
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Kanban Görünümü */}
              {activeTab === "kanban" && (
                <div className="flex-1 p-3 grid grid-cols-1 md:grid-cols-4 gap-3 overflow-x-auto">
                  {["taslak", "aktif", "beklemede", "tamamlandi"].map((col) => {
                    const colProcs = processes.filter((p) => p.durum === col);
                    return (
                      <div
                        key={col}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 flex flex-col border border-slate-200/80 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                            {col}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {colProcs.length}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {colProcs.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectProcess(p)}
                              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md cursor-pointer hover:shadow-xs transition-shadow"
                            >
                              <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                                {p.baslik}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Başlatan: {p.baslatanKisi}
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[10px]">
                                <span className="text-blue-600 dark:text-blue-400 font-mono">
                                  {p.id}
                                </span>
                                <span className="font-semibold text-slate-500">
                                  %{p.ilerlemeYuzdesi}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Şablon Kataloğu */}
              {activeTab === "templates" && (
                <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
                  {templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between hover:border-blue-500 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            {tpl.kod}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            v{tpl.versiyon}.0
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-2">
                          {tpl.ad}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {tpl.aciklama}
                        </p>

                        <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{tpl.adimlar.length} Adımlı Kurumsal Akış</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(tpl.id);
                            setNewProcessTitle(
                              `${tpl.ad} - ${
                                new Date().toLocaleDateString("tr-TR")
                              }`,
                            );
                            setShowNewProcessModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Bu Şablonla Başlat</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Görev Panosu */}
              {activeTab === "tasks" && (
                <div className="flex-1 p-3 overflow-y-auto">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Tüm Açık ve Bekleyen Görevler
                  </div>
                  <div className="space-y-2">
                    {selectedProcessTasks.length === 0
                      ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          Bir süreç seçildiğinde ilgili adımlara ait görevler
                          burada listelenir.
                        </div>
                      )
                      : (
                        selectedProcessTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <CheckCircle2
                                className={`w-4 h-4 ${
                                  t.tamamlandi
                                    ? "text-emerald-500"
                                    : "text-slate-400"
                                }`}
                              />
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-100">
                                  {t.gorevTanimi}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Atanan: {t.atananKisi} | Öncelik: {t.oncelik}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                t.tamamlandi
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                  : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              {t.tamamlandi ? "Tamamlandı" : "Bekliyor"}
                            </span>
                          </div>
                        ))
                      )}
                  </div>
                </div>
              )}

              {/* Denetim Tarihçesi */}
              {activeTab === "history" && (
                <div className="flex-1 p-3 overflow-y-auto">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Denetlenebilir Süreç Tarihçesi (LOG_SurecTarihce)
                  </div>
                  <div className="space-y-2">
                    {selectedProcessHistory.length === 0
                      ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          Bir süreç seçtiğinizde denetim kayıtları zaman
                          çizelgesi olarak listelenir.
                        </div>
                      )
                      : (
                        selectedProcessHistory.map((h) => (
                          <div
                            key={h.id}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">
                                [{h.eylem}]
                              </span>
                              <span className="ml-2 text-slate-700 dark:text-slate-200">
                                {h.aciklama}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                İşlem Yapan: {h.yapanKisi}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {h.tarihSaat}
                            </span>
                          </div>
                        ))
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ: Seçili Süreç Detay & Adım Yürütme Paneli */}
            {currentProcess && (
              <div className="w-80 lg:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col overflow-hidden shrink-0">
                {/* Detay Başlığı */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {currentProcess.id}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {currentProcess.baslik}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProcessId(null)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Adım İlerleme Çizelgesi */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Süreç Aşamaları & Adımlar</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                      {selectedProcessSteps.filter((s) =>
                        s.durum === "tamamlandi"
                      ).length} / {selectedProcessSteps.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedProcessSteps.map((step, idx) => {
                      const isComplete = step.durum === "tamamlandi";
                      const isCurrent = step.durum === "devam_ediyor" ||
                        (!isComplete && idx === 0);
                      return (
                        <div
                          key={step.id}
                          className={`p-2.5 rounded-md border text-xs transition-colors ${
                            isComplete
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                              : isCurrent
                              ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {step.sira}. {step.baslik}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                isComplete
                                  ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100"
                                  : isCurrent
                                  ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {step.durum}
                            </span>
                          </div>

                          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            Tür: {step.adimTuru} | Sorumlu:{" "}
                            {step.sorumluRol || step.sorumluBirim ||
                              "Tüm Roller"}
                          </div>

                          {/* Adım Eylemleri */}
                          {!isComplete && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleRejectStep(step)}
                                className="px-2 py-1 text-[10px] font-semibold rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200"
                              >
                                Reddet / İade
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompleteStep(step)}
                                className="px-2.5 py-1 text-[10px] font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Adımı Onayla & Tamamla</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* İlişkili Belgeler Bölümü */}
                  {selectedProcessDocs.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                        <span>İlişkili Süreç Belgeleri</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                          {selectedProcessDocs.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {selectedProcessDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                                {doc.belgeAdi}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {doc.olusturanKisi}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {doc.belgeTuru}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {
        /* =========================================================================
          3. FOOTER (Temin 360 & İhale 360 Alt Durum Çubuğu)
          ========================================================================= */
      }
      <footer className="h-6 bg-slate-200 dark:bg-slate-900 border-t border-slate-300/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sistem Hazır</span>
          </span>
          <span>|</span>
          <span>Bağlantı: SQLite (flowdesk.db)</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>FLOWDESK 360 v1.0.0-rc.9</span>
          <span>|</span>
          <span>{new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </footer>

      {
        /* =========================================================================
          4. MODAL: YENİ SÜREÇ BAŞLATMA SİHİRBAZI
          ========================================================================= */
      }
      {showNewProcessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl w-full max-w-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Yeni Süreç Başlat</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewProcessModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Süreç Şablonu Seçin *
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full py-2 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Bir Şablon Seçin --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.kod}] {t.ad} ({t.adimlar.length} Adım)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Süreç Başlığı / Konusu *
                </label>
                <input
                  type="text"
                  placeholder="Örn: 2026 Yılı Sunucu ve Güvenlik Duvarı Bakım Talebi"
                  value={newProcessTitle}
                  onChange={(e) => setNewProcessTitle(e.target.value)}
                  className="w-full py-2 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Açıklama ve İhtiyaç Gerekçesi
                </label>
                <textarea
                  rows={3}
                  placeholder="Süreçle ilgili detaylı notlar veya gerekçe..."
                  value={newProcessDesc}
                  onChange={(e) => setNewProcessDesc(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewProcessModal(false)}
                className="px-3 py-1.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCreateProcess}
                disabled={!newProcessTitle.trim() || !selectedTemplateId}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                Süreci Başlat & Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
