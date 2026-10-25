import React from 'react'
import { ColumnInfo } from './types'

interface SchemaTabProps {
  columns: ColumnInfo[]
}

export function SchemaTab({ columns }: SchemaTabProps): React.JSX.Element {
  return (
    <div className="h-full overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
      <table className="w-full border-collapse text-[10px] text-left">
        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 font-bold border-b border-slate-200 dark:border-slate-800">
          <tr className="text-slate-600 dark:text-slate-400">
            <th className="p-3 w-16 text-center">CID</th>
            <th className="p-3">Kolon Adı</th>
            <th className="p-3 w-32">Veri Tipi</th>
            <th className="p-3 w-32 text-center">Boş Değer (Nullable)</th>
            <th className="p-3 w-32 text-center">Anahtar &amp; Tür</th>
            <th className="p-3">Varsayılan Değer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
          {columns.map((c) => (
            <tr key={c.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
              <td className="p-3 border-r border-slate-150 dark:border-slate-850 text-center text-slate-400">
                {c.cid}
              </td>
              <td className="p-3 border-r border-slate-150 dark:border-slate-850 font-bold text-slate-800 dark:text-slate-200">
                {c.name}
              </td>
              <td className="p-3 border-r border-slate-150 dark:border-slate-850 uppercase text-blue-600 dark:text-blue-400 font-bold">
                {c.type || 'TEXT'}
              </td>
              <td className="p-3 border-r border-slate-150 dark:border-slate-850 text-center font-bold">
                {c.notnull === 1 ? (
                  <span className="text-red-500 font-bold">NOT NULL</span>
                ) : (
                  <span className="text-slate-400">NULLABLE</span>
                )}
              </td>
              <td className="p-3 border-r border-slate-150 dark:border-slate-850 text-center">
                {c.pk === 1 ? (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded font-black text-[9px]">
                    PRIMARY KEY 🔑
                  </span>
                ) : c.name.endsWith('_id') ? (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 rounded font-black text-[9px]">
                    FOREIGN KEY 🔗
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td className="p-3 text-slate-500">
                {c.dflt_value === null ? (
                  <span className="italic text-slate-300 dark:text-slate-600">yok</span>
                ) : (
                  String(c.dflt_value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
