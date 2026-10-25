import { useState, useMemo, useCallback } from 'react'
import { EBYS_TEMPLATES } from '../data/ebysTemplates.data'
import { EbysCategory, EbysTemplateVariables } from '../ebys.types'
import { useEbysStudioStore } from '../store/ebysStudioStore'

export type StudioTab = 'preview' | 'resmi_yazi' | 'editor' | 'html' | 'css' | 'mevzuat'

export function useEbysStudio() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('ust_yazi_standart')
  const [activeCategory, setActiveCategory] = useState<EbysCategory>('hepsi')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<StudioTab>('preview')
  const [zoomLevel, setZoomLevel] = useState<number>(90)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'templates' | 'variables'>('templates')

  const customTemplates = useEbysStudioStore((state) => state.customTemplates)
  const getCustomTemplatesAsEbys = useEbysStudioStore((state) => state.getCustomTemplatesAsEbys)

  const allTemplates = useMemo(() => {
    return [...getCustomTemplatesAsEbys(), ...EBYS_TEMPLATES]
  }, [getCustomTemplatesAsEbys, customTemplates])

  const selectedTemplate = useMemo(() => {
    return (
      allTemplates.find((t) => t.id === selectedTemplateId) || allTemplates[0] || EBYS_TEMPLATES[0]
    )
  }, [allTemplates, selectedTemplateId])

  const [variables, setVariables] = useState<EbysTemplateVariables>(() => {
    return { ...selectedTemplate.defaultVariables }
  })

  // Şablon değiştiğinde değişkenleri yeni şablonun varsayılanlarına eşitle
  const handleSelectTemplate = useCallback(
    (id: string) => {
      const target = allTemplates.find((t) => t.id === id)
      if (target) {
        setSelectedTemplateId(id)
        setVariables({ ...target.defaultVariables })
      }
    },
    [allTemplates]
  )

  const handleVariableChange = useCallback((field: keyof EbysTemplateVariables, value: any) => {
    setVariables((prev) => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleResetVariables = useCallback(() => {
    setVariables({ ...selectedTemplate.defaultVariables })
  }, [selectedTemplate])

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((tpl) => {
      const matchesCategory = activeCategory === 'hepsi' || tpl.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        tpl.name.toLowerCase().includes(query) ||
        tpl.description.toLowerCase().includes(query) ||
        tpl.categoryLabel.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [allTemplates, activeCategory, searchQuery])

  const currentHtml = useMemo(() => {
    return selectedTemplate.generateHtml(variables)
  }, [selectedTemplate, variables])

  const currentCss = useMemo(() => {
    return selectedTemplate.generateCss()
  }, [selectedTemplate])

  const handleCopyCode = useCallback(
    async (type: 'html' | 'css') => {
      const textToCopy = type === 'html' ? currentHtml : currentCss
      try {
        await navigator.clipboard.writeText(textToCopy)
        setCopyStatus(type === 'html' ? 'HTML Kopyalandı!' : 'CSS Kopyalandı!')
        setTimeout(() => setCopyStatus(null), 2500)
      } catch {
        setCopyStatus('Kopyalama başarısız oldu')
        setTimeout(() => setCopyStatus(null), 2000)
      }
    },
    [currentHtml, currentCss]
  )

  const handleDownloadHtml = useCallback(() => {
    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedTemplate.name} - EBYS Resmî Yazı</title>
  <style>
${currentCss}
  </style>
</head>
<body>
${currentHtml}
</body>
</html>`
    const blob = new Blob([fullHtmlDocument], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [selectedTemplate, currentHtml, currentCss])

  const handleDownloadCss = useCallback(() => {
    const blob = new Blob([currentCss], { type: 'text/css;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ebys-standart-stiller.css`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [currentCss])

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>${selectedTemplate.name}</title>
        <style>
          ${currentCss}
          @media print {
            body { margin: 0; padding: 0; background: #fff; }
            .ebys-a4-page { box-shadow: none; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${currentHtml}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }, [selectedTemplate, currentHtml, currentCss])

  return {
    selectedTemplate,
    selectedTemplateId,
    activeCategory,
    searchQuery,
    activeTab,
    zoomLevel,
    copyStatus,
    sidebarTab,
    variables,
    filteredTemplates,
    currentHtml,
    currentCss,
    setSelectedTemplateId: handleSelectTemplate,
    setActiveCategory,
    setSearchQuery,
    setActiveTab,
    setZoomLevel,
    setSidebarTab,
    handleVariableChange,
    handleResetVariables,
    handleCopyCode,
    handleDownloadHtml,
    handleDownloadCss,
    handlePrint
  }
}
