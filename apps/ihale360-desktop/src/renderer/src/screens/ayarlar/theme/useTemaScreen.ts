import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import {
  getInitialPlaygroundVars,
  stringifyCssVariables,
  themeVariablesMeta,
  ThemeConfig
} from './themeVariables'

export function useTemaScreen() {
  const { themeLightVars, themeDarkVars, setThemeLightVars, setThemeDarkVars, loadSettings } =
    useSettingsStore()

  const [localLight, setLocalLight] = useState('')
  const [localDark, setLocalDark] = useState('')
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{
    text: string
    type: 'success' | 'error'
  } | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importJsonText, setImportJsonText] = useState('')

  // Designer Playground states
  const [activeTab, setActiveTab] = useState<'presets' | 'designer'>('presets')
  const [designerMode, setDesignerMode] = useState<'light' | 'dark'>('light')
  const [playgroundVars, setPlaygroundVars] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'primary' | 'text-bg' | 'sidebar'
  >('all')
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiThemeDesc, setAiThemeDesc] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [lastRawSync, setLastRawSync] = useState({ light: '', dark: '' })

  useEffect(() => {
    loadSettings().then(() => {
      setLocalLight(themeLightVars || '')
      setLocalDark(themeDarkVars || '')
    })
  }, [themeLightVars, themeDarkVars, loadSettings])

  useEffect(() => {
    if (activeTab === 'designer') {
      const currentRaw = designerMode === 'light' ? localLight : localDark
      const lastRaw = designerMode === 'light' ? lastRawSync.light : lastRawSync.dark
      if (currentRaw !== lastRaw) {
        setPlaygroundVars(getInitialPlaygroundVars(currentRaw, designerMode))
        setLastRawSync((prev) => ({
          ...prev,
          [designerMode]: currentRaw
        }))
      }
    }
  }, [activeTab, designerMode, localLight, localDark, lastRawSync])

  const showStatus = (text: string, type: 'success' | 'error' = 'success'): void => {
    setNotification({ text, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handlePlaygroundVarChange = (key: string, value: string): void => {
    setPlaygroundVars((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const applyThemeVars = (cssText: string): void => {
    const root = document.documentElement
    const lines = cssText.split('\n')
    lines.forEach((line) => {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const value = parts.slice(1).join(':').replace(';', '').trim()
        if (key.startsWith('--')) {
          root.style.setProperty(key, value)
        }
      }
    })
  }

  const applyPlaygroundToEditor = (): void => {
    const cssText = stringifyCssVariables(playgroundVars)
    if (designerMode === 'light') {
      setLocalLight(cssText)
      setLastRawSync((prev) => ({ ...prev, light: cssText }))
    } else {
      setLocalDark(cssText)
      setLastRawSync((prev) => ({ ...prev, dark: cssText }))
    }
    showStatus('Tasarım değişkenleri editöre aktarıldı. Kaydetmeyi unutmayın!')
  }

  const savePlaygroundDirectly = async (): Promise<void> => {
    setSaving(true)
    try {
      const cssText = stringifyCssVariables(playgroundVars)
      let nextLight = localLight
      let nextDark = localDark

      if (designerMode === 'light') {
        nextLight = cssText
        setLocalLight(cssText)
        setLastRawSync((prev) => ({ ...prev, light: cssText }))
      } else {
        nextDark = cssText
        setLocalDark(cssText)
        setLastRawSync((prev) => ({ ...prev, dark: cssText }))
      }

      await window.electron.ipcRenderer.invoke('db:save-settings', {
        themeLightVars: nextLight,
        themeDarkVars: nextDark
      })

      setThemeLightVars(nextLight)
      setThemeDarkVars(nextDark)
      applyThemeVars(nextLight)
      applyThemeVars(nextDark)

      showStatus('Tema başarıyla kaydedildi ve uygulandı!')
    } catch (error) {
      console.error(error)
      showStatus('Ayarlar kaydedilirken bir hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const generateAiPrompt = (): void => {
    const styleDescription = aiThemeDesc.trim() || 'Modern Minimalist Mavi'
    const variablesExplanation = themeVariablesMeta
      .map(
        (v) =>
          `- ${v.key}: ${v.description} (Örnek: ${
            designerMode === 'light' ? v.defaultLight : v.defaultDark
          })`
      )
      .join('\n')

    const promptText = `Evraktron adlı Electron/React uygulamamız için ${
      designerMode === 'light' ? 'Açık (Light)' : 'Karanlık (Dark)'
    } tema rengi tasarlamanı istiyorum.
İstediğim tema stili / renk paleti açıklaması: "${styleDescription}".

Lütfen aşağıdaki CSS değişkenlerine uygun HEX (veya rgba) değerlerini belirle ve bana SADECE aşağıdaki JSON yapısında bir çıktı ver. Ekstra açıklama veya kod bloğu dışı metin ekleme, doğrudan kopyalayabileceğim bir JSON döndür.

Değişkenler ve anlamları:
${variablesExplanation}

İstenen JSON formatı:
{
  ${themeVariablesMeta.map((v) => `"${v.key}": "DEĞER"`).join(',\n  ')}
}

Not: --sidebar-active-bg için rgba(r, g, b, opaklık) formatında (örn: rgba(0, 229, 255, 0.15)) soft bir renk ver, diğer hepsi standart HEX olmalıdır (#123456 gibi).`

    setGeneratedPrompt(promptText)
    setCopiedPrompt(false)
  }

  const copyPromptToClipboard = (): void => {
    navigator.clipboard.writeText(generatedPrompt)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      await window.electron.ipcRenderer.invoke('db:save-settings', {
        themeLightVars: localLight,
        themeDarkVars: localDark
      })
      setThemeLightVars(localLight)
      setThemeDarkVars(localDark)
      applyThemeVars(localLight)
      applyThemeVars(localDark)
      showStatus('Tema başarıyla kaydedildi ve uygulandı!')
    } catch (error) {
      console.error(error)
      showStatus('Ayarlar kaydedilirken bir hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const setPresetTheme = async (light: string, dark: string, name: string): Promise<void> => {
    setLocalLight(light)
    setLocalDark(dark)
    setSaving(true)
    try {
      await window.electron.ipcRenderer.invoke('db:save-settings', {
        themeLightVars: light,
        themeDarkVars: dark
      })
      setThemeLightVars(light)
      setThemeDarkVars(dark)
      applyThemeVars(light)
      applyThemeVars(dark)
      showStatus(`${name} teması başarıyla uygulandı!`)
    } catch (error) {
      console.error(error)
      showStatus('Tema kaydedilirken bir hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportTheme = (): void => {
    const dataStr = JSON.stringify(
      {
        light: localLight,
        dark: localDark
      },
      null,
      2
    )
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = 'hakim-pro_temalar.json'

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    showStatus('Tema JSON dosyası başarıyla indirildi.')
  }

  const handleImport = (): void => {
    try {
      const parsed = JSON.parse(importJsonText) as ThemeConfig
      if (typeof parsed.light === 'string' && typeof parsed.dark === 'string') {
        setLocalLight(parsed.light)
        setLocalDark(parsed.dark)
        setShowImportModal(false)
        setImportJsonText('')
        showStatus('Tema başarıyla içe aktarıldı. Uygulamak için kaydet butonuna basın.')
      } else {
        alert('Geçersiz tema JSON formatı. "light" ve "dark" alanları string olmalıdır.')
      }
    } catch {
      alert('Geçersiz JSON formatı. Lütfen kopyaladığınız içeriği kontrol edin.')
    }
  }

  return {
    localLight,
    setLocalLight,
    localDark,
    setLocalDark,
    saving,
    notification,
    showImportModal,
    setShowImportModal,
    importJsonText,
    setImportJsonText,
    activeTab,
    setActiveTab,
    designerMode,
    setDesignerMode,
    playgroundVars,
    selectedCategory,
    setSelectedCategory,
    showAiModal,
    setShowAiModal,
    aiThemeDesc,
    setAiThemeDesc,
    generatedPrompt,
    setGeneratedPrompt,
    copiedPrompt,
    showStatus,
    handlePlaygroundVarChange,
    applyPlaygroundToEditor,
    savePlaygroundDirectly,
    generateAiPrompt,
    copyPromptToClipboard,
    handleSave,
    setPresetTheme,
    exportTheme,
    handleImport
  }
}
