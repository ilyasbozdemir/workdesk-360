import React from 'react'
import {
  FileJson,
  Database,
  FolderOpen,
  Building,
  Cpu,
  Layers,
  Calendar,
  AlertTriangle,
  Info,
  Check,
  Copy
} from 'lucide-react'
import { useTabStore } from '../../../store/tabStore'

import { WorkspaceMeta } from '../../../store/workspaceStore'

type PackageFile = 'meta.json' | 'database.sqlite' | 'attachments/'

interface TableStat {
  tableName: string
  label: string
  count: number
  description: string
}

interface SelectedFileInspectorProps {
  selectedFile: PackageFile
  rawJson: string
  activeMeta: WorkspaceMeta | null
  loadingStats: boolean
  statsError: string | null
  dbStats: TableStat[]
  activeFilePath: string | null
  copied: boolean
  handleCopyPath: () => void
}

export const SelectedFileInspector: React.FC<SelectedFileInspectorProps> = ({
  selectedFile,
  rawJson,
  activeMeta,
  loadingStats,
  statsError,
  dbStats,
  activeFilePath,
  copied,
  handleCopyPath
}) => {
  const { addTab } = useTabStore()

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[460px] flex flex-col justify-between animate-in fade-in duration-200">
      <div className="space-y-5 flex-1 flex flex-col">
        {/* Header of selected file detail */}
        <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {selectedFile === 'meta.json' && <FileJson className="w-5 h-5 text-blue-600" />}
            {selectedFile === 'database.sqlite' && (
              <Database className="w-5 h-5 text-emerald-600" />
            )}
            {selectedFile === 'attachments/' && <FolderOpen className="w-5 h-5 text-amber-500" />}
            <div>
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 font-mono">
                {selectedFile}
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500">
                {selectedFile === 'meta.json' && 'Dosya sürüm ve yapılandırma bilgileri (Üst Veri)'}
                {selectedFile === 'database.sqlite' &&
                  'İhale/temin verilerini barındıran yerel SQLite veritabanı'}
                {selectedFile === 'attachments/' &&
                  'Teklif mektupları, teknik şartnameler ve diğer resmi ekler dizini'}
              </p>
            </div>
          </div>
        </div>

        {/* Content of selected file detail */}
        <div className="flex-1 flex flex-col justify-center">
          {selectedFile === 'meta.json' && (
            <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between">
              {/* JSON Code block */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 font-mono text-[11px] bg-slate-950 text-slate-300 p-4 shadow-inner relative mt-2 flex-1">
                <div className="absolute top-2.5 right-2.5 text-[10px] text-slate-600 dark:text-slate-500 font-sans font-semibold uppercase select-none">
                  read-only view
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                  {rawJson}
                </pre>
              </div>

              {/* Meta Table info summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-850 rounded-2xl">
                  <Building className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="overflow-hidden">
                    <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">
                      Kurum
                    </span>
                    <span
                      className="text-xs font-bold text-slate-700 dark:text-slate-355 truncate block"
                      title={activeMeta?.institution}
                    >
                      {activeMeta?.institution || 'Belirtilmemiş'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-850 rounded-2xl">
                  <Cpu className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">
                      Uygulama Sürümü
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      v{activeMeta?.app_version || '1.0.0'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-850 rounded-2xl">
                  <Layers className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">
                      DB Şema Sürümü
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      v{activeMeta?.schema_version || '1'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-850 rounded-2xl">
                  <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase">
                      Oluşturulma
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      {activeMeta?.created_at || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedFile === 'database.sqlite' && (
            <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col justify-between mt-2">
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-955/5 shadow-inner">
                <div className="grid grid-cols-12 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-bold text-xs text-slate-650 dark:text-slate-400">
                  <div className="col-span-5">Tablo Adı</div>
                  <div className="col-span-3 text-center">Kayıt Sayısı</div>
                  <div className="col-span-4">Açıklama</div>
                </div>

                {loadingStats ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    İstatistikler okunuyor...
                  </div>
                ) : statsError ? (
                  <div className="p-6 text-center text-xs text-rose-500 font-semibold flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {statsError}
                  </div>
                ) : dbStats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    Tablo bilgisi bulunamadı.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-855 max-h-56 overflow-y-auto custom-scrollbar">
                    {dbStats.map((stat) => (
                      <div
                        key={stat.tableName}
                        className="grid grid-cols-12 p-3 text-xs items-center hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                      >
                        <div
                          className="col-span-5 font-mono font-bold text-slate-700 dark:text-slate-300 truncate"
                          title={stat.tableName}
                        >
                          {stat.tableName}
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-955/40 px-2 py-0.5 rounded border border-emerald-100/40 dark:border-emerald-900/20 font-mono text-[10px]">
                            {stat.count.toLocaleString('tr-TR')} satır
                          </span>
                        </div>
                        <div
                          className="col-span-4 text-[10px] text-slate-550 dark:text-slate-455 truncate"
                          title={stat.description}
                        >
                          {stat.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-955/15 border border-emerald-250/30 dark:border-emerald-900/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-655 dark:text-slate-350">
                <div className="flex items-start gap-2.5">
                  <Database className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-slate-200 mb-0.5">
                      SQLite Veritabanı Sağlığı
                    </span>
                    Veritabanı yapısı en güncel şema sürümü olan{' '}
                    <strong>v{activeMeta?.schema_version || '1'}</strong> sürümündedir.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addTab('/dosya/veritabani')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer shrink-0 font-sans"
                >
                  🔍 Veritabanını İncele
                </button>
              </div>
            </div>
          )}

          {selectedFile === 'attachments/' && (
            <div className="space-y-4 animate-in fade-in duration-200 mt-2">
              <div className="border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center bg-slate-50/40 dark:bg-slate-955/10">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-955/20 rounded-2xl flex items-center justify-center text-amber-500 mb-3 shadow-inner">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ek Dokümanlar Dizini
                </h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-2 max-w-sm leading-relaxed">
                  Doğrudan temin dosyalarınıza yüklediğiniz piyasa teklif mektupları, yaklaşık
                  maliyet cetvelleri, teknik şartnameler veya onay belgeleri bu dizinde saklanır.
                </p>
              </div>

              <div className="p-4 bg-amber-50/40 dark:bg-amber-955/10 border border-amber-250/35 dark:border-amber-900/30 rounded-2xl flex gap-2.5 text-xs text-slate-655 dark:text-slate-400">
                <Info className="w-4 h-4 text-amber-555 shrink-0 mt-0.5" />
                <span>
                  Ekler, dosya açıldığında geçici olarak işletim sisteminin geçici dizinine (Temp)
                  çıkarılır ve üzerinde işlem yapılır. Dosya kapatıldığında ise tüm ekler
                  verilerinizle birlikte sıkıştırılarak <strong>.temin</strong> dosyasına gömülür.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dosya Konumu ve Kopyalama Bölümü */}
      {activeFilePath && (
        <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-6 space-y-2">
          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-455 uppercase tracking-wide">
            Disk Üzerindeki Dosya Konumu
          </label>
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner">
            <span
              className="text-[10px] font-mono text-slate-500 dark:text-slate-400 break-all select-all flex-1 px-1"
              title={activeFilePath}
            >
              {activeFilePath}
            </span>
            <button
              type="button"
              onClick={handleCopyPath}
              className={`p-2 rounded-xl transition-all border shrink-0 flex items-center justify-center cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800/40'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-850'
              }`}
              title="Yolu Panoya Kopyala"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
