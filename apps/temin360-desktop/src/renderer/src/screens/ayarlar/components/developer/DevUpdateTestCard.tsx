import React from 'react'

interface DevUpdateTestCardProps {
  devUpdateTestMode: boolean
  setDevUpdateTestMode: (val: boolean) => void
  devUpdateVersion: string
  setDevUpdateVersion: (val: string) => void
  githubReleases: string[]
}

export const DevUpdateTestCard: React.FC<DevUpdateTestCardProps> = ({
  devUpdateTestMode,
  setDevUpdateTestMode,
  devUpdateVersion,
  setDevUpdateVersion,
  githubReleases
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100">
            Geliştirici Sürüm ve Güncelleme Testi
          </h2>
          <p className="text-xs text-slate-500">
            Geliştirme modunda otomatik güncellemeleri simüle etmek için kullanılır.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="devUpdateTestMode"
            checked={devUpdateTestMode}
            onChange={(e) => {
              const mode = e.target.checked
              setDevUpdateTestMode(mode)
              if (window.api?.setDevVersion) {
                window.api.setDevVersion(mode, devUpdateVersion)
                window.dispatchEvent(new Event('app-version-changed'))
                window.electron?.ipcRenderer.invoke('updater:check')
              }
            }}
            className="rounded border-slate-300 dark:border-slate-700 bg-slate-55 dark:bg-slate-950 text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label
            htmlFor="devUpdateTestMode"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
          >
            Geliştirici Modunda (Dev Mode) Güncelleme Testini Etkinleştir
          </label>
        </div>

        {devUpdateTestMode && (
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Şu Anki Versiyonu Şöyle Göster (GitHub Releases)
            </label>
            <select
              value={devUpdateVersion}
              onChange={(e) => {
                const ver = e.target.value
                setDevUpdateVersion(ver)
                if (window.api?.setDevVersion) {
                  window.api.setDevVersion(devUpdateTestMode, ver)
                  window.dispatchEvent(new Event('app-version-changed'))
                  window.electron?.ipcRenderer.invoke('updater:check')
                }
              }}
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Versiyon Seçiniz --</option>
              {githubReleases.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
