import React, { useState, useMemo } from 'react'
import { Calculator, Search, X, Copy, Check, RotateCcw, ChevronDown, Sparkles } from 'lucide-react'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import { parseDec } from './decimalUtils'
import { TOOLS } from './toolsData'
import { HesapAraclariViewProps } from './types'

export function HesapAraclariView({
  onClose,
  hideHeader = false
}: HesapAraclariViewProps): React.JSX.Element {
  const [selectedToolId, setSelectedToolId] = useState<string>('temel')
  const [precision, setPrecision] = useState<string>('2')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [inputsState, setInputsState] = useState<Record<string, Record<string, string>>>({})
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const activeTool = useMemo(() => {
    return TOOLS.find((t) => t.id === selectedToolId) || TOOLS[0]
  }, [selectedToolId])

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS
    const q = searchQuery.toLocaleLowerCase('tr-TR')
    return TOOLS.filter(
      (t) =>
        t.name.toLocaleLowerCase('tr-TR').includes(q) ||
        t.hint.toLocaleLowerCase('tr-TR').includes(q)
    )
  }, [searchQuery])

  const currentToolInputs = inputsState[activeTool.id] || {}

  const handleInputChange = (key: string, val: string) => {
    setInputsState((prev) => ({
      ...prev,
      [activeTool.id]: {
        ...prev[activeTool.id],
        [key]: val
      }
    }))
  }

  const parsedValues: Record<string, any> = {}
  activeTool.in.forEach((input) => {
    const rawVal = currentToolInputs[input.k] ?? ''
    parsedValues[input.k] = input.sel || input.text || input.date ? rawVal : parseDec(rawVal)
  })

  const calculationResult = activeTool.calc(parsedValues, precision)

  const handleCopyResults = async () => {
    if (!calculationResult) return
    const lines: string[] = [`=== ${activeTool.name} ===`]
    calculationResult.g.forEach((group: any) => {
      lines.push(`\n[${group.t}] (${group.s})`)
      group.r.forEach(([label, val]: [string, string | null]) => {
        if (val !== null) lines.push(`${label}: ${val}`)
      })
    })
    await copyToClipboard(lines.join('\n'))
    setCopiedText(activeTool.id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleResetTool = () => {
    setInputsState((prev) => ({
      ...prev,
      [activeTool.id]: {}
    }))
  }

  const toolGroups = useMemo(() => {
    const map = new Map<string, typeof TOOLS>()
    TOOLS.forEach((t) => {
      const list = map.get(t.grp) || []
      list.push(t)
      map.set(t.grp, list)
    })
    return Array.from(map.entries())
  }, [])

  const popularToolIds = useMemo(() => {
    return ['temel', 'oran', 'geridonus', 'kdv', 'iskonto', 'kar', 'tarihfarki', 'damga']
  }, [])

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden font-sans">
      {/* ÜST BAŞLIK BAR (Sadece Modal modunda gösterilir) */}
      {!hideHeader ? (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Hesap & Yüzde Araçları Süiti
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Decimal.js High Precision
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kamu ihale, KDV, indirim, kâr marjı, tarih farkı ve %100 hassas finansal hesaplama
                araçları.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
              <span>Hassasiyet:</span>
              <select
                value={precision}
                onChange={(e) => setPrecision(e.target.value)}
                className="bg-transparent font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
              >
                <option value="auto">Otomatik</option>
                <option value="0">0</option>
                <option value="2">2 (Kuruş)</option>
                <option value="4">4 (Hassas)</option>
              </select>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* EMBEDDED SAYFA MODU: Yatay Açılır Seçici ve Hızlı Haplar (İkinci Sidebar KESİNLİKLE YOK!) */
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Açılır Hesap Modu Seçici */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                Hesaplama Türü:
              </label>
              <div className="relative flex-1 max-w-sm">
                <select
                  value={activeTool.id}
                  onChange={(e) => setSelectedToolId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer appearance-none"
                >
                  {toolGroups.map(([grp, tools]) => (
                    <optgroup key={grp} label={`-- ${grp} --`}>
                      {tools.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Hassasiyet ve Temizle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span>Hassasiyet:</span>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(e.target.value)}
                  className="bg-transparent font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="auto">Otomatik</option>
                  <option value="0">0</option>
                  <option value="2">2 (Kuruş)</option>
                  <option value="4">4 (Hassas)</option>
                </select>
              </div>

              <button
                onClick={handleResetTool}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                title="Girdileri Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            </div>
          </div>

          {/* Hızlı Erişim Hapları (Quick Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Hızlı Seçim:
            </span>
            {TOOLS.filter((t) => popularToolIds.includes(t.id)).map((tool) => {
              const isActive = tool.id === activeTool.id
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {tool.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* GÖVDE: MODAL İÇİN ÇİFT SÜTUN / EMBEDDED İÇİN TEK TAM GENİŞLİK ALAN */}
      <div
        className={
          hideHeader
            ? 'flex-1 p-5 overflow-y-auto space-y-5'
            : 'flex-1 flex flex-col md:flex-row min-h-[500px] divide-y md:divide-y-0 md:divide-x divide-slate-200/60 dark:divide-slate-800'
        }
      >
        {/* SOL ARAÇ SEÇİM MENÜSÜ (Sadece Modal modunda gösterilir) */}
        {!hideHeader && (
          <div className="w-full md:w-72 bg-slate-50/50 dark:bg-slate-950/40 p-3 flex flex-col shrink-0 overflow-y-auto max-h-[600px]">
            <div className="relative mb-2 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Araçlarda ara..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              {filteredTools.map((t) => {
                const isActive = t.id === activeTool.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedToolId(t.id)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-0.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                        : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>{t.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {t.grp}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] line-clamp-1 ${
                        isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {t.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* HESAPLAMA VE SONUÇ EKRANI (Embedded modda %100 tam genişlik!) */}
        <div
          className={
            hideHeader
              ? 'w-full space-y-5'
              : 'flex-1 p-5 overflow-y-auto flex flex-col justify-between space-y-5 max-h-[600px]'
          }
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{activeTool.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {activeTool.grp}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeTool.hint}
                </p>
              </div>
              {!hideHeader && (
                <button
                  onClick={handleResetTool}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Temizle</span>
                </button>
              )}
            </div>

            {/* GİRDİ ALANLARI */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeTool.in.map((input) => {
                const val = currentToolInputs[input.k] ?? ''
                return (
                  <div key={input.k} className={input.text ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {input.l}
                    </label>
                    {input.sel ? (
                      <select
                        value={val || input.sel[input.def || 0]}
                        onChange={(e) => handleInputChange(input.k, e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {input.sel.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : input.date ? (
                      <input
                        type="date"
                        value={val}
                        onChange={(e) => handleInputChange(input.k, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type={input.text ? 'text' : 'number'}
                        step="any"
                        value={val}
                        onChange={(e) => handleInputChange(input.k, e.target.value)}
                        placeholder={input.ph}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {/* Hızlı Yüzde Chips */}
                    {input.chips && (
                      <div className="flex gap-1.5 mt-1.5">
                        {input.chips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleInputChange(input.k, String(chip))}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            %{chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* SONUÇ KARTLARI */}
            <div className="mt-5">
              {!calculationResult ? (
                <div className="p-8 text-center bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs">
                  Sonuçları görmek için yukarıdaki alanları doldurun.
                </div>
              ) : (
                <div className="space-y-3">
                  {calculationResult.g.map((group: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950"
                    >
                      <div className="px-4 py-2.5 bg-blue-600 text-white flex items-center justify-between">
                        <span className="text-xs font-bold">{group.t}</span>
                        <span className="text-[10px] text-blue-100 font-medium">{group.s}</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {group.r.map(([label, val]: [string, string | null], rIdx: number) => (
                          <div
                            key={rIdx}
                            className="flex items-center justify-between px-4 py-2.5 gap-3"
                          >
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {label}
                            </span>
                            <span
                              className={`text-sm font-extrabold text-right break-all ${
                                val === null
                                  ? 'text-slate-400 text-xs font-normal'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {val === null ? 'hesaplanamaz' : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ALT BUTONLAR */}
          {calculationResult && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={handleCopyResults}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                {copiedText === activeTool.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sonuçları Kopyala</span>
                  </>
                )}
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Kapat
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
