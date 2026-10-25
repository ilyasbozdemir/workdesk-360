import React from 'react'
import { FolderTree } from 'lucide-react'

interface MalzemeGroupHeaderProps {
  groupMode: 'none' | 'tasinir' | 'okas'
  groupName: string
  itemCount: number
  isTableRow?: boolean
}

export function MalzemeGroupHeader({
  groupMode,
  groupName,
  itemCount,
  isTableRow = false
}: MalzemeGroupHeaderProps): React.JSX.Element | null {
  if (groupMode === 'none') return null

  const groupLabel = groupMode === 'tasinir' ? 'Taşınır Grubu' : 'OKAS Grubu'

  if (isTableRow) {
    return (
      <tr className="bg-slate-50/70 dark:bg-slate-900/40">
        <td colSpan={7} className="px-4 py-2 text-xs font-black text-slate-700 dark:text-slate-350">
          📁 {groupLabel}: {groupName} ({itemCount} Kalem)
        </td>
      </tr>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit border border-slate-200 dark:border-slate-750">
      <FolderTree className="w-3.5 h-3.5 text-blue-500" />
      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
        {groupLabel}: {groupName}
      </span>
      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-650 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
        {itemCount} Kalem
      </span>
    </div>
  )
}
