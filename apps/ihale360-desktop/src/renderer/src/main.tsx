import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useGlobalDocumentPreviewStore } from './store/globalDocumentPreviewStore'
import { useTabStore } from './store/tabStore'

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
