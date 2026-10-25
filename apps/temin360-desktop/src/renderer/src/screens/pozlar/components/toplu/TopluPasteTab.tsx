import React from 'react'
import { Table as TableIcon } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface TopluPasteTabProps {
  pasteText: string
  setPasteText: (text: string) => void
  handleParsePastedText: () => void
}

export function TopluPasteTab({
  pasteText,
  setPasteText,
  handleParsePastedText
}: TopluPasteTabProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Excel'den veya Metin Dosyasından Kopyala-Yapıştır
          </h2>
          <p className="text-[11px] text-slate-500">
            Excel hücrelerini seçip kopyaladıktan sonra buraya (Ctrl+V) yapıştırarak tek tıkla
            tabloya dönüştürebilirsiniz.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleParsePastedText}
          disabled={!pasteText.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs py-2 px-4 font-bold cursor-pointer"
        >
          <TableIcon size={14} />
          <span>Metni Tabloya Dönüştür</span>
        </Button>
      </div>

      <textarea
        rows={12}
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        placeholder="Excel'den kopyaladığınız satırları veya JSON dizisini buraya yapıştırın..."
        className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-blue-500 scrollbar-thin"
      />
    </div>
  )
}
