import React, { useState } from 'react'
import { X, Sparkles, Code, AlertTriangle } from 'lucide-react'
import { AppConfig, VirtualView } from '../../../shared/types'

interface RuleEditorModalProps {
  isOpen: boolean
  config: AppConfig
  onClose: () => void
  onSaveConfig: (newConfig: AppConfig) => void
}

export function RuleEditorModal({
  isOpen,
  config,
  onClose,
  onSaveConfig
}: RuleEditorModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form')
  const [jsonString, setJsonString] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Form states
  const [viewName, setViewName] = useState('')
  const [viewIcon, setViewIcon] = useState('folder')
  const [extInput, setExtInput] = useState('')
  const [nameRegex, setNameRegex] = useState('')
  const [pathGlob, setPathGlob] = useState('')
  const [minSizeMB, setMinSizeMB] = useState('')
  const [maxSizeMB, setMaxSizeMB] = useState('')
  const [modifiedWithinDays, setModifiedWithinDays] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setJsonString(JSON.stringify(config, null, 2))
      setJsonError(null)
      setFormError(null)
    }
  }, [isOpen, config])

  if (!isOpen) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!viewName.trim()) {
      setFormError('Lütfen bir görünüm adı girin.')
      return
    }

    if (nameRegex.trim()) {
      try {
        new RegExp(nameRegex.trim(), 'i')
      } catch (err: any) {
        setFormError('Geçersiz regex ifadesi: ' + err.message)
        return
      }
    }

    const newView: VirtualView = {
      id: 'view_' + Date.now(),
      name: viewName.trim(),
      icon: viewIcon,
      rules: {
        ext: extInput
          ? extInput
              .split(',')
              .map((e) => e.trim().replace(/^\./, ''))
              .filter(Boolean)
          : undefined,
        nameRegex: nameRegex.trim() || undefined,
        pathGlob: pathGlob.trim() || undefined,
        minSizeMB: minSizeMB ? parseFloat(minSizeMB) : undefined,
        maxSizeMB: maxSizeMB ? parseFloat(maxSizeMB) : undefined,
        modifiedWithinDays: modifiedWithinDays ? parseInt(modifiedWithinDays, 10) : undefined,
        tags: tagsInput
          ? tagsInput
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined
      }
    }

    const updatedConfig: AppConfig = {
      ...config,
      views: [...config.views, newView]
    }

    onSaveConfig(updatedConfig)
    onClose()
  }

  const handleJsonSave = () => {
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonString)
      if (!parsed.views || !Array.isArray(parsed.views)) {
        throw new Error('Config içerisinde "views" dizisi bulunmalıdır.')
      }
      onSaveConfig(parsed)
      onClose()
    } catch (err: any) {
      setJsonError('JSON biçimlendirme hatası: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Başlığı */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Kural & Sanal Klasör Yapılandırması
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Yeni Sanal Klasör Ekle
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Doğrudan JSON Düzenle</span>
          </button>
        </div>

        {/* Gövde */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'form' ? (
            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Sanal Klasör Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder="Örn: 2026 İhale Belgeleri"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    İkon
                  </label>
                  <select
                    value={viewIcon}
                    onChange={(e) => setViewIcon(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="folder">Klasör</option>
                    <option value="file-text">Belge</option>
                    <option value="file-spreadsheet">Tablo</option>
                    <option value="image">Görsel</option>
                    <option value="archive">Arşiv</option>
                    <option value="calendar">Takvim</option>
                    <option value="hard-drive">Depo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Uzantılar (virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={extInput}
                  onChange={(e) => setExtInput(e.target.value)}
                  placeholder="pdf, docx, xlsx"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  İsim Regex Deseni
                </label>
                <input
                  type="text"
                  value={nameRegex}
                  onChange={(e) => setNameRegex(e.target.value)}
                  placeholder="Örn: (teklif|sozlesme).*\.pdf$"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Konum Glob Deseni
                </label>
                <input
                  type="text"
                  value={pathGlob}
                  onChange={(e) => setPathGlob(e.target.value)}
                  placeholder="Örn: 2026/**/*.pdf"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Min MB
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minSizeMB}
                    onChange={(e) => setMinSizeMB(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Maks MB
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={maxSizeMB}
                    onChange={(e) => setMaxSizeMB(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Son X Gün
                  </label>
                  <input
                    type="number"
                    value={modifiedWithinDays}
                    onChange={(e) => setModifiedWithinDays(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Etiketler (virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="onaylı, acil, muhasebe"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Sanal Klasörü Ekle
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {jsonError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}
              <textarea
                value={jsonString}
                onChange={(e) => setJsonString(e.target.value)}
                rows={16}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 select-text"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleJsonSave}
                  className="px-4 py-2 rounded-lg text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  JSON'u Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
