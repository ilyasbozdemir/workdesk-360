import React from 'react'
import { Search } from 'lucide-react'
import { PozSecimModal, SelectedPozData } from './PozSecimModal'
import type { Kalem } from '../malzemeler.hooks'

interface MalzemeModalsProps {
  formData: Partial<Kalem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Kalem>>>
  isOkasModalOpen: boolean
  setIsOkasModalOpen: (val: boolean) => void
  okasSearch: string
  setOkasSearch: (val: string) => void
  filteredOkas: any[]
  isOkasLoading: boolean
  isTasinirModalOpen: boolean
  setIsTasinirModalOpen: (val: boolean) => void
  tasinirSearch: string
  setTasinirSearch: (val: string) => void
  filteredTasinir: any[]
  isTasinirLoading: boolean
  isPozModalOpen: boolean
  setIsPozModalOpen: (val: boolean) => void
  handleSelectPoz: (data: SelectedPozData) => void
}

export const MalzemeModals: React.FC<MalzemeModalsProps> = ({
  formData,
  setFormData,
  isOkasModalOpen,
  setIsOkasModalOpen,
  okasSearch,
  setOkasSearch,
  filteredOkas,
  isOkasLoading,
  isTasinirModalOpen,
  setIsTasinirModalOpen,
  tasinirSearch,
  setTasinirSearch,
  filteredTasinir,
  isTasinirLoading,
  isPozModalOpen,
  setIsPozModalOpen,
  handleSelectPoz
}) => {
  return (
    <>
      {/* OKAS Modal */}
      {isOkasModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            style={{ maxHeight: '80vh' }}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Search size={18} className="text-blue-600" /> OKAS Kodu Seçin
              </h3>
              <button
                onClick={() => setIsOkasModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="OKAS Kodu veya açıklama ile filtrele..."
                  value={okasSearch}
                  onChange={(e) => setOkasSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 min-h-[300px] space-y-1">
              {isOkasLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs">Yükleniyor...</div>
              ) : filteredOkas.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Kayıt bulunamadı.</div>
              ) : (
                filteredOkas.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, okas_kodu: k.kod }))
                      setIsOkasModalOpen(false)
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded shrink-0">
                      {k.kod}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                      {k.aciklama}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Taşınır Kod Modal */}
      {isTasinirModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            style={{ maxHeight: '80vh' }}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Search size={18} className="text-emerald-600" /> Taşınır Kodu Seçin
              </h3>
              <button
                onClick={() => setIsTasinirModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Hesap kodu (örn: 150.01) veya açıklama ile ara..."
                  value={tasinirSearch}
                  onChange={(e) => setTasinirSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 min-h-[300px] space-y-1">
              {isTasinirLoading ? (
                <div className="p-8 text-center text-slate-500 text-xs">Yükleniyor...</div>
              ) : filteredTasinir.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Kayıt bulunamadı.</div>
              ) : (
                filteredTasinir.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, tasinir_kodu: k.tam_kod }))
                      setIsTasinirModalOpen(false)
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors border border-transparent hover:border-slate-200 dark:border-slate-700"
                  >
                    <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded shrink-0">
                      {k.tam_kod}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                      {k.aciklama}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Poz Seçim & Özel Poz Modal */}
      <PozSecimModal
        isOpen={isPozModalOpen}
        onClose={() => setIsPozModalOpen(false)}
        onSelectPoz={handleSelectPoz}
        currentPozNo={formData.poz_no || ''}
        currentYear={formData.poz_yili || new Date().getFullYear()}
      />
    </>
  )
}
