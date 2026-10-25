import React, { useState } from 'react'
import { UploadCloud, FileCheck2, Trash2, Eye } from 'lucide-react'
import { YuklenenEvrak } from '../types'

interface SignedUploadDropzoneProps {
  yuklenenler: YuklenenEvrak[]
  onYukle: (evrak: YuklenenEvrak) => void
  onSil: (id: string) => void
}

export const SignedUploadDropzone: React.FC<SignedUploadDropzoneProps> = ({
  yuklenenler,
  onYukle,
  onSil
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleSimulatedUpload = () => {
    const dummyEvrak: YuklenenEvrak = {
      id: `evrak-${Date.now()}`,
      dosyaAdi: `Islak_Imzali_Tutanak_${new Date().toISOString().slice(0, 10)}.pdf`,
      boyut: '2.4 MB',
      yuklemeTarihi: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    onYukle(dummyEvrak)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            İmzalı (Taranmış) Belge Yükleme
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">PDF, TIFF, JPEG (Maks. 25 MB)</span>
      </div>

      {/* Dropzone Alanı */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleSimulatedUpload()
        }}
        onClick={handleSimulatedUpload}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/20'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Taranmış Islak İmzalı Belgeyi Buraya Sürükleyin veya Seçin
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Fiziki imza süreci tamamlanan evrakları arşivlemek üzere sisteme aktarın.
          </p>
        </div>
      </div>

      {/* Yüklenen Belgeler Listesi */}
      {yuklenenler.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Yüklenen İmzalı Nüshalar ({yuklenenler.length})
          </div>
          {yuklenenler.map((evrak) => (
            <div
              key={evrak.id}
              className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {evrak.dosyaAdi}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {evrak.boyut} • Saat {evrak.yuklemeTarihi}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSil(evrak.id)}
                  aria-label="Evrak Sil"
                  className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
