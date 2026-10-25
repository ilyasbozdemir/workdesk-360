import React from 'react'
import { FolderClock, X, Trash2, ArrowRight, Clock, FileText } from 'lucide-react'
import { useEbysStudioStore, type EbysDraftItem } from '../../store/ebysStudioStore'

interface DraftsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectDraft: (draft: EbysDraftItem) => void
}

export const DraftsModal: React.FC<DraftsModalProps> = ({ isOpen, onClose, onSelectDraft }) => {
  const { drafts, deleteDraft } = useEbysStudioStore()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FolderClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Kayıtlı Çalışmalar &amp; Taslaklar
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {drafts.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Önceden kaydettiğiniz çalışma taslaklarını açıp düzenlemeye devam edin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2.5">
          {drafts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Henüz kaydedilmiş bir taslak çalışma bulunmuyor.
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                TipTap editöründe hazırladığınız yazıları "Taslağı Kaydet" butonu ile
                saklayabilirsiniz.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-sm transition"
              >
                <div className="space-y-1 flex-1 min-w-0 pr-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {draft.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>Son Güncelleme: {draft.updatedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => deleteDraft(draft.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Taslağı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDraft(draft)
                      onClose()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer"
                  >
                    <span>Aç</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
