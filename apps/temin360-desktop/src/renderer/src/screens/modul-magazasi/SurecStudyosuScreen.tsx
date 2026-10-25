import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { APP_ROUTES } from '../../constants/routeConstants'

/**
 * Süreç Stüdyosu ekranı doğrudan gerçek 4734 Doğrudan Temin
 * süreç ve dosyalar ekranına yönlendirir.
 */
export default function SurecStudyosuScreen(): React.JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: APP_ROUTES.DOSYALAR })
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-full p-8 text-slate-500 text-sm">
      Doğrudan Temin Dosyalarına yönlendiriliyor...
    </div>
  )
}
