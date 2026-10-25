import React from 'react'
import { Search, SlidersHorizontal, Layers, FileCheck2, RotateCcw } from 'lucide-react'
import { EbysTemplate, EbysCategory, EbysTemplateVariables } from '../ebys.types'

interface EbysSidebarProps {
  templates: EbysTemplate[]
  selectedTemplateId: string
  onSelectTemplate: (id: string) => void
  activeCategory: EbysCategory
  onSelectCategory: (cat: EbysCategory) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  sidebarTab: 'templates' | 'variables'
  setSidebarTab: (tab: 'templates' | 'variables') => void
  variables: EbysTemplateVariables
  onVariableChange: (field: keyof EbysTemplateVariables, val: any) => void
  onResetVariables: () => void
}

const CATEGORIES: { id: EbysCategory; label: string }[] = [
  { id: 'hepsi', label: 'Tüm Şablonlar' },
  { id: 'ust_yazi', label: 'Üst Yazılar' },
  { id: 'ic_yazisma', label: 'İç Yazışmalar' },
  { id: 'olur_onay', label: 'Olur & Onay' },
  { id: 'bilgi_gorus', label: 'Bilgi & Görüş' },
  { id: 'cevap', label: 'Cevap Yazıları' },
  { id: 'dagitimli', label: 'Dağıtımlı Yazılar' },
  { id: 'gorevlendirme', label: 'Görevlendirme & İzin' },
  { id: 'cok_sayfali', label: 'Çok Sayfalı' }
]

export const EbysSidebar: React.FC<EbysSidebarProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sidebarTab,
  setSidebarTab,
  variables,
  onVariableChange,
  onResetVariables
}) => {
  return (
    <aside className="w-full md:w-96 flex flex-col bg-white/95 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden shrink-0 shadow-xs">
      {/* Üst Sekmeler: Şablon Listesi vs Değişken Formu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 gap-1 shrink-0">
        <button
          onClick={() => setSidebarTab('templates')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
            sidebarTab === 'templates'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Şablon Kütüphanesi ({templates.length})
        </button>
        <button
          onClick={() => setSidebarTab('variables')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
            sidebarTab === 'variables'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Belge Alanları &amp; Metin
        </button>
      </div>

      {sidebarTab === 'templates' ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Arama ve Kategori Filtresi */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Şablon veya konu ara..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Kategori Hapları */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40 font-bold'
                      : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Şablon Kartları Listesi */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {templates.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Kriterlere uygun şablon bulunamadı.
              </div>
            ) : (
              templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId
                return (
                  <div
                    key={tpl.id}
                    onClick={() => onSelectTemplate(tpl.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-1 ring-blue-500/40'
                        : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200 line-clamp-1">
                        {tpl.name}
                      </span>
                      {isSelected && (
                        <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {tpl.description}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tpl.id.startsWith('custom_') && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 font-bold">
                          ÖZEL ŞABLON
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {tpl.categoryLabel}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-mono">
                        {tpl.format}
                      </span>
                      {tpl.isMultiPage && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          2 Sayfa
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        /* Değişkenler ve Form Düzenleyici */
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-200">
                Canlı Değişken Editörü
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Değişiklikler A4 ve HTML&apos;e anında yansır
              </div>
            </div>
            <button
              onClick={onResetVariables}
              title="Varsayılanlara Sıfırla"
              className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Sıfırla
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs custom-scrollbar">
            {/* Kurum Bilgileri */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Kurum Adı (T.C. Altı)
              </label>
              <input
                type="text"
                value={variables.kurumAdi || ''}
                onChange={(e) => onVariableChange('kurumAdi', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Birim Adı
              </label>
              <input
                type="text"
                value={variables.birimAdi || ''}
                onChange={(e) => onVariableChange('birimAdi', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Sayı ve Tarih */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sayı (DETSİS)
                </label>
                <input
                  type="text"
                  value={variables.sayi || ''}
                  onChange={(e) => onVariableChange('sayi', e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Tarih
                </label>
                <input
                  type="text"
                  value={variables.tarih || ''}
                  onChange={(e) => onVariableChange('tarih', e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Konu */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Konu
              </label>
              <input
                type="text"
                value={variables.konu || ''}
                onChange={(e) => onVariableChange('konu', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Muhatap */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Muhatap Makam
              </label>
              <input
                type="text"
                value={variables.muhatap || ''}
                onChange={(e) => onVariableChange('muhatap', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            {/* İlgi (varsa) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                İlgi (Opsiyonel)
              </label>
              <input
                type="text"
                value={variables.ilgi || ''}
                placeholder="İlgi: ... tarihli ve ... sayılı yazı."
                onChange={(e) => onVariableChange('ilgi', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Metin Gövdesi */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Yazı Metni
              </label>
              <textarea
                rows={6}
                value={variables.metin || ''}
                onChange={(e) => onVariableChange('metin', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed text-[11px]"
              />
            </div>

            {/* Sonuç Cümlesi */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Kapanış / Sonuç İfadesi
              </label>
              <input
                type="text"
                value={variables.sonucParagrafi || ''}
                onChange={(e) => onVariableChange('sonucParagrafi', e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 italic"
              />
            </div>

            {/* İmza Bloğu */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  İmza Sahibi Adı
                </label>
                <input
                  type="text"
                  value={variables.imzaAdi || ''}
                  onChange={(e) => onVariableChange('imzaAdi', e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  İmza Unvanı
                </label>
                <input
                  type="text"
                  value={variables.imzaUnvani || ''}
                  onChange={(e) => onVariableChange('imzaUnvani', e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Olur Makamı (varsa) */}
            {variables.olurMakamAdi !== undefined && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg space-y-2">
                <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  OLUR Makamı Bilgileri
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Olur Makam Adı"
                    value={variables.olurMakamAdi || ''}
                    onChange={(e) => onVariableChange('olurMakamAdi', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Makam Unvanı"
                    value={variables.olurMakamUnvani || ''}
                    onChange={(e) => onVariableChange('olurMakamUnvani', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
