import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface SqlConsoleTabProps {
  consoleQuery: string
  setConsoleQuery: (val: string) => void
  selectedTable: string
  consoleLoading: boolean
  consoleError: string | null
  consoleResults: Record<string, unknown>[]
  handleRunQuery: () => Promise<void>
}

export function SqlConsoleTab({
  consoleQuery,
  setConsoleQuery,
  selectedTable,
  consoleLoading,
  consoleError,
  consoleResults,
  handleRunQuery
}: SqlConsoleTabProps): React.JSX.Element {
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            SQL Sorgu Girişi (SELECT, UPDATE, INSERT, DELETE çalıştırabilirsiniz)
          </label>
          <button
            onClick={() =>
              setConsoleQuery(`SELECT * FROM ${selectedTable || 'DATA_TeminDosyasi'} LIMIT 20`)
            }
            className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer border-0 bg-transparent"
          >
            Taslak Sorgu Doldur
          </button>
        </div>
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={consoleQuery}
            onChange={(e) => setConsoleQuery(e.target.value)}
            placeholder="SELECT * FROM TANIM_Firma WHERE aktif_mi = 1 ORDER BY id DESC"
            className="flex-1 font-mono text-xs p-3 bg-slate-950 text-slate-300 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 custom-scrollbar whitespace-pre-wrap"
          />
          <button
            onClick={() => void handleRunQuery()}
            disabled={consoleLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold px-5 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95 transition-all shrink-0 cursor-pointer border-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${consoleLoading ? 'animate-spin' : ''}`} />
            Sorguyu Çalıştır
          </button>
        </div>
      </div>

      {/* Console results block */}
      <div className="flex-1 overflow-hidden relative border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
        {consoleLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 z-10 text-xs text-slate-500 italic">
            Sorgu yürütülüyor...
          </div>
        )}

        {consoleError && (
          <div className="p-4 bg-rose-50/50 border-b border-rose-200 text-rose-800 dark:bg-rose-950/15 dark:border-rose-900/30 dark:text-rose-400 text-xs flex items-start gap-2 h-full overflow-y-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">SQL Hatası</span>
              <pre className="font-mono text-[10px] whitespace-pre-wrap">{consoleError}</pre>
            </div>
          </div>
        )}

        {!consoleError && consoleResults.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-400 italic">
            {consoleLoading
              ? 'Sonuçlar bekleniyor...'
              : 'Sorgu çalıştırıldıktan sonra sonuçlar burada listelenecektir.'}
          </div>
        ) : !consoleError ? (
          <div className="h-full overflow-auto custom-scrollbar">
            <table className="w-full border-collapse text-[10px] text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {Object.keys(consoleResults[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                {consoleResults.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    {Object.keys(row).map((key) => {
                      const val = row[key]
                      return (
                        <td
                          key={key}
                          className="p-2 border-r border-slate-150 dark:border-slate-850 truncate max-w-50 text-slate-650 dark:text-slate-400"
                          title={
                            val !== null && typeof val === 'object'
                              ? JSON.stringify(val)
                              : String(val)
                          }
                        >
                          {val === null ? (
                            <span className="text-slate-350 dark:text-slate-600 italic">NULL</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val)
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
