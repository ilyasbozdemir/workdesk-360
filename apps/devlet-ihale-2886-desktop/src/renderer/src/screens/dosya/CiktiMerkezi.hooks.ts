import { useState, useEffect, useCallback } from 'react'
import { Sablon } from '../sablonlar/sablonlar.hooks'
import { subPagesMapping } from '../../constants/surecler'
import { getDefaultMappingForProcess } from '../../constants/mappings'
import { filterContextForTemplate } from './CiktiMerkezi.mediator'
import { useAppEventListener } from '../../utils/appEvents'

export interface UseCiktiMerkeziDataResult {
  sablons: Sablon[]
  loading: boolean
  masterHtml: string
  dosyaContext: any
  activeDosya: any
  placeholders: any[]
  contextsByPath: Record<string, Record<string, unknown>>
  personelListesi: any[]
  settings: any
  refresh: (isBackgroundRefresh?: boolean) => Promise<void>
}

export function useCiktiMerkeziData(activeDosyaId: number | null): UseCiktiMerkeziDataResult {
  const [sablons, setSablons] = useState<Sablon[]>([])
  const [loading, setLoading] = useState(true)
  const [masterHtml, setMasterHtml] = useState('')
  const [dosyaContext, setDosyaContext] = useState<any>({})
  const [contextsByPath, setContextsByPath] = useState<Record<string, Record<string, unknown>>>({})
  const [activeDosya, setActiveDosya] = useState<any>(null)
  const [placeholders, setPlaceholders] = useState<any[]>([])
  const [personelListesi, setPersonelListesi] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  const loadData = useCallback(
    async (isBackgroundRefresh = false): Promise<void> => {
      if (!activeDosyaId) {
        setLoading(false)
        return
      }
      if (!isBackgroundRefresh) setLoading(true)
      try {
        if (!window.electron?.ipcRenderer) {
          setLoading(false)
          return
        }

        // Merkezi veri motorundan (belge:get-all-cikti-data) tek çağrıda tüm çıktı verilerini al
        const res = await window.electron.ipcRenderer.invoke('belge:get-all-cikti-data', {
          dosyaId: activeDosyaId
        })

        if (res && res.success && res.data) {
          const d = res.data
          if (d.sablons) setSablons(d.sablons)
          if (d.masterHtml) setMasterHtml(d.masterHtml)
          if (d.dosyaContext) setDosyaContext(d.dosyaContext)
          if (d.placeholders) setPlaceholders(d.placeholders)
          if (d.personelListesi) setPersonelListesi(d.personelListesi)
          if (d.settings) setSettings(d.settings)
          if (d.activeDosya) setActiveDosya(d.activeDosya)

          // Süreç bazlı filtrelenmiş bağlamları hazırla
          if (d.contextsByPath) {
            setContextsByPath(d.contextsByPath)
          } else if (d.dosyaContext) {
            const pathContexts: Record<string, Record<string, unknown>> = {}
            for (const stage of subPagesMapping) {
              const path = stage.path
              const mapping = getDefaultMappingForProcess(path)
              pathContexts[path] = filterContextForTemplate(
                mapping?.templateId || path,
                d.dosyaContext
              )
            }
            setContextsByPath(pathContexts)
          }
        } else {
          console.error(
            'Çıktı Merkezi veri yükleme hatası (merkezi motor yanıtı):',
            res?.error || 'Bilinmeyen hata'
          )
        }
      } catch (err) {
        console.error('Çıktı Merkezi veri yükleme IPC istisnası:', err)
      } finally {
        setLoading(false)
      }
    },
    [activeDosyaId]
  )

  // Sistem genelindeki gerçek zamanlı olayları dinle ve veriyi arka planda yenile
  useAppEventListener(
    [
      'items:changed',
      'bids:changed',
      'documents:changed',
      'dossier:updated',
      'status:changed',
      'print_queue:updated',
      'workspace:refreshed'
    ],
    () => {
      loadData(true)
    }
  )

  useEffect(() => {
    if (!activeDosyaId) return

    loadData(true)

    const unlisten = window.electron?.ipcRenderer?.on('db:invalidated', () => {
      loadData(true)
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [activeDosyaId, loadData])

  return {
    sablons,
    loading,
    masterHtml,
    dosyaContext,
    activeDosya,
    placeholders,
    contextsByPath,
    personelListesi,
    settings,
    refresh: loadData
  }
}
