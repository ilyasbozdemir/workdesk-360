import React from 'react'
import { Type, Layout, Table as TableIcon, Palette, Maximize2 } from 'lucide-react'
import { FONT_OPTIONS } from './constants'
import { useDocumentTheme } from './useDocumentTheme'

type SectionsProps = ReturnType<typeof useDocumentTheme>

export function DocumentThemeSections(props: SectionsProps): React.JSX.Element {
  const { theme, setTheme, activeSection, setActiveSection } = props

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Sub Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-1.5 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('typography')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'typography'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Tipografi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('page')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'page'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Sayfa & Kenarlık</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('table')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'table'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Tablo Düzeni</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('colors')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'colors'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Renk Paleti</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('spacing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'spacing'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Boşluklar</span>
        </button>
      </div>

      {/* Form Body */}
      <div className="p-5 space-y-5">
        {/* Section: Typography */}
        {activeSection === 'typography' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Yazı Tipi Ailesi (Font Family)
              </label>
              <select
                value={theme.typography.fontFamily}
                onChange={(e) =>
                  setTheme({
                    ...theme,
                    typography: { ...theme.typography, fontFamily: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ana Metin Boyutu (Base Font Size)
                </label>
                <input
                  type="text"
                  value={theme.typography.baseFontSize}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      typography: { ...theme.typography, baseFontSize: e.target.value }
                    })
                  }
                  placeholder="12pt"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Satır Yüksekliği (Line Height)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="2.5"
                  value={theme.typography.lineHeight}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      typography: {
                        ...theme.typography,
                        lineHeight: parseFloat(e.target.value) || 1.5
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
              💡 <strong>Resmi Yazışma Kuralı:</strong> Kamu İhale Mevzuatı ve Resmi Yazışma
              Yönetmeliği gereği resmi yazılarda <strong>Times New Roman (12pt)</strong> veya{' '}
              <strong>Arial (11pt)</strong> tercih edilir.
            </div>
          </div>
        )}

        {/* Section: Page & Margins */}
        {activeSection === 'page' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sayfa Formatı
                </label>
                <select
                  value={theme.page.format}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      page: { ...theme.page, format: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A4">A4 (21 x 29.7 cm)</option>
                  <option value="A3">A3 (29.7 x 42 cm)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yazdırılabilir Sayfa Yüksekliği (px)
                </label>
                <input
                  type="number"
                  value={theme.page.printableHeight}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      page: {
                        ...theme.page,
                        printableHeight: parseInt(e.target.value, 10) || 890
                      }
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kenar Boşlukları (Margins - cm)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Üst (Top)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={theme.page.margins.top}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        page: {
                          ...theme.page,
                          margins: {
                            ...theme.page.margins,
                            top: parseFloat(e.target.value) || 1.5
                          }
                        }
                      })
                    }
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sağ (Right)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={theme.page.margins.right}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        page: {
                          ...theme.page,
                          margins: {
                            ...theme.page.margins,
                            right: parseFloat(e.target.value) || 1.5
                          }
                        }
                      })
                    }
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Alt (Bottom)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={theme.page.margins.bottom}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        page: {
                          ...theme.page,
                          margins: {
                            ...theme.page.margins,
                            bottom: parseFloat(e.target.value) || 1.5
                          }
                        }
                      })
                    }
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Sol (Left)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={theme.page.margins.left}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        page: {
                          ...theme.page,
                          margins: {
                            ...theme.page.margins,
                            left: parseFloat(e.target.value) || 1.5
                          }
                        }
                      })
                    }
                    className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Table Appearance */}
        {activeSection === 'table' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tablo Yazı Boyutu (Font Size)
                </label>
                <input
                  type="text"
                  value={theme.table.fontSize}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      table: { ...theme.table, fontSize: e.target.value }
                    })
                  }
                  placeholder="10pt"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hücre İç Boşluğu (Cell Padding)
                </label>
                <input
                  type="text"
                  value={theme.table.cellPadding}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      table: { ...theme.table, cellPadding: e.target.value }
                    })
                  }
                  placeholder="6px"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Başlık Arka Plan Rengi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.table.headerBgColor}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        table: { ...theme.table, headerBgColor: e.target.value }
                      })
                    }
                    className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={theme.table.headerBgColor}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        table: { ...theme.table, headerBgColor: e.target.value }
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tablo Kenarlık Rengi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.table.borderColor}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        table: { ...theme.table, borderColor: e.target.value }
                      })
                    }
                    className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={theme.table.borderColor}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        table: { ...theme.table, borderColor: e.target.value }
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Colors */}
        {activeSection === 'colors' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ana Metin Rengi (Text)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.colors.text}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, text: e.target.value }
                    })
                  }
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={theme.colors.text}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, text: e.target.value }
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kenarlık Rengi (Border)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.colors.border}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, border: e.target.value }
                    })
                  }
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={theme.colors.border}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, border: e.target.value }
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Antet Arka Planı (Header Bg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.colors.headerBg}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, headerBg: e.target.value }
                    })
                  }
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={theme.colors.headerBg}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, headerBg: e.target.value }
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Vurgu Çizgisi Rengi (Accent Line)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.colors.accentLine}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, accentLine: e.target.value }
                    })
                  }
                  className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={theme.colors.accentLine}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      colors: { ...theme.colors, accentLine: e.target.value }
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section: Spacing */}
        {activeSection === 'spacing' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Antet Yüksekliği (Header Height)
              </label>
              <input
                type="text"
                value={theme.spacing.headerHeight}
                onChange={(e) =>
                  setTheme({
                    ...theme,
                    spacing: { ...theme.spacing, headerHeight: e.target.value }
                  })
                }
                placeholder="80px"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                İmza / Onay Bloğu Boşluğu
              </label>
              <input
                type="text"
                value={theme.spacing.approvalSpacing}
                onChange={(e) =>
                  setTheme({
                    ...theme,
                    spacing: { ...theme.spacing, approvalSpacing: e.target.value }
                  })
                }
                placeholder="40px"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
