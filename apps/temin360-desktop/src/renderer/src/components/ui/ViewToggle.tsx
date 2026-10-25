import React from 'react'
import { LayoutGrid, List, Table as TableIcon } from 'lucide-react'
import { Button } from './Button'

export type DataViewMode = 'grid' | 'list' | 'table'

interface ViewToggleProps {
  viewMode: DataViewMode
  onChange: (mode: DataViewMode) => void
  className?: string
}

export function ViewToggle({
  viewMode,
  onChange,
  className = ''
}: ViewToggleProps): React.JSX.Element {
  return (
    <div
      className={`flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 ${className}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className={`px-3 py-1.5 h-8 rounded-md transition-all ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        onClick={() => onChange('grid')}
        title="Grid Görünümü"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`px-3 py-1.5 h-8 rounded-md transition-all ${
          viewMode === 'list'
            ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        onClick={() => onChange('list')}
        title="Liste Görünümü"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`px-3 py-1.5 h-8 rounded-md transition-all ${
          viewMode === 'table'
            ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        onClick={() => onChange('table')}
        title="Tablo Görünümü"
      >
        <TableIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}
