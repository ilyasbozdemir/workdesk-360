import React from 'react'
import { Compass, Copy, Eye, FileText, Trash2, Upload, X } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { TeminFirmaItem } from './useIstekliFirmalarLogic'

interface IstekliFirmalarYasaklilikModalProps {
  activeFirma: TeminFirmaItem
  onClose: () => void
  onDeleteBelge: () => void
  onUploadBelge: () => void
  onUpdateStatus: (status: string) => void
}

export function IstekliFirmalarYasaklilikModal({
  activeFirma,
  onClose,
  onDeleteBelge,
  onUploadBelge,
  onUpdateStatus
}: IstekliFirmalarYasaklilikModalProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            Yasaklılık Sorgulama & Belge Yükleme
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            1. Sorgulanacak İstekli Bilgileri
          </span>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
            <div>
              <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">
                Yasaklanan Adı / Ünvan
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 break-all">
                  {activeFirma.unvan}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeFirma.unvan)
                    alert('Ünvan kopyalandı.')
                  }}
                  className="px-2 py-1 text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400 rounded-lg font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  Kopyala
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">
                  Vergi / Kimlik No
                </label>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {activeFirma.vergi_no || '-'}
                  </span>
                  {activeFirma.vergi_no && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeFirma.vergi_no!)
                        alert('Vergi numarası kopyalandı.')
                      }}
                      className="px-2 py-1 text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400 rounded-lg font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Kopyala
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 font-semibold mb-0.5">
                  Vergi Dairesi
                </label>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                  {activeFirma.vergi_dairesi || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            2. Sorgulama Kanalları (Yeni Pencerede Aç)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() =>
                window.electron?.ipcRenderer.send('window:open-external', {
                  url: 'https://ekapv2.kik.gov.tr/sorgulamalar/yasak-sorgulama',
                  title: 'EKAP Kamu İhale Yasaklı Sorgulama'
                })
              }
              className="flex flex-col items-center text-center p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-700 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="h-10 flex items-center justify-center mb-2">
                <img
                  src="https://ekapv2.kik.gov.tr/authzsvc/assets/ekap-logo-paths.svg"
                  alt="EKAP Logo"
                  className="h-7 object-contain brightness-95 group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const el = e.currentTarget.parentElement?.querySelector('.fallback-text')
                    if (el) (el as HTMLElement).style.display = 'block'
                  }}
                />
                <span className="fallback-text hidden text-sm font-bold text-slate-700 dark:text-slate-350">
                  EKAP Portal
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                EKAP Yasaklı Sorgula
              </span>
              <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                İhale Kayıt No, Vergi/TCKN, Unvan ile detaylı KİK sorgulaması yapın.
              </p>
            </button>
            <button
              onClick={() =>
                window.electron?.ipcRenderer.send('window:open-external', {
                  url: 'https://www.turkiye.gov.tr/kik-yasakli-sorgula',
                  title: 'e-Devlet KİK Yasaklılık Sorgulama'
                })
              }
              className="flex flex-col items-center text-center p-4 border border-slate-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-700 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-red-50/10 dark:hover:bg-red-900/5 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="h-10 flex items-center justify-center mb-2">
                <img
                  src="https://cdn.e-devlet.gov.tr/downloads/kurumsal-kimlik/logo/e-devlet-logo.png"
                  alt="e-Devlet Logo"
                  className="h-8 object-contain brightness-95 group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const el = e.currentTarget.parentElement?.querySelector('.fallback-text')
                    if (el) (el as HTMLElement).style.display = 'block'
                  }}
                />
                <span className="fallback-text hidden text-sm font-bold text-slate-700 dark:text-slate-350">
                  e-Devlet Kapısı
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                e-Devlet Yasaklı Sorgula
              </span>
              <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                Vergi No, Yasaklanan Adı ve TCKN/VKN ile e-Devlet kapısı üzerinden sorgulama yapın.
              </p>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            3. Sorgu Sonuç Belgesi Yükleme (PDF / Görsel)
          </span>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
            <p className="text-[10px] text-slate-500 leading-normal">
              Sorgulama sonucunu içeren ekran çıktısını PDF veya Görsel olarak kaydedip dosyaya
              ekleyin.
            </p>
            {activeFirma.yasaklilik_belgesi ? (
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {activeFirma.yasaklilik_belgesi.split('/').pop()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={async () => {
                      try {
                        const res = await window.electron.ipcRenderer.invoke(
                          'workspace:open-file',
                          activeFirma.yasaklilik_belgesi
                        )
                        if (!res.success) alert('Dosya açılamadı.')
                      } catch (err: any) {
                        alert('Hata: ' + err.message)
                      }
                    }}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                    title="Dosyayı Aç"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onDeleteBelge}
                    className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    title="Belgeyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onUploadBelge}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-blue-500/5 transition-all cursor-pointer text-slate-500 hover:text-blue-600"
              >
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-[11px] font-bold">Sonuç Belgesi Seçin ve Yükleyin</span>
                <span className="text-[9px] text-slate-400">
                  PDF, JPG, PNG formatları desteklenir.
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            4. Yasaklılık Durumunu İşaretleyin
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
            {['Sorgulanmadı', 'Temiz', 'Yasaklı'].map((status) => {
              const isActive = activeFirma.yasaklilik_durumu === status
              return (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(status)}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center',
                    isActive
                      ? status === 'Yasaklı'
                        ? 'bg-red-600 text-white shadow-md'
                        : status === 'Temiz'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {status === 'Sorgulanmadı' && '⚪ Sorgulanmadı'}
                  {status === 'Temiz' && '🟢 Temiz'}
                  {status === 'Yasaklı' && '🔴 Yasaklı'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="bg-slate-850 hover:bg-slate-900 text-white text-xs font-bold rounded-xl px-5 py-2 cursor-pointer"
          >
            Kapat ve Listeyi Güncelle
          </button>
        </div>
      </div>
    </div>
  )
}
