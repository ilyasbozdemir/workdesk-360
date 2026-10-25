/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { X, GitCommit, RotateCcw, SplitSquareVertical, Clock } from 'lucide-react'
import { KutuphaneBelgeSurum, kutuphaneService } from '../services/kutuphaneService'
import { computeTextDiff, DiffChunk } from '../utils/simpleDiff'

interface SurumGecmisiModalProps {
  isOpen: boolean
  onClose: () => void
  belgeId: number
  belgeAdi: string
  surumler: KutuphaneBelgeSurum[]
  aktifSurumId: number | null
  onRestore: () => void
}

export function SurumGecmisiModal({
  isOpen,
  onClose,
  belgeId,
  belgeAdi,
  surumler,
  aktifSurumId,
  onRestore
}: SurumGecmisiModalProps): React.JSX.Element | null {
  const [selectedSurum1, setSelectedSurum1] = useState<number | null>(surumler[0]?.id || null)
  const [selectedSurum2, setSelectedSurum2] = useState<number | null>(surumler[1]?.id || null)
  const [showDiff, setShowDiff] = useState(false)

  if (!isOpen) return null

  const s1 = surumler.find((s) => s.id === selectedSurum1) || surumler[0]
  const s2 = surumler.find((s) => s.id === selectedSurum2) || surumler[1] || s1

  let diffChunks: DiffChunk[] = []
  if (s1 && s2 && s1.id !== s2.id) {
    diffChunks = computeTextDiff(s2.icerik_html || '', s1.icerik_html || '')
  }

  const handleRestore = async (surum: KutuphaneBelgeSurum) => {
    if (
      !confirm(
        `"${surum.etiket}" sürümünü yeni bir sürüm olarak geri yüklemek istediğinize emin misiniz?`
      )
    )
      return

    try {
      await kutuphaneService.saveRevision({
        belge_id: belgeId,
        etiket: `${surum.etiket} (Geri Yüklendi)`,
        not: `${surum.etiket} sürümünden geri yüklendi`,
        icerik_html: surum.icerik_html,
        kosullar_json: surum.kosullar_json
      })
      alert('Sürüm başarıyla geri yüklendi.')
      onRestore()
      onClose()
    } catch (err: any) {
      alert('Geri yüklenemedi: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Sürüm Geçmişi & Karşılaştırma
              </h2>
              <p className="text-xs text-slate-500">
                {belgeAdi} belgesine ait değişmez revizyon kayıtları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol: Sürüm Listesi */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Tüm Sürümler ({surumler.length})
              </span>
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                  showDiff
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" /> Fark (Diff)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {surumler.map((surum) => {
                const isCurrentActive = surum.id === aktifSurumId
                const isSelected = surum.id === selectedSurum1

                return (
                  <div
                    key={surum.id}
                    onClick={() => setSelectedSurum1(surum.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-blue-600" />
                        {surum.etiket || `Sürüm ${surum.surum_no}`}
                      </span>
                      {isCurrentActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      {surum.not || 'Not belirtilmemiş'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(surum.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      {!isCurrentActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestore(surum)
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <RotateCcw className="w-3 h-3" /> Geri Yükle
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sağ: Önizleme veya Diff */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {showDiff ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/40 dark:bg-amber-950/10">
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                    Sürüm Karşılaştırma: {s2?.etiket} ➔ {s1?.etiket}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Karşılaştırılan:</span>
                    <select
                      value={selectedSurum2 || ''}
                      onChange={(e) => setSelectedSurum2(Number(e.target.value))}
                      className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {surumler.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.etiket} (v{s.surum_no})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed custom-scrollbar">
                  {diffChunks.map((chunk, idx) => {
                    if (chunk.type === 'added') {
                      return (
                        <span
                          key={idx}
                          className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded mr-1"
                        >
                          {chunk.text}
                        </span>
                      )
                    }
                    if (chunk.type === 'removed') {
                      return (
                        <span
                          key={idx}
                          className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 line-through px-1 py-0.5 rounded mr-1"
                        >
                          {chunk.text}
                        </span>
                      )
                    }
                    return (
                      <span key={idx} className="text-slate-700 dark:text-slate-300 mr-1">
                        {chunk.text}
                      </span>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex justify-center bg-slate-100 dark:bg-slate-950">
                <div className="w-[210mm] min-h-[297mm] bg-white text-black p-8 shadow rounded border border-slate-200">
                  <div
                    className="prose max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: s1?.icerik_html || '' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
