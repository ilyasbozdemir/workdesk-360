import React from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { Dosya2886Item, DosyaListItem } from '../teminSelector.types'
import { TeminSelectorActive4734 } from './TeminSelectorActive4734'

interface TeminSelectorTriggerProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  is2886?: boolean
  isDt?: boolean
  active2886Dosya?: Dosya2886Item | null
  selectedDosya: DosyaListItem | undefined
  selectedIsIhale?: boolean
  navigate: (opts: { to: string }) => void
  addTab: (path: string) => void
  setShowInspector: (show: boolean) => void
  handleCloseDosya: () => void
  handleClose2886Dosya?: () => void
}

export const TeminSelectorTrigger = React.memo(function TeminSelectorTrigger(
  props: TeminSelectorTriggerProps
): React.JSX.Element {
  const { isOpen, setIsOpen, selectedDosya, navigate, addTab, setShowInspector, handleCloseDosya } =
    props

  if (selectedDosya) {
    return (
      <TeminSelectorActive4734
        selectedDosya={selectedDosya}
        selectedIsIhale={false}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        navigate={navigate}
        addTab={addTab}
        setShowInspector={setShowInspector}
        handleCloseDosya={handleCloseDosya}
      />
    )
  }

  return (
    <button
      onClick={(): void => setIsOpen(!isOpen)}
      className="flex items-center gap-2 px-3 sm:px-5 py-1.5 rounded-2xl transition-all text-xs font-semibold border border-dashed max-w-150 w-auto min-w-0 justify-center cursor-pointer shadow-2xs bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-50 hover:border-blue-400"
      title="Doğrudan Temin Dosyası Seçmek İçin Tıkla"
    >
      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
      <span className="truncate">
        Çalışmak İstediğiniz Doğrudan Temin Dosyasını Seçin (KİK Md. 22)...
      </span>
      <ChevronDown
        className={cn(
          'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-1.5 shrink-0',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  )
})
