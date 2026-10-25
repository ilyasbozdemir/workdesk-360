import React, { useEffect, useState } from 'react'
import { ArrowLeft, LayoutTemplate, RefreshCw, Save } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../utils/cn'
import { Sablon } from '../sablonlar.hooks'
import {
  getDefaultMappingForProcess,
  ProcessMapping,
  TableColumnMapping
} from '../../../constants/mappings'
import { VariableRow } from './VariableRow'
import { defaultTemplatesByPath } from './defaultTemplates'

interface InlineSablonBaglayiciProps {
  processPath: string
  processName: string
  stageNo: number
  sablonlar: Sablon[]
  onBack: () => void
}

export function InlineSablonBaglayici({
  processPath,
  processName,
  stageNo,
  sablonlar,
  onBack
}: InlineSablonBaglayiciProps): React.JSX.Element {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)
  const [boundSablonId, setBoundSablonId] = useState<string>('')
  const [localOverrides, setLocalOverrides] = useState<ProcessMapping>({})

  const selectedSablon = sablonlar.find((s) => s.id.toString() === boundSablonId) || null

  const templatePlaceholders = React.useMemo(() => {
    if (!selectedSablon) return []
    if (selectedSablon.test_verisi) {
      try {
        const parsed = JSON.parse(selectedSablon.test_verisi)
        return Object.keys(parsed)
      } catch {
        return []
      }
    }
    return []
  }, [selectedSablon])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await (window as any).electron.ipcRenderer.invoke('db:get-settings')
      if (res) {
        const mappingKey = `MAPPING_${processPath}_SABLON_ID`
        let sablonId = res[mappingKey] || ''
        if (!sablonId) {
          const defaultDosyaAdi = defaultTemplatesByPath[processPath]
          if (defaultDosyaAdi) {
            const found = sablonlar.find((s) => s.dosya_adi === defaultDosyaAdi)
            if (found) {
              sablonId = found.id.toString()
            }
          }
        }
        setBoundSablonId(sablonId)

        const overridesKey = `MAPPING_${processPath}_PLACEHOLDERS`
        if (res[overridesKey]) {
          try {
            const parsed = JSON.parse(res[overridesKey])
            setLocalOverrides(parsed)
          } catch {
            setLocalOverrides({})
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [processPath])

  const handleSaveBinding = async () => {
    try {
      setSaving(true)
      const current = await (window as any).electron.ipcRenderer.invoke('db:get-settings')
      const newSettings = { ...current }

      newSettings[`MAPPING_${processPath}_SABLON_ID`] = boundSablonId || null

      const res = await (window as any).electron.ipcRenderer.invoke('db:save-settings', newSettings)
      if (res.success) {
        alert('Şablon bağlaması başarıyla kaydedildi!')
        loadSettings()
      } else {
        alert('Kaydetme hatası: ' + res.error)
      }
    } catch (e: any) {
      alert('İşlem hatası: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleMappingChange = (key: string, newMapping: TableColumnMapping) => {
    setLocalOverrides((prev) => ({ ...prev, [key]: newMapping }))
  }

  const handleSaveMappings = async () => {
    try {
      setSavingMapping(true)
      const current = await (window as any).electron.ipcRenderer.invoke('db:get-settings')
      const overridesKey = `MAPPING_${processPath}_PLACEHOLDERS`
      const newSettings = {
        ...current,
        [overridesKey]: JSON.stringify(localOverrides)
      }
      const res = await (window as any).electron.ipcRenderer.invoke('db:save-settings', newSettings)
      if (res.success) {
        alert('Değişken eşleşmeleri kaydedildi!')
      } else {
        alert('Kaydetme hatası: ' + res.error)
      }
    } catch (e: any) {
      alert('İşlem hatası: ' + e.message)
    } finally {
      setSavingMapping(false)
    }
  }

  const handleResetMappings = async () => {
    if (
      !confirm('Tüm özelleştirmeler silinip varsayılan eşleşmelere dönülecek. Onaylıyor musunuz?')
    ) {
      return
    }
    try {
      setSavingMapping(true)
      const current = await (window as any).electron.ipcRenderer.invoke('db:get-settings')
      const overridesKey = `MAPPING_${processPath}_PLACEHOLDERS`
      const newSettings = { ...current, [overridesKey]: null }
      const res = await (window as any).electron.ipcRenderer.invoke('db:save-settings', newSettings)
      if (res.success) {
        setLocalOverrides({})
        alert('Varsayılan eşleşmelere dönüldü!')
      }
    } catch (e: any) {
      alert('İşlem hatası: ' + e.message)
    } finally {
      setSavingMapping(false)
    }
  }

  const defaultMappingForProcess = getDefaultMappingForProcess(processPath)

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* HEADER CONTROLS */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-600 dark:text-slate-400"
          title="Süreç Listesine Geri Dön"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>
              Aşama {stageNo} - {processName}
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{processPath}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* SABLON SEÇİM PANELİ (LEFT SIDE) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 flex flex-col gap-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              Bağlanacak Şablon
            </h3>
            <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
              <button
                onClick={() => setBoundSablonId('')}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border transition-all text-left',
                  boundSablonId === ''
                    ? 'border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                )}
              >
                <span className="w-4 h-4 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  {boundSablonId === '' && <span className="w-2 h-2 rounded-full bg-slate-500" />}
                </span>
                <span className="italic">Bağlı Değil</span>
              </button>

              {sablonlar.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setBoundSablonId(s.id.toString())}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border transition-all text-left',
                    boundSablonId === s.id.toString()
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <span className="w-4 h-4 shrink-0 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                    {boundSablonId === s.id.toString() && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </span>
                  <LayoutTemplate className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate flex-1">{s.ad}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
              <Button
                onClick={handleSaveBinding}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Kaydediliyor...' : 'Şablonu Bağla'}
              </Button>
            </div>
          </div>

          {/* DEĞİŞKEN EŞLEŞTİRMELERİ (RIGHT SIDE - 2 COLUMNS) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {boundSablonId && templatePlaceholders.length > 0 ? (
              <div className="flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Şablon Değişken Eşleştirmeleri
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Şablondaki değişkenlerin veritabanı sütun eşleşmeleri
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleResetMappings}
                      disabled={savingMapping}
                      variant="outline"
                      className="text-xs px-3 py-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 h-8"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Varsayılana Dön
                    </Button>
                    <Button
                      onClick={handleSaveMappings}
                      disabled={savingMapping}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 h-8"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" /> Eşleşmeleri Kaydet
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[450px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-955 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 w-1/4">Anahtar (Key)</th>
                        <th className="px-4 py-2 w-1/4">Tablo</th>
                        <th className="px-4 py-2 w-1/4">Sütun</th>
                        <th className="px-4 py-2 w-1/4">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {templatePlaceholders.map((key) => {
                        const defaultMap = defaultMappingForProcess[key]
                        const overriddenMap = localOverrides[key]
                        const activeMap = overriddenMap || defaultMap || { tablo: '', sutun: '' }
                        return (
                          <VariableRow
                            key={key}
                            variableKey={key}
                            mapping={activeMap}
                            onChange={handleMappingChange}
                          />
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-sm">
                Bağlı bir şablon yok veya seçilen şablonda değişken bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
