import React from 'react'

function escapeDebugRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** JSON sözdizimi renklendirmesi. Veriyi değiştirmez; yalnızca metni biçimlendirir. */
function DebugJsonLine({ line, search }: { line: string; search: string }): React.JSX.Element {
  const tokens = line.split(
    /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  )
  const searchLower = search.trim().toLocaleLowerCase()
  return (
    <>
      {tokens.map((token, i) => {
        const isKey = /^"(?:\\.|[^"\\])*"$/.test(token) && /^\s*:/.test(tokens[i + 1] ?? '')
        const isString = token.startsWith('"')
        const isBoolean = /^(true|false)$/.test(token)
        const isNull = token === 'null'
        const isNumber = /^-?\d/.test(token)
        const color = isKey
          ? 'text-sky-300'
          : isString
            ? 'text-emerald-300'
            : isBoolean
              ? 'text-violet-300'
              : isNull
                ? 'text-rose-300'
                : isNumber
                  ? 'text-amber-300'
                  : 'text-slate-400'
        if (!searchLower)
          return (
            <span key={i} className={color}>
              {token}
            </span>
          )
        const pieces = token.split(new RegExp(`(${escapeDebugRegex(searchLower)})`, 'gi'))
        return (
          <span key={i} className={color}>
            {pieces.map((piece, j) =>
              piece.toLocaleLowerCase() === searchLower ? (
                <mark key={j} className="rounded bg-yellow-300 text-slate-950">
                  {piece}
                </mark>
              ) : (
                <React.Fragment key={j}>{piece}</React.Fragment>
              )
            )}
          </span>
        )
      })}
    </>
  )
}

interface DocumentPreviewDebugModalProps {
  isOpen: boolean
  onClose: () => void
  debugJson: string
  debugSearch: string
  setDebugSearch: (val: string) => void
}

export function DocumentPreviewDebugModal({
  isOpen,
  onClose,
  debugJson,
  debugSearch,
  setDebugSearch
}: DocumentPreviewDebugModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div
      className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="DocumentPreviewCanvas JSON Debug"
        className="flex h-full max-h-[850px] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0d1117] text-slate-200 shadow-2xl"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 bg-[#161b22] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">DocumentPreviewCanvas · JSON Debug</h2>
            <p className="mt-1 text-xs text-slate-400">
              Gelen prop değerleri · Salt okunur · React güncellemeleriyle yenilenir
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
              onClick={() => void navigator.clipboard.writeText(debugJson)}
            >
              JSON Kopyala
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([debugJson], { type: 'application/json' }))
                const link = document.createElement('a')
                link.href = url
                link.download = 'document-preview-debug.json'
                link.click()
                URL.revokeObjectURL(url)
              }}
            >
              JSON İndir
            </button>
            <button
              type="button"
              aria-label="Debug penceresini kapat"
              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500"
              onClick={onClose}
            >
              Kapat ✕
            </button>
          </div>
        </header>
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-3">
          <label htmlFor="document-debug-search" className="shrink-0 text-xs text-slate-400">
            JSON'da ara
          </label>
          <input
            id="document-debug-search"
            type="search"
            value={debugSearch}
            onChange={(event) => setDebugSearch(event.target.value)}
            placeholder="Alan adı veya değer..."
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
          />
          <span className="shrink-0 text-xs text-slate-500">
            {debugJson.split('\n').length} satır
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4 font-mono text-[12px] leading-6">
          <pre className="min-w-max whitespace-pre">
            {debugJson.split('\n').map((line, index) => (
              <div key={index} className="flex gap-5 hover:bg-white/5">
                <span className="w-10 shrink-0 select-none text-right text-slate-600">
                  {index + 1}
                </span>
                <span>
                  <DebugJsonLine line={line} search={debugSearch} />
                </span>
              </div>
            ))}
          </pre>
        </div>
        <footer className="border-t border-slate-800 bg-[#161b22] px-5 py-2 text-xs text-slate-400">
          Veriler yalnızca görüntülenir; formData ve diğer prop'lar değiştirilmez.
        </footer>
      </section>
    </div>
  )
}

