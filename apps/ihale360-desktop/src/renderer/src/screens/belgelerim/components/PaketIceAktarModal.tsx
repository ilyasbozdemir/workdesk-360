/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { X, Upload, CheckCircle2, AlertCircle, FileJson } from 'lucide-react'
import { kutuphaneService, BelgePaketi } from '../services/kutuphaneService'

interface PaketIceAktarModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaketIceAktarModal({
  isOpen,
  onClose,
  onSuccess
}: PaketIceAktarModalProps): React.JSX.Element | null {
  const [fileContent, setFileContent] = useState<string>('')
  const [parsedPaket, setParsedPaket] = useState<BelgePaketi | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [conflictAction, setConflictAction] = useState<'copy' | 'overwrite'>('copy')

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setFileContent(text)
      parseAndValidate(text)
    }
    reader.readAsText(file)
  }

  const parseAndValidate = (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText)
      const res = kutuphaneService.validateImportPaketi(data)
      if (!res.valid) {
        setValidationError(res.error || 'Paket geçersiz')
        setParsedPaket(null)
      } else {
        setValidationError(null)
        setParsedPaket(data)
      }
    } catch (err: any) {
      setValidationError('Geçersiz JSON formatı: ' + err.message)
      setParsedPaket(null)
    }
  }

  const handleImport = async () => {
    if (!parsedPaket) return

    try {
      const docName =
        conflictAction === 'copy' ? `${parsedPaket.belge.ad} (İçe Aktarılan)` : parsedPaket.belge.ad

      // 1. Belge oluştur
      const initialSurum = parsedPaket.surumler[0] || {
        icerik_html: '<p></p>',
        kosullar_json: '[]'
      }

      const createRes = await kutuphaneService.createBelge({
        ad: docName,
        etiketler: parsedPaket.belge.etiketler,
        icerik_html: initialSurum.icerik_html,
        kosullar_json: initialSurum.kosullar_json
      })

      // 2. Diğer sürümleri ekle (varsa)
      for (let i = 1; i < parsedPaket.surumler.length; i++) {
        const s = parsedPaket.surumler[i]
        await kutuphaneService.saveRevision({
          belge_id: createRes.belgeId,
          etiket: s.etiket,
          not: s.not,
          icerik_html: s.icerik_html,
          kosullar_json: s.kosullar_json
        })
      }

      // 3. Yer tutucuları kaydet (çakışma yoksa)
      if (Array.isArray(parsedPaket.yerTutucular)) {
        for (const yt of parsedPaket.yerTutucular) {
          if (yt.anahtar && yt.etiket) {
            await kutuphaneService.saveYerTutucu({
              anahtar: yt.anahtar,
              etiket: yt.etiket,
              tip: yt.tip || 'metin',
              varsayilan: yt.varsayilan ? String(yt.varsayilan) : null,
              kapsam: 'genel'
            })
          }
        }
      }

      alert('Belge paketi başarıyla içe aktarıldı.')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert('İçe aktarma başarısız: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                JSON Belge Paketi İçe Aktar
              </h3>
              <p className="text-xs text-slate-500">
                Dışa aktarılmış .json paketlerini bütünlük kontrolüyle yükleyin
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dosya Seçim Alanı */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors mb-4">
          <FileJson className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
            Paket dosyasını seçin (.json)
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        {/* Hata Durumu */}
        {validationError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Başarılı Paket Doğrulama Özeti */}
        {parsedPaket && (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Paket Doğrulandı (Checksum Geçerli)
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
              <div>
                <strong>Belge:</strong> {parsedPaket.belge.ad}
              </div>
              <div>
                <strong>Sürüm Sayısı:</strong> {parsedPaket.surumler.length} adet
              </div>
              <div>
                <strong>Yer Tutucular:</strong> {parsedPaket.yerTutucular?.length || 0} adet
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800/40">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                İsim Çakışması Davranışı:
              </label>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="conflict"
                    checked={conflictAction === 'copy'}
                    onChange={() => setConflictAction('copy')}
                  />
                  Yeni Kopya Olarak Ekle
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="conflict"
                    checked={conflictAction === 'overwrite'}
                    onChange={() => setConflictAction('overwrite')}
                  />
                  Aynı İsimle Kaydet
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Eylemler */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            Vazgeç
          </button>
          <button
            disabled={!parsedPaket}
            onClick={handleImport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            İçe Aktarımı Tamamla
          </button>
        </div>
      </div>
    </div>
  )
}
