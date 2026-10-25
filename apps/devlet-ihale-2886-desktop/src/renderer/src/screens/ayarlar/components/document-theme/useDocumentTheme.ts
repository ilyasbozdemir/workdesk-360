import { useState, useEffect } from 'react'
import {
  DEFAULT_DOCUMENT_THEME,
  DocumentThemeConfig,
  createDocumentTheme
} from '@temin360/document-templates'
import { useAyarlarHooks } from '../../ayarlar.hooks'
import { DocumentThemeSectionType } from './constants'

export function useDocumentTheme() {
  const { settings, isLoadingSettings, updateSetting } = useAyarlarHooks()

  const [theme, setTheme] = useState<DocumentThemeConfig>(() => {
    if (settings.documentTemplateTheme) {
      return createDocumentTheme(settings.documentTemplateTheme)
    }
    return { ...DEFAULT_DOCUMENT_THEME }
  })

  const [activeSection, setActiveSection] = useState<DocumentThemeSectionType>('typography')
  const [isSaving, setIsSaving] = useState(false)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [notification, setNotification] = useState<{
    text: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success'): void => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Sync with DB settings on load
  useEffect(() => {
    if (settings.documentTemplateTheme) {
      setTheme(createDocumentTheme(settings.documentTemplateTheme))
    }
  }, [settings.documentTemplateTheme])

  const handleSaveToDb = async (): Promise<void> => {
    setIsSaving(true)
    try {
      const payload = {
        ...theme,
        summary: {
          description: 'Özelleştirilmiş resmi evrak şablon teması',
          lastUpdated: new Date().toISOString()
        }
      }
      await updateSetting({
        key: 'documentTemplateTheme',
        value: JSON.stringify(payload, null, 2)
      })
      showNotification('Resmi evrak şablon teması veritabanına başarıyla kaydedildi.', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      showNotification('Tema kaydedilirken hata oluştu: ' + msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefault = (): void => {
    if (
      window.confirm(
        'Şablon temasını sistem varsayılan ayarlarına sıfırlamak istediğinize emin misiniz?'
      )
    ) {
      setTheme({ ...DEFAULT_DOCUMENT_THEME })
      showNotification(
        'Şablon teması varsayılan değerlere döndürüldü. Değişiklikleri kalıcı yapmak için "DB\'ye Kaydet" butonuna basınız.',
        'info'
      )
    }
  }

  const handleExportJson = (): void => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(theme, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `temin360-belge-temasi-${new Date().toISOString().slice(0, 10)}.json`
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showNotification('Tema JSON dosyası olarak indirildi.', 'success')
  }

  const handleImportJson = (): void => {
    try {
      const parsed = JSON.parse(jsonText)
      const merged = createDocumentTheme(parsed)
      setTheme(merged)
      setJsonModalOpen(false)
      setJsonText('')
      showNotification(
        'Tema JSON verisinden başarıyla yüklendi. Kalıcı olması için kaydedin.',
        'success'
      )
    } catch {
      showNotification('Geçersiz JSON formatı!', 'error')
    }
  }

  return {
    theme,
    setTheme,
    activeSection,
    setActiveSection,
    isSaving,
    isLoadingSettings,
    jsonModalOpen,
    setJsonModalOpen,
    jsonText,
    setJsonText,
    notification,
    handleSaveToDb,
    handleResetToDefault,
    handleExportJson,
    handleImportJson
  }
}
