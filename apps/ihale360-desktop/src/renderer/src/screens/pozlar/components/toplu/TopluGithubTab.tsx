import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CloudDownload,
  Copy,
  RefreshCw,
  Sparkles,
  Table as TableIcon
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { GithubIcon } from './TopluPozlarHeader'
import { ORNEK_GITHUB_JSON_DATA } from './toplu.constants'

interface TopluGithubTabProps {
  githubUrl: string
  setGithubUrl: (url: string) => void
  isFetchingGithub: boolean
  handleFetchFromGithub: () => void
  githubFetchError: string | null
  githubFetchedData: any[] | null
  handleTransferGithubToGrid: () => void
  handleCopyJsonTemplate: () => void
}

export function TopluGithubTab({
  githubUrl,
  setGithubUrl,
  isFetchingGithub,
  handleFetchFromGithub,
  githubFetchError,
  githubFetchedData,
  handleTransferGithubToGrid,
  handleCopyJsonTemplate
}: TopluGithubTabProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sol Kolon: GitHub URL ve Eşitleme Paneli */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <GithubIcon size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                GitHub Raw JSON Çevrimiçi Katalog Entegrasyonu
              </h2>
              <p className="text-[11px] text-slate-500">
                GitHub deponuzdaki <code className="font-bold">pozlar.json</code> dosyasını
                güncellediğinizde kullanıcılar buradan tek tıkla verileri indirebilir.
              </p>
            </div>
          </div>

          {/* URL Giriş Alanı */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              GitHub Raw JSON Dosya Bağlantısı (URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/.../pozlar.json"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
              <Button
                type="button"
                onClick={handleFetchFromGithub}
                disabled={isFetchingGithub || !githubUrl.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2 text-xs py-2.5 px-4 font-bold shrink-0 cursor-pointer"
              >
                {isFetchingGithub ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CloudDownload size={15} />
                )}
                <span>Pozları Getir</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              İpucu: GitHub’da oluşturduğunuz dosyanın <strong>Raw</strong> butonuna tıklayarak
              çıkan raw.githubusercontent.com URL’sini buraya yapıştırabilirsiniz.
            </p>
          </div>

          {/* Hata Durumu */}
          {githubFetchError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-xs flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{githubFetchError}</span>
            </div>
          )}

          {/* Çekilen Veri Önizleme Kartı */}
          {githubFetchedData && (
            <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>{githubFetchedData.length} Adet Poz Başarıyla İndirildi!</span>
                </div>

                <Button
                  type="button"
                  onClick={handleTransferGithubToGrid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs py-1.5 px-3 font-bold cursor-pointer"
                >
                  <TableIcon size={14} />
                  <span>Tabloya Aktar & İncele</span>
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-emerald-100 dark:divide-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-950 text-xs">
                {githubFetchedData.slice(0, 50).map((p: any, i: number) => (
                  <div key={i} className="p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[11px]">
                        {p.poz_no}
                      </span>
                      {p.eski_poz_no && (
                        <span className="text-[10px] text-blue-600 font-mono">
                          ({p.eski_poz_no})
                        </span>
                      )}
                      <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {p.kalem_adi || p.poz_tanimi}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 shrink-0">
                      {Number(p.birim_fiyat || 0).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2
                      })}{' '}
                      TL
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Kolon: Standart GitHub JSON Formatı ve Kopyalama */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span>GitHub'a Yüklenecek Standart JSON Formatı</span>
            </h3>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyJsonTemplate}
              className="gap-1.5 text-xs py-1 px-2.5 h-auto text-purple-600 border-purple-200 hover:bg-purple-50 cursor-pointer"
            >
              <Copy size={13} />
              <span>Formatı Kopyala</span>
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            GitHub repository'nizde (örneğin <code className="font-bold">pozlar.json</code>{' '}
            dosyasında) aşağıdaki JSON şablonunu kullanabilirsiniz. Uygulamamız bu formatı doğrudan
            tanır.
          </p>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed scrollbar-thin">
            {JSON.stringify(ORNEK_GITHUB_JSON_DATA, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
