import React from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Upload
} from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { TargetTable } from './importTables.data'
import { ImportResult } from './useImportScreenLogic'

interface ImportMappingPanelProps {
  parsedData: any[] | null
  targetTable?: TargetTable
  jsonKeys: string[]
  mappings: Record<string, string>
  onMappingChange: (jsonKey: string, dbColumn: string) => void
  importResult: ImportResult | null
  isImporting: boolean
  onImport: () => void
  onViewResult: () => void
}

export function ImportMappingPanel({
  parsedData,
  targetTable,
  jsonKeys,
  mappings,
  onMappingChange,
  importResult,
  isImporting,
  onImport,
  onViewResult
}: ImportMappingPanelProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 h-full flex flex-col">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
            2
          </span>
          Sütun Eşleştirme ve Aktarım
        </h3>

        {!parsedData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <ArrowRight className="w-8 h-8 mb-3 text-slate-300 dark:text-slate-600" />
            Devam etmek için sol taraftan geçerli bir JSON girip "Veriyi Oku" butonuna tıklayın.
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="text-sm text-blue-700 dark:text-blue-300 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-2 border border-blue-100 dark:border-blue-800">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <span>
                Başarıyla <strong>{parsedData.length}</strong> kayıt algılandı.
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
              JSON ALANLARI → HEDEF SÜTUNLAR
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px]">
              {jsonKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50"
                >
                  <div
                    className="flex-1 text-xs font-mono truncate text-slate-700 dark:text-slate-300"
                    title={key}
                  >
                    {key}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  <select
                    className="flex-1 h-8 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
                    value={mappings[key] || ''}
                    onChange={(e) => onMappingChange(key, e.target.value)}
                  >
                    <option value="">-- Atla --</option>
                    {targetTable?.columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {importResult && (
              <div
                className={`mt-4 p-3 text-sm rounded-lg flex flex-col gap-2 ${
                  importResult.success
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {importResult.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="font-bold text-[13px] text-green-800 dark:text-green-300">
                          İçe Aktarma İşlemi Tamamlandı
                        </div>
                        <p className="text-xs text-green-700/90 dark:text-green-400/90 leading-relaxed">
                          İşlenen toplam <strong>{importResult.total}</strong> kayıttan{' '}
                          <strong>{importResult.count}</strong> tanesi sisteme başarıyla eklendi.
                        </p>
                        {(importResult.total || 0) > (importResult.count || 0) && (
                          <div className="mt-2 text-sm bg-amber-50 dark:bg-amber-955/30 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/50">
                            <strong className="text-amber-900 dark:text-amber-300">
                              {(importResult.total || 0) - (importResult.count || 0)} kayıt sisteme
                              eklenemedi ve atlandı.
                            </strong>
                            {importResult.skipReasons && importResult.skipReasons.length > 0 ? (
                              <>
                                <p className="mt-1 opacity-90 text-amber-800 dark:text-amber-400">
                                  Atlanma Sebepleri:
                                </p>
                                <ul className="list-disc pl-4 mt-0.5 space-y-0.5 opacity-80 text-amber-800 dark:text-amber-400">
                                  {importResult.skipReasons.map((reason: string, idx: number) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <>
                                <p className="mt-1 opacity-90">Olası Sebepler:</p>
                                <ul className="list-disc pl-4 mt-0.5 space-y-0.5 opacity-80">
                                  <li>
                                    Sistemde aynı benzersiz değere (Kod, Barkod, TC, Vergi No, Ad)
                                    sahip kayıt zaten var.
                                  </li>
                                  <li>
                                    Zorunlu alanları (Ad, Tip vb.) boş bıraktınız veya doğru
                                    eşleştirmediniz.
                                  </li>
                                </ul>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>Hata: {importResult.error}</span>
                    </>
                  )}
                </div>
                {importResult.success && (
                  <div className="flex justify-end mt-1">
                    <Button
                      variant="outline"
                      className="bg-white border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 text-xs py-1 h-7 gap-1.5 shadow-sm"
                      onClick={onViewResult}
                    >
                      Sonucu Gör <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={onImport}
              disabled={isImporting || Object.keys(mappings).length === 0}
              className="w-full mt-6 flex justify-center items-center gap-2"
              variant={importResult?.success ? 'secondary' : 'default'}
            >
              {isImporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? 'Aktarılıyor...' : 'Eşleşenleri İçe Aktar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
