import React from 'react'
import {
  Clock,
  ExternalLink,
  ChevronDown,
  ArrowUpRight,
  FileText,
  Filter,
  FileCheck2,
  Upload,
  Eye,
  Printer,
  CheckSquare
} from 'lucide-react'
import { Belge } from '../../types'
import {
  getStatusColor,
  getStatusLabel,
  getLineColor,
  getBelgeDurumBadge,
  getBelgeDurumLabel,
  resolveSurecBelgeKod
} from '../../utils/helpers'
import { useGlobalDocumentPreviewStore } from '../../../../../store/globalDocumentPreviewStore'
import { SUREC_STAGE_DEFINITIONS } from '../../constants/surecAsamalariConfig'

interface SurecTabProps {
  stagesWithStatus: Array<{
    id: number
    title: string
    status: 'completed' | 'in-progress' | 'pending'
    progress: number
    tasks: Array<{ name: string; done: boolean; tab: string }>
  }>
  filteredBelgeler: Belge[]
  selectedAsamaFilter: string
  setSelectedAsamaFilter: (asama: string) => void
  onToggleTask: (stageId: number, taskIndex: number) => void
  onSelectTab: (tab: string) => void
  onPreview?: (belge: Belge) => void
  onDosyalariEkle: (files: FileList | null, targetId: number) => void
  onNavigateCiktiMerkezi: () => void
}

