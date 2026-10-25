import React from 'react'
import { DosyaManageScreen } from './manage.screen'

export type AlimTuru = 'mal' | 'hizmet' | 'yapim_isi' | 'danismanlik'

export interface DosyaSihirbaziScreenProps {
  initialStage?: number
  onSuccess?: (createdDosyaId: number) => void
  onClose?: () => void
}

/**
 * DosyaSihirbaziScreen
 * Artık ana doğrudan temin dosya oluşturma aracı olan DosyaManageScreen'e bağlanmıştır.
 */
export { DosyaManageScreen }
export const DosyaSihirbaziScreen: React.FC<DosyaSihirbaziScreenProps> = () => {
  return <DosyaManageScreen />
}
export default DosyaSihirbaziScreen
