import React from 'react'
import { cn } from '../../utils/cn'

export interface InnerMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  description?: string
  isDivider?: boolean
  isHeader?: boolean
  badge?: string
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'slate' | 'rose' | 'purple'
}

interface InnerMenuProps {
  items: InnerMenuItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function InnerMenu({
  items,
  activeId,
  onChange,
  className
}: InnerMenuProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex flex-row overflow-x-auto lg:flex-col gap-1.5 custom-scrollbar lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] lg:overflow-y-auto',
        className
      )}
    >
      {items.map((item, idx) => {
        if (item.isDivider) {
          return (
            <div
              key={`div-${idx}`}
              className="hidden lg:block h-px bg-slate-100 dark:bg-slate-800 my-1 shrink-0"
            />
          )
        }

        if (item.isHeader) {
          return (
            <div
              key={`hdr-${idx}`}
              className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 lg:px-4 lg:mt-3 lg:mb-1 shrink-0 flex items-center gap-1.5 select-none"
            >
              {item.label}
            </div>
          )
        }

        const isActive = activeId === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-3 shrink-0 py-2 px-3 lg:py-2.5 lg:px-4 rounded-xl transition-all w-auto lg:w-full text-left',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            <span
              className={cn('shrink-0', isActive ? 'text-primary-foreground' : 'text-slate-400')}
            >
              {item.icon}
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-bold leading-tight whitespace-nowrap">
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none shrink-0 tracking-tight',
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeVariant === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : item.badgeVariant === 'blue'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : item.badgeVariant === 'amber'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : item.badgeVariant === 'rose'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : item.badgeVariant === 'purple'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              {item.description && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">
                  {item.description}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