export const SurecTab: React.FC<SurecTabProps> = ({
  stagesWithStatus,
  filteredBelgeler,
  selectedAsamaFilter,
  setSelectedAsamaFilter,
  onToggleTask,
  onSelectTab,
  onDosyalariEkle,
  onNavigateCiktiMerkezi
}) => {
  // Her belgenin içindeki kontrol checklist'i (İmzalı Nüsha, Onay/Sayı, Ekler, Teslim)
  const [belgeChecklist, setBelgeChecklist] = React.useState<
    Record<number | string, { imza?: boolean; onay?: boolean; ekler?: boolean; teslim?: boolean }>
  >(() => {
    try {
      const saved = localStorage.getItem('temin_surec_belge_checklist')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const toggleChecklistItem = (
    belgeId: number | string,
    key: 'imza' | 'onay' | 'ekler' | 'teslim'
  ): void => {
    setBelgeChecklist((prev) => {
      const current = prev[belgeId] || {}
      const updated = {
        ...prev,
        [belgeId]: {
          ...current,
          [key]: !current[key]
        }
      }
      try {
        localStorage.setItem('temin_surec_belge_checklist', JSON.stringify(updated))
      } catch (err) {
        console.warn('Checklist kaydedilemedi', err)
      }
      return updated
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Üst Bilgi */}
      <div className="bg-white dark:bg-slate-955 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <Clock className="text-blue-600 dark:text-blue-400" size={18} />5 Adımda Doğrudan Temin
            Süreci Takibi
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Görev kutularına tıklayarak süreci tamamlayın. İlgili aşamanın belgelerini hemen
            altındaki matristen yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateCiktiMerkezi}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 cursor-pointer transition-colors shadow-sm shadow-blue-500/20"
          >
            <ExternalLink size={14} /> Tüm Belgeler & Çıktı Merkezi
          </button>
        </div>
      </div>

      {/* 5 Aşama Şeridi */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        {stagesWithStatus.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flex-1 min-w-0 md:min-w-[190px] border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-955 overflow-hidden flex flex-col shadow-xs hover:border-blue-400 transition-all">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    {stage.id}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight">
                    {stage.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getLineColor(
                        stage.status
                      )}`}
                      style={{ width: `${stage.progress}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md border font-extrabold whitespace-nowrap ${getStatusColor(
                      stage.status
                    )}`}
                  >
                    {getStatusLabel(stage.status)}
                  </span>
                </div>
              </div>

              <div className="p-2 flex-1 space-y-1">
                {stage.tasks.map((task, taskIndex) => (
                  <div
                    key={taskIndex}
                    className="group flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <button
                      onClick={() => onToggleTask(stage.id, taskIndex)}
                      className="shrink-0 w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer"
                      style={{
                        borderColor: task.done ? '#10b981' : '#cbd5e1',
                        backgroundColor: task.done ? '#10b981' : 'transparent'
                      }}
                      title="Tamamlandı olarak işaretle"
                    >
                      {task.done && <span className="text-white text-[10px] font-bold">✓</span>}
                    </button>
                    <span
                      className={`flex-1 text-xs ${
                        task.done
                          ? 'text-slate-400 dark:text-slate-500 line-through'
                          : 'text-slate-800 dark:text-slate-200 font-semibold'
                      }`}
                    >
                      {task.name}
                    </span>
                    {task.tab && (
                      <button
                        onClick={() => onSelectTab(task.tab)}
                        className="shrink-0 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="İlgili sekmeye git"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {index < stagesWithStatus.length - 1 && (
              <>
                <div className="hidden md:flex items-center justify-center px-1">
                  <ChevronDown
                    className="text-slate-300 dark:text-slate-700 -rotate-90"
                    size={20}
                  />
                </div>
                <div className="flex md:hidden items-center justify-center py-1">
                  <ChevronDown className="text-slate-300 dark:text-slate-700" size={20} />
                </div>
              </>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Aşama Belgeleri Matrisi */}
      <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileText className="text-blue-600 dark:text-blue-400" size={18} />
              Aşamalara Göre Resmi Belgeler & İmzalı PDF Takibi
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tek tek indirmek yerine Çıktı Merkezi ile toplu alabilir, yükleme sonrası içerik
              kontrol tikleri ile eksiksiz takip edebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toplu İndir & Çıktı Merkezi Butonu */}
            <button
              onClick={onNavigateCiktiMerkezi}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Tüm Resmi Belgeleri Toplu Yazdır ve İndir"
            >
              <Printer size={14} />
              <span>Toplu Yazdır / Çıktı Merkezi</span>
            </button>

            {/* Aşama Filtresi */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <Filter size={14} className="text-slate-400 shrink-0 mr-1" />
              {['Tümü', ...SUREC_STAGE_DEFINITIONS.map((s) => s.title)].map((asama) => (
                <button
                  key={asama}
                  onClick={() => setSelectedAsamaFilter(asama)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAsamaFilter === asama
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {asama}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBelgeler.map((b) => {
            const checks = belgeChecklist[b.id] || {}
            const totalDone = [checks.imza, checks.onay, checks.ekler, checks.teslim].filter(
              Boolean
            ).length

            return (
              <div
                key={b.id}
                className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
              >
                {/* Üst Başlık & Durum */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText
                      size={18}
                      className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {b.ad}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-semibold">{b.asama}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md border font-extrabold shrink-0 ${
                      b.pdfDosyaAdi
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : getBelgeDurumBadge(b.durum)
                    }`}
                  >
                    {b.pdfDosyaAdi ? '✓ PDF Teslim Alındı' : getBelgeDurumLabel(b.durum)}
                  </span>
                </div>

                {/* Yüklenen PDF Detay Kutusu */}
                {b.pdfDosyaAdi && (
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                    <span className="truncate flex items-center gap-1.5 font-bold">
                      <FileCheck2 size={13} className="text-emerald-600" /> {b.pdfDosyaAdi}
                    </span>
                    <span className="shrink-0 text-slate-400 font-mono text-[9.5px]">
                      {b.pdfBoyut}
                    </span>
                  </div>
                )}

                {/* İçerik & Teslim Kontrol Tikleri (Checklist) */}
                <div className="bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <CheckSquare size={11} className="text-blue-500" /> İçerik & Evrak Kontrolü
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-extrabold ${totalDone === 4 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
                    >
                      {totalDone}/4 Hazır
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {/* 1. Islak İmza */}
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(b.id, 'imza')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all text-left cursor-pointer border ${
                        checks.imza
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Islak / e-İmza Tamamlandı"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] shrink-0 ${checks.imza ? 'bg-emerald-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}
                      >
                        {checks.imza ? '✓' : ''}
                      </span>
                      <span className="truncate">İmzalı Nüsha</span>
                    </button>

                    {/* 2. Onay / Sayı */}
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(b.id, 'onay')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all text-left cursor-pointer border ${
                        checks.onay
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Onay & Sayı Alındı"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] shrink-0 ${checks.onay ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}
                      >
                        {checks.onay ? '✓' : ''}
                      </span>
                      <span className="truncate">Sayı / Onay</span>
                    </button>

                    {/* 3. Şartname & Ekler */}
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(b.id, 'ekler')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all text-left cursor-pointer border ${
                        checks.ekler
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Ekler & Tutanaklar Tam"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] shrink-0 ${checks.ekler ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}
                      >
                        {checks.ekler ? '✓' : ''}
                      </span>
                      <span className="truncate">Ekler Tam</span>
                    </button>

                    {/* 4. Dosyalandı & Teslim */}
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(b.id, 'teslim')}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all text-left cursor-pointer border ${
                        checks.teslim
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Fiziki Dosyalandı & Teslim Edildi"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] shrink-0 ${checks.teslim ? 'bg-purple-600 text-white' : 'border border-slate-300 dark:border-slate-600'}`}
                      >
                        {checks.teslim ? '✓' : ''}
                      </span>
                      <span className="truncate">Dosyalandı</span>
                    </button>
                  </div>
                </div>

                {/* Alt Aksiyonlar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                    <Upload size={12} /> {b.pdfDosyaAdi ? 'PDF Güncelle' : 'PDF Yükle'}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => onDosyalariEkle(e.target.files, b.id)}
                    />
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        useGlobalDocumentPreviewStore.getState().openDocument({
                          documentId: b.kod || resolveSurecBelgeKod(b),
                          documentTitle: b.ad
                        })
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                      title="Önizle & Düzenle"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => {
                        useGlobalDocumentPreviewStore.getState().openDocument({
                          documentId: b.kod || resolveSurecBelgeKod(b),
                          documentTitle: b.ad
                        })
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Resmi Şablonu Yazdır & Dışa Aktar"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
