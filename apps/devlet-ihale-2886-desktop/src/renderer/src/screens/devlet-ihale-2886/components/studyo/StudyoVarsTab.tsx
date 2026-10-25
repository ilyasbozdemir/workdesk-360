import React from 'react'
import { Check, Copy } from 'lucide-react'

interface StudyoVarsTabProps {
  templateContext: Record<string, string | number>
  copiedVar: string | null
  onCopyVar: (key: string) => void
}

export function StudyoVarsTab({
  templateContext,
  copiedVar,
  onCopyVar
}: StudyoVarsTabProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 leading-relaxed">
        Aşağıdaki rozetlere tıklayarak değişken etiketini kopyalayabilir ve şablon metninizin
        istediğiniz yerine yapıştırabilirsiniz:
      </div>

      <div className="space-y-2">
        {Object.entries(templateContext).map(([key, val]) => (
          <div
            key={key}
            onClick={() => onCopyVar(key)}
            className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 bg-slate-50/60 dark:bg-slate-850/60 transition-all cursor-pointer"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                  {`{{${key}}}`}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                Değer:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {String(val)}
                </span>
              </div>
            </div>

            <div className="shrink-0 text-slate-400 group-hover:text-purple-600">
              {copiedVar === key ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
