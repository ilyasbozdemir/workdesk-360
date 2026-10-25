import React from 'react'

interface EkapIknModalProps {
  isOpen: boolean
  onClose: () => void
  inputVal: string
  setInputVal: (val: string) => void
  onSubmit: () => Promise<void>
}

export const EkapIknModal: React.FC<EkapIknModalProps> = ({
  isOpen,
  onClose,
  inputVal,
  setInputVal,
  onSubmit
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
          EKAP İhale Kayıt Numarası (İKN)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Lütfen doğrudan temin dosyasını kilitlemek için geçerli bir EKAP İKN giriniz.
        </p>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Örn: 2026/12345"
          className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 mb-4 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputVal.trim()) {
              onSubmit()
            }
          }}
        />
        <div className="flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={onSubmit}
            disabled={!inputVal.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer"
          >
            Kilitle ve Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
