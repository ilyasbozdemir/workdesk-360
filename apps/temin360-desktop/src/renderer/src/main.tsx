import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useGlobalDocumentPreviewStore } from './store/globalDocumentPreviewStore'
import { useTabStore } from './store/tabStore'
import { configureTeminEngine } from '@temin360/document-templates'
import { DocumentEngine } from '@worksuite-360/document-engine'
import { createElectronStorageAdapter } from './services/electronDocumentStorageAdapter'

// 1. Desktop SQLite veritabanı sorgulayıcısını ve depolama adaptörünü DocumentEngine'e enjekte et (IoC)
const electronStorage = createElectronStorageAdapter()
DocumentEngine.setStorageAdapter(electronStorage)
DocumentEngine.setQueryExecutor(electronStorage.executeQuery!)

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
