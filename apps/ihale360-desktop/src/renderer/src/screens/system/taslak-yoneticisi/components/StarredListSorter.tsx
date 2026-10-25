import React from 'react'
import { Link } from '@tanstack/react-router'
import { Star, ChevronUp, ChevronDown } from 'lucide-react'
import { parseStatusAndName, getStatusBadgeClass } from '../../utils/statusUtils'

interface StarredListSorterProps {
  starredList: string[]
  routeMap: Record<string, string>
  moveShortcut: (index: number, direction: 'up' | 'down') => void
  toggleStar: (name: string) => void
}

export const StarredListSorter: React.FC<StarredListSorterProps> = ({
  starredList,
  routeMap,
  moveShortcut,
  toggleStar
}) => {
  return (
    <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white border border-slate-700/50 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 opacity-10">
        <Star className="w-40 h-40 fill-white text-white" />
      </div>
      <div className="relative z-10">
        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30 uppercase tracking-wider">
          Hızlı Erişim Belgeleri (Sıralama)
        </span>

        <div className="mt-5 pt-4">
          {starredList.length === 0 ? (
            <p className="text-xs italic text-slate-400">
              Henüz kısayol eklenmemiş. Sağ taraftaki belgelerin yanındaki yıldız butonuna basarak
              kısayol ekleyebilirsiniz.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {starredList.map((docName: string, idx: number) => {
                const route = routeMap[docName]
                const { status, cleanName } = parseStatusAndName(docName)
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 p-2 rounded-xl"
                  >
                    {route ? (
                      <Link
                        to={route}
                        className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 truncate flex-1 min-w-0 pr-2"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="truncate">{cleanName}</span>
                        {status && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 truncate flex-1 min-w-0 pr-2 select-none">
                        <Star className="w-3.5 h-3.5 fill-slate-600 text-slate-600 shrink-0" />
                        <span className="truncate">{cleanName}</span>
                        {status && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => moveShortcut(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveShortcut(idx, 'down')}
                        disabled={idx === starredList.length - 1}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleStar(docName)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-amber-400 cursor-pointer"
                        title="Kısayoldan Kaldır"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
