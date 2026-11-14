import React, { useState, useEffect } from 'react'
import {
  Printer,
  X,
  Check,
  ChevronDown,
  RefreshCw,
  Copy,
  Sliders,
  FileText,
  Zap,
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

export interface PrinterItem {
  name: string
  displayName: string
  description: string
  status: number
  isDefault: boolean
  options?: Record<string, string>
}

export interface PrintSettings {
  printerName: string
  copies: number
  orientation: 'portrait' | 'landscape'
  color: boolean
  silent: boolean
}

export interface ExcelStylePrintModalProps {
  isOpen: boolean
  onClose: () => void
  onPrint: (settings: PrintSettings) => Promise<void> | void
  documentTitle?: string
  dosyaNo?: string
  defaultOrientation?: 'portrait' | 'landscape'
  isPrinting?: boolean
}

export function ExcelStylePrintModal({
  isOpen,
  onClose,
  onPrint,
  documentTitle = 'Belge Yazdır',
  dosyaNo,
  defaultOrientation = 'portrait',
  isPrinting = false
}: ExcelStylePrintModalProps): React.JSX.Element | null {
  const [printers, setPrinters] = useState<PrinterItem[]>([])
  const [loadingPrinters, setLoadingPrinters] = useState<boolean>(false)
  const [printerError, setPrinterError] = useState<string | null>(null)
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Baskı Ayarları
  const [copies, setCopies] = useState<number>(1)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation)
  const [color, setColor] = useState<boolean>(true)
  const [silent, setSilent] = useState<boolean>(true)

  // Yazıcıları İşletim Sisteminden Yükle
  const loadPrinters = async (): Promise<void> => {
    setLoadingPrinters(true)
    setPrinterError(null)
    try {
      let res: any
      if (window.api?.getPrinters) {
        res = await window.api.getPrinters()
      } else if (window.electron?.ipcRenderer) {
        res = await window.electron.ipcRenderer.invoke('app:get-printers')
      }

      if (res?.success && Array.isArray(res.printers) && res.printers.length > 0) {
        setPrinters(res.printers)
        // Eğer henüz seçili yazıcı yoksa varsayılanı veya ilkini seç
        if (!selectedPrinter) {
          const defaultPr = res.printers.find((p: PrinterItem) => p.isDefault) || res.printers[0]
          setSelectedPrinter(defaultPr.name)
        }
      } else {
        // Sistemde yüklü yazıcı bulunamadıysa veya hata varsa
        if (res?.error) setPrinterError(res.error)
        setPrinters([])
      }
    } catch (err: any) {
      console.warn('Yazıcılar yüklenirken hata:', err)
      setPrinterError(err.message || 'Yazıcı listesi alınamadı')
    } finally {
      setLoadingPrinters(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadPrinters()
      setOrientation(defaultOrientation)
    }
  }, [isOpen, defaultOrientation])

  if (!isOpen) return null

  const activePrinterObj = printers.find((p) => p.name === selectedPrinter)

  const filteredPrinters = printers.filter(
    (p) =>
      p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePrintSubmit = async (): Promise<void> => {
    await onPrint({
      printerName: selectedPrinter,
      copies: Math.max(1, copies),
      orientation,
      color,
      silent
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => {
          // Dışarı tıklandığında yazıcı dropdown'ını kapat
          if (isDropdownOpen) setIsDropdownOpen(false)
        }}
      >
        {/* Üst Başlık (Excel Style) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">
                  Yazdır (Baskı Masası)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Excel Düzeni
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {documentTitle} {dosyaNo ? `• #${dosyaNo}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gövde / Ayarlar */}
        <div className="p-5 space-y-4 text-xs">
          {/* 1. YAZICI SEÇİMİ (Excel Style Printer Picker) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Printer size={14} className="text-blue-500" />
                <span>Yazıcı Seçimi</span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  loadPrinters()
                }}
                disabled={loadingPrinters}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="Yazıcı listesini işletim sisteminden yeniden tara"
              >
                <RefreshCw size={11} className={loadingPrinters ? 'animate-spin' : ''} />
                <span>Yenile</span>
              </button>
            </div>

            {/* Seçili Yazıcı Kartı & Açılır Liste Tetikleyici */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsDropdownOpen((v) => !v)
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all bg-white dark:bg-slate-950 cursor-pointer shadow-2xs ${
                  isDropdownOpen
                    ? 'border-blue-500 ring-2 ring-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
                    <Printer size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-850 dark:text-slate-100 truncate text-xs">
                        {activePrinterObj ? activePrinterObj.displayName || activePrinterObj.name : 'Yazıcı Seçiniz'}
                      </span>
                      {activePrinterObj?.isDefault && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Hazır • {activePrinterObj?.name || 'Sistem yazıcısı'}
                    </span>
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Yazıcı Listesi Dropdown (Excel Tarzı) */}
              {isDropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden max-h-56 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Arama */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Yazıcı ara..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Liste Elemanları */}
                  <div className="overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredPrinters.length > 0 ? (
                      filteredPrinters.map((pr) => {
                        const isSelected = pr.name === selectedPrinter
                        return (
                          <button
                            key={pr.name}
                            type="button"
                            onClick={() => {
                              setSelectedPrinter(pr.name)
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Printer size={14} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold truncate text-xs">
                                    {pr.displayName || pr.name}
                                  </span>
                                  {pr.isDefault && (
                                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                      Varsayılan
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {pr.description || pr.name}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
                          </button>
                        )
                      })
                    ) : (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        {loadingPrinters ? 'Yazıcılar taranıyor...' : 'Eşleşen yazıcı bulunamadı.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {printerError && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                {printerError}
              </p>
            )}
          </div>

          {/* 2. AYARLAR: KOPYA SAYISI & SAYFA YÖNÜ */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Kopya Sayısı (Excel Stepper) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Copy size={13} className="text-amber-500" />
                <span>Kopya Sayısı</span>
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center font-bold text-slate-800 dark:text-slate-100 bg-transparent text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCopies((c) => Math.min(99, c + 1))}
                  className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Sayfa Yönü (Dikey / Yatay) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-500" />
                <span>Sayfa Yönü</span>
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`h-7 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>Dikey</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`h-7 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>Yatay</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. YAZDIRMA METODU: SESSİZ DOĞRUDAN vs SİSTEM DİYALOĞU */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders size={13} className="text-emerald-500" />
                <span>Yazdırma Yöntemi</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSilent(true)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  silent
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap size={13} className={silent ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>Hızlı Doğrudan</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pencere açmadan seçili yazıcıya hemen basar
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSilent(false)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  !silent
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Monitor size={13} className={!silent ? 'text-blue-600' : 'text-slate-400'} />
                  <span>Sistem Penceresi</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Standart Windows yazdırma ekranını açar
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>A4 formatı hazır</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPrinting}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs cursor-pointer"
            >
              İptal
            </button>

            <button
              type="button"
              onClick={handlePrintSubmit}
              disabled={isPrinting}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Yazdırılıyor...</span>
                </>
              ) : (
                <>
                  <Printer size={14} />
                  <span>Yazdır ({copies} Kopya)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
