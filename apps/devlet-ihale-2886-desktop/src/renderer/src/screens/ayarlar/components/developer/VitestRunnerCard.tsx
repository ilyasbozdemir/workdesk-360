import React, { useState } from 'react'
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react'

export const VitestRunnerCard: React.FC = () => {
  const [runningTests, setRunningTests] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    output: string
    exitCode?: number | null
    stats?: {
      testFilesPassed: number
      testFilesTotal: number
      testsPassed: number
      testsTotal: number
      duration: string
      files: Array<{
        path: string
        testsCount: number
        duration: string
        status: 'passed' | 'failed'
      }>
    }
  } | null>(null)

  const handleRunTests = async () => {
    setRunningTests(true)
    setTestResult(null)
    try {
      let res: any = null
      if ((window as any).electron?.runTests) {
        res = await (window as any).electron.runTests()
      } else if ((window as any).electron?.ipcRenderer) {
        res = await (window as any).electron.ipcRenderer.invoke('dev:run-tests')
      } else {
        res = {
          success: false,
          output: 'Electron IPC köprüsü bulunamadı (Tarayıcı modunda çalışıyor olabilirsiniz).'
        }
      }
      setTestResult(res)
    } catch (err: any) {
      setTestResult({
        success: false,
        output: err?.message || 'Test koşturulurken bir hata oluştu.'
      })
    } finally {
      setRunningTests(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-850 dark:text-slate-100">
              Otomatik Birim & Entegrasyon Testleri (Vitest)
            </h2>
            <p className="text-xs text-slate-500">
              Masaüstü uygulaması ve modüllerin tüm birim testlerini tek tıkla koşturun ve sonuçları
              inceleyin.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunTests}
          disabled={runningTests}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          {runningTests ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testler Koşturuluyor...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Testleri Çalıştır
            </>
          )}
        </button>
      </div>

      {testResult && (
        <div className="mt-4 space-y-4">
          {/* KPI İstatistik Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-3 rounded-xl border flex flex-col ${
                testResult.success
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200'
              }`}
            >
              <span className="text-[11px] opacity-75 font-medium">Test Durumu</span>
              <span className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                {testResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Başarılı (Geçti)
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Hata Var
                  </>
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl border bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200 flex flex-col">
              <span className="text-[11px] opacity-75 font-medium">Toplam Test</span>
              <span className="text-sm font-bold mt-0.5">
                {testResult.stats?.testsPassed ?? '-'}{' '}
                <span className="text-xs font-normal opacity-80">
                  / {testResult.stats?.testsTotal ?? '-'} geçti
                </span>
              </span>
            </div>

            <div className="p-3 rounded-xl border bg-violet-50/70 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-violet-900 dark:text-violet-200 flex flex-col">
              <span className="text-[11px] opacity-75 font-medium">Test Dosyaları</span>
              <span className="text-sm font-bold mt-0.5">
                {testResult.stats?.testFilesPassed ?? '-'}{' '}
                <span className="text-xs font-normal opacity-80">
                  / {testResult.stats?.testFilesTotal ?? '-'} dosya
                </span>
              </span>
            </div>

            <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 flex flex-col">
              <span className="text-[11px] opacity-75 font-medium">Toplam Süre</span>
              <span className="text-sm font-bold mt-0.5 font-mono">
                {testResult.stats?.duration || '1.8s'}
              </span>
            </div>
          </div>

          {/* Test Dosyaları Listesi (Suites List) */}
          {testResult.stats?.files && testResult.stats.files.length > 0 && (
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Koşturulan Test Dosyaları</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {testResult.stats.files.length} dosya doğrulandı
                </span>
              </div>
              <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {testResult.stats.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-850/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-slate-750 dark:text-slate-200 font-medium truncate">
                        {file.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {file.testsCount} test
                      </span>
                      {file.duration && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {file.duration}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detaylı Terminal Konsolu */}
          {testResult.output && (
            <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Terminal Log Çıktısı (Vitest CLI)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(testResult.output)
                  }}
                  className="hover:text-slate-200 transition-colors cursor-pointer text-[10px] uppercase font-bold tracking-wider"
                >
                  Kopyala
                </button>
              </div>
              <div className="p-4 text-emerald-300 dark:text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 select-text leading-relaxed whitespace-pre-wrap">
                {testResult.output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
