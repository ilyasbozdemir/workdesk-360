import React, { useState } from 'react'
import {
  Printer,
  Eye,
  FileSignature,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Download
} from 'lucide-react'
import { DocumentInfoForm } from './components/document-info-form'
import { SignerList } from './components/signer-list'
import { A4Preview } from './components/a4-preview'
import { StatusTimeline } from './components/status-timeline'
import { SignedUploadDropzone } from './components/signed-upload-dropzone'
import { INITIAL_BELGE_BILGILERI, INITIAL_IMZACILAR, INITIAL_SUREC_ASAMALARI } from './mock-data'
import {
  IslakImzaBelgeBilgileri,
  ImzaciSatiri,
  SurecAsamasi,
  YuklenenEvrak,
  IslakImzaDurum
} from './types'

interface IslakImzaliBelgeScreenProps {
  initialBilgiler?: Partial<IslakImzaBelgeBilgileri>
  isEmbedded?: boolean
}

export default function IslakImzaliBelgeScreen({
  initialBilgiler,
  isEmbedded = false
}: IslakImzaliBelgeScreenProps): React.JSX.Element {
  const [bilgiler, setBilgiler] = useState<IslakImzaBelgeBilgileri>({
    ...INITIAL_BELGE_BILGILERI,
    ...initialBilgiler
  })

  const [signers, setSigners] = useState<ImzaciSatiri[]>(INITIAL_IMZACILAR)
  const [asamalar, setAsamalar] = useState<SurecAsamasi[]>(INITIAL_SUREC_ASAMALARI)
  const [yuklenenler, setYuklenenler] = useState<YuklenenEvrak[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'takip'>('editor')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePrint = () => {
    showToast('Yazıcı çıktısı hazırlanıyor: A4 formatında fiziki imzaya gönderildi.')
    window.print()
  }

  const handleAsamaGuncelle = (durum: IslakImzaDurum, tamamlandi: boolean, not?: string) => {
    setAsamalar((prev) =>
      prev.map((a) =>
        a.durum === durum
          ? {
              ...a,
              tamamlandi,
              tarih: tamamlandi
                ? new Date().toISOString().slice(0, 16).replace('T', ' ')
                : undefined,
              not: not || a.not
            }
          : a
      )
    )
    showToast('Aşama durumu güncellendi.')
  }

  return (
    <div
      className={`w-full ${
        isEmbedded ? 'space-y-4' : 'min-h-screen bg-slate-50 dark:bg-slate-900/60 p-4 md:p-6'
      }`}
    >
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* 1. Üst Başlık & Eylemler */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-indigo-500 to-blue-600 text-white rounded-xl shadow-xs">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Islak İmzalı Belge &amp; Süreç Takip Stüdyosu
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Fiziki İmza Yönetimi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Elektronik imza dışındaki belgeleri yazdırıp ıslak imzalatın, paraf rotasını
              belirleyin ve teslim durumunu takip edin.
            </p>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Belge &amp; İmza Düzeni
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('takip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'takip'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              İmza Takip &amp; Arşiv
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Çıktı Al (Yazdır)</span>
          </button>
        </div>
      </div>

      {/* 2. Ana Çalışma Alanı */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Sol Panel: Form ve İmzacılar */}
          <div className="lg:col-span-6 space-y-4">
            <DocumentInfoForm
              bilgiler={bilgiler}
              onChange={(upd) => setBilgiler((prev) => ({ ...prev, ...upd }))}
            />
            <SignerList signers={signers} onChange={setSigners} />
          </div>

          {/* Sağ Panel: Canlı A4 Önizleme */}
          <div className="lg:col-span-6 bg-slate-100/80 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex justify-center overflow-x-auto">
            <A4Preview bilgiler={bilgiler} signers={signers} onPrintPreview={handlePrint} />
          </div>
        </div>
      )}

      {/* 3. Takip & Arşiv Sekmesi */}
      {activeTab === 'takip' && (
        <div className="space-y-4">
          <StatusTimeline asamalar={asamalar} onAsamaGuncelle={handleAsamaGuncelle} />
          <SignedUploadDropzone
            yuklenenler={yuklenenler}
            onYukle={(evr) => {
              setYuklenenler((prev) => [evr, ...prev])
              showToast('İmzalı belge başarıyla sisteme aktarıldı.')
            }}
            onSil={(id) => {
              setYuklenenler((prev) => prev.filter((e) => e.id !== id))
              showToast('İmzalı belge kaydı kaldırıldı.')
            }}
          />
        </div>
      )}
    </div>
  )
}
