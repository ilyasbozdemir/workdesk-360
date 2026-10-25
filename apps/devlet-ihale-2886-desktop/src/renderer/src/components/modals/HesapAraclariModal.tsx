import React from 'react'
import { HesapAraclariView } from './hesapAraclari/HesapAraclariView'
import type { HesapAraclariViewProps, HesapAraclariModalProps } from './hesapAraclari/types'

export type { HesapAraclariViewProps, HesapAraclariModalProps }
export { HesapAraclariView }

export function HesapAraclariModal({
  isOpen,
  onClose,
  onOpenSayiYaziModal
}: HesapAraclariModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <HesapAraclariView onClose={onClose} onOpenSayiYaziModal={onOpenSayiYaziModal} />
      </div>
    </div>
  )
}
