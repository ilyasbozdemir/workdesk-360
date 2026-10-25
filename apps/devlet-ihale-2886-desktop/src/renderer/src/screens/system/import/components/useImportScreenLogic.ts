import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTabStore } from '../../../../store/tabStore'
import { TARGET_TABLES, TargetTable } from './importTables.data'

export interface ImportResult {
  success: boolean
  count?: number
  total?: number
  error?: string
  skipReasons?: string[]
}

export function useImportScreenLogic() {
  const navigate = useNavigate()
  const { addTab } = useTabStore()
  const queryClient = useQueryClient()
  const [jsonText, setJsonText] = useState('')
  const [targetId, setTargetId] = useState<string>('TANIM_Firma')
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleParse = () => {
    try {
      setParseError(null)
      setImportResult(null)

      let data: any
      try {
        data = JSON.parse(jsonText)
      } catch {
        const match = jsonText.match(/\[[\s\S]*\]/)
        if (match) {
          try {
            const sanitized = match[0]
              .replace(/'((?:\\'|[^'])*)'/g, '"$1"')
              .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
              .replace(/,\s*([}\]])/g, '$1')
            data = JSON.parse(sanitized)
          } catch {
            throw new Error('Geçersiz format. Hem standart JSON hem de JS formatı ayrıştırılamadı.')
          }
        } else {
          throw new Error(
            'Geçerli bir JSON veya JS dizisi (Array) bekliyoruz. Örn: [ { "ad": "X" } ]'
          )
        }
      }

      if (!Array.isArray(data)) {
        throw new Error('Veri bir dizi (Array) formatında olmalıdır.')
      }
      if (data.length === 0) {
        throw new Error('Dizi boş.')
      }
      setParsedData(data)

      // Auto-map where keys match exactly
      const firstObj = data[0] || {}
      const keys = Object.keys(firstObj)
      const currentTarget = TARGET_TABLES.find((t) => t.id === targetId)

      const newMappings: Record<string, string> = {}
      keys.forEach((key) => {
        if (currentTarget?.columns.includes(key)) {
          newMappings[key] = key
        }
      })
      setMappings(newMappings)
    } catch (err: any) {
      setParseError(err.message)
      setParsedData(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setJsonText(content)
      setParseError(null)
      setParsedData(null)
      setImportResult(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const targetTable = useMemo(() => TARGET_TABLES.find((t) => t.id === targetId), [targetId])

  const jsonKeys = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return []
    const keys = new Set<string>()
    parsedData.slice(0, 10).forEach((obj) => {
      Object.keys(obj).forEach((k) => keys.add(k))
    })
    return Array.from(keys)
  }, [parsedData])

  const handleMappingChange = (jsonKey: string, dbColumn: string) => {
    setMappings((prev) => {
      const updated = { ...prev }
      if (!dbColumn) {
        delete updated[jsonKey]
      } else {
        updated[jsonKey] = dbColumn
      }
      return updated
    })
  }

  const handleImport = async () => {
    if (!parsedData || Object.keys(mappings).length === 0) return

    setIsImporting(true)
    setImportResult(null)
    try {
      const res = await window.electron.ipcRenderer.invoke('db:bulk-import', {
        target: targetId,
        mappings,
        data: parsedData
      })
      setImportResult(res)
      if (res.success) {
        queryClient.invalidateQueries()
        setToast({
          message: `İçe aktarma tamamlandı: ${res.count} kayıt eklendi.`,
          type: 'success'
        })
        setTimeout(() => setToast(null), 5000)
        setJsonText('')
        setParsedData(null)
        setMappings({})
      } else {
        setToast({
          message: `İçe aktarma hatası: ${res.error}`,
          type: 'error'
        })
        setTimeout(() => setToast(null), 5000)
      }
    } catch (err: any) {
      setImportResult({ success: false, error: err.message })
      setToast({ message: `Sistemsel Hata: ${err.message}`, type: 'error' })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setIsImporting(false)
    }
  }

  const handleViewResult = (): void => {
    const route =
      targetId === 'TANIM_Birim'
        ? '/birimler'
        : targetId === 'TANIM_Firma'
          ? '/firmalar'
          : targetId === 'TANIM_Personel'
            ? '/personel'
            : targetId === 'TANIM_Kalem'
              ? '/malzemeler'
              : targetId === 'TANIM_Ambar'
                ? '/ambar'
                : targetId === 'settings'
                  ? '/kurum'
                  : '/'
    addTab(route)
    navigate({ to: route as any })
  }

  const handleTargetIdChange = (id: string): void => {
    setTargetId(id)
    setParsedData(null)
  }

  return {
    jsonText,
    setJsonText,
    targetId,
    setTargetId,
    handleTargetIdChange,
    parsedData,
    parseError,
    mappings,
    isImporting,
    importResult,
    toast,
    targetTable,
    jsonKeys,
    handleParse,
    handleFileUpload,
    handleMappingChange,
    handleImport,
    handleViewResult
  }
}
