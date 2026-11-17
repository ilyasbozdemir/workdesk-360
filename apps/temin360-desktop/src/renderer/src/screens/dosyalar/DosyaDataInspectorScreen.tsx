import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTabStore } from '../../store/tabStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { APP_ROUTES } from '../../constants/routeConstants'

/**
 * Eski "/dosya/kunye" rotası artık ayrı bir ekran değildir.
 * Geriye dönük uyumluluk için (açık sekmeler, eski linkler) Dosya Detayı'na
 * (Süreç Takip Paneli → detay modu) yönlendirir.
 */
export const DosyaDataInspectorScreen: React.FC = () => {
  const { activeTabPath, addTab } = useTabStore()
  const navigate = useNavigate()

  const tabParams = new URLSearchParams(activeTabPath.split('?')[1] || '')
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const searchParams = new URLSearchParams(window.location.search)
  const paramIdStr = tabParams.get('id') || hashParams.get('id') || searchParams.get('id')
  const targetId = paramIdStr ? parseInt(paramIdStr, 10) : null

  useEffect(() => {
    if (targetId) {
      useWorkspaceStore.getState().setActiveDosyaId(targetId)
    }
    try {
      localStorage.setItem('temin_takip_view_mode', 'detay')
      window.dispatchEvent(
        new CustomEvent('takip:view-mode-changed', {
          detail: { mode: 'detay', dosyaId: targetId ?? undefined }
        })
      )
    } catch {
      // ignore
    }
    addTab(APP_ROUTES.DOSYA_DETAY)
    navigate({ to: APP_ROUTES.DOSYA_DETAY, replace: true })
  }, [targetId, navigate, addTab])

  return null
}

export default DosyaDataInspectorScreen
