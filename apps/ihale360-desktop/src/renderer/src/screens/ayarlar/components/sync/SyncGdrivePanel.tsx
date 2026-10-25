import React from 'react'
import { Upload, Download, Cloud } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

export function SyncGdrivePanel(): React.JSX.Element {
  const handleOpenGdriveModal = () => {
    const event = new CustomEvent('open-gdrive-modal')
    window.dispatchEvent(event)
  }

  return (
    <div className="space-y-5">
      {/* Google Drive Bulut Depo Paneli */}
      <div className="bg-linear-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 rounded-2xl p-6 border border-emerald-200/60 dark:border-emerald-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-emerald-500" />
              Google Drive Bulut Depolama & Eşitleme Yöneticisi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Çalışma (.temin) dosyalarınızı doğrudan kişisel Google Drive hesabınıza yedekleyin,
              mevcut yedeklerinizi listeleyin ve istediğiniz dosyayı seçip bilgisayarınıza indirin.
            </p>
          </div>
          <Button
            onClick={handleOpenGdriveModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md shrink-0 flex items-center gap-2"
          >
            <Cloud size={16} /> Google Drive Bulut Yöneticisini Aç
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid for Google Drive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Upload size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Buluta Yükleme (Export)
              </h4>
              <p className="text-xs text-slate-500">Aktif .temin dosyanızı Drive'a gönderir</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Çalışma alanınızdaki tüm verileri ve belgeleri paketleyerek Google Drive hesabınıza yeni
            bir yedek olarak kaydeder.
          </p>
          <Button
            onClick={handleOpenGdriveModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl"
          >
            Dosyayı Buluta Yükle
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Download size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Buluttan İndirme (Import)
              </h4>
              <p className="text-xs text-slate-500">Drive'daki .temin yedeklerini listeler</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Google Drive hesabınızdaki geçmiş çalışma dosyalarını çekerek seçtiğiniz yedeği indirir
            ve aktif çalışma alanı yapar.
          </p>
          <Button
            onClick={handleOpenGdriveModal}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl"
          >
            Bulut Yedeklerini Listele & İndir
          </Button>
        </div>
      </div>
    </div>
  )
}
