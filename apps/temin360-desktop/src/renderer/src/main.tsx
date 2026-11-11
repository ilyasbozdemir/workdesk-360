import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useGlobalDocumentPreviewStore } from './store/globalDocumentPreviewStore'
import { useTabStore } from './store/tabStore'
import { configureTeminEngine } from '@temin360/document-templates'
import { DocumentEngine } from '@worksuite-360/document-engine'

// 1. Desktop SQLite veritabanı sorgulayıcısını DocumentEngine'e enjekte et
DocumentEngine.setQueryExecutor(async (sql: string, params: any[]) => {
  if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
    const res = await (window as any).electron.ipcRenderer.invoke('db:query', sql, params)
    if (res && res.success === false) {
      throw new Error(res.error || 'Sorgu başarısız')
    }
    return (res && res.data) ? res.data : (Array.isArray(res) ? res : [])
  }
  return []
})

// 2. Document Engine'i (validatör, header resolver, şablonlar) tek elden yapılandır
configureTeminEngine()

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__teminStores = {
    useGlobalDocumentPreviewStore,
    useTabStore
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
