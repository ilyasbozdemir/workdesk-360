import React from 'react'
import {
  DosyaSihirbaziScreen,
  type DosyaSihirbaziScreenProps,
  type AlimTuru
} from '../../screens/dosyalar/sihirbaz.screen'

export type { AlimTuru }

export interface DosyaSihirbaziModalProps extends DosyaSihirbaziScreenProps {
  isOpen?: boolean
}

/**
 * DosyaSihirbaziModal (Sayfa / Page Modülü)
 * Kullanıcı talebi doğrultusunda popup/modal dialog yerine bağımsız tam sayfa (page) olarak çalışmaktadır.
 */
export function DosyaSihirbaziModal({
  isOpen = true,
  initialStage = 1,
  onClose,
  onSuccess
}: DosyaSihirbaziModalProps): React.JSX.Element | null {
  if (isOpen === false) return null

  return (
    <DosyaSihirbaziScreen initialStage={initialStage} onClose={onClose} onSuccess={onSuccess} />
  )
}

export { DosyaSihirbaziScreen }
export default DosyaSihirbaziModal
