import React from 'react'
import { useDbDictionary, useDbTables, useDbColumns } from '../sablonlar.hooks'
import { TableColumnMapping } from '../../../constants/mappings'

interface VariableRowProps {
  variableKey: string
  mapping?: TableColumnMapping
  onChange: (key: string, newMapping: TableColumnMapping) => void
}

export function VariableRow({
  variableKey,
  mapping,
  onChange
}: VariableRowProps): React.JSX.Element {
  const { data: dbDictionary = {} } = useDbDictionary()
  const { data: dbTables = [] } = useDbTables()
  const { data: dbColumns = [] } = useDbColumns(mapping?.tablo || null)

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
          {`{{${variableKey}}}`}
        </span>
      </td>
      <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <select
          value={mapping?.tablo || ''}
          title={`Tablo Seçimi - ${variableKey}`}
          onChange={(e) =>
            onChange(variableKey, {
              ...mapping,
              tablo: e.target.value,
              sutun: ''
            } as TableColumnMapping)
          }
          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">-- Tablo Seçin --</option>
          {dbTables.map((t) => {
            const tableLabel = dbDictionary[t]?.label ? `${t} (${dbDictionary[t].label})` : t
            return (
              <option key={t} value={t}>
                {tableLabel}
              </option>
            )
          })}
        </select>
      </td>
      <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <select
          value={mapping?.sutun || ''}
          title={`Sütun Seçimi - ${variableKey}`}
          disabled={!mapping?.tablo}
          onChange={(e) =>
            onChange(variableKey, { ...mapping, sutun: e.target.value } as TableColumnMapping)
          }
          className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="">-- Sütun Seçin --</option>
          {dbColumns.map((c) => {
            const t = mapping?.tablo || ''
            const colLabel = dbDictionary[t]?.columns?.[c]
              ? `${c} (${dbDictionary[t].columns[c]})`
              : c
            return (
              <option key={c} value={c}>
                {colLabel}
              </option>
            )
          })}
        </select>
      </td>
      <td
        className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 truncate max-w-[200px]"
        title={mapping?.aciklama}
      >
        {mapping?.aciklama || '-'}
      </td>
    </tr>
  )
}
