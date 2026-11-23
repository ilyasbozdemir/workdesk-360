'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Boxes,
  Database,
  GitCommit,
  CheckCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  TableProperties
} from 'lucide-react'
import { useTargetApp } from './AppContext'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Genel Bakış',
    icon: <LayoutDashboard className="w-4 h-4" />
  },
  {
    href: '/direct-procurement',
    label: 'Doğrudan Temin Laboratuvarı',
    icon: <Sparkles className="w-4 h-4 text-amber-500" />,
    badge: '9 Katman'
  },
  {
    href: '/repositories',
    label: 'Repository Laboratuvarı',
    icon: <Boxes className="w-4 h-4" />,
    badge: 'CRUD'
  },
  {
    href: '/database',
    label: 'Database Bağlantısı',
    icon: <Database className="w-4 h-4" />,
    badge: 'SQL'
  },
  {
    href: '/live-data',
    label: 'Canlı Temin Verileri',
    icon: <TableProperties className="w-4 h-4" />,
    badge: 'Canlı DB'
  },
  {
    href: '/transactions',
    label: 'Transaction Motoru',
    icon: <GitCommit className="w-4 h-4" />,
    badge: 'ACID'
  },
  {
    href: '/common',
    label: 'Common Types & Result',
    icon: <CheckCircle className="w-4 h-4" />
  },
  {
    href: '/errors',
    label: 'Hata & Exception Yönetimi',
    icon: <AlertTriangle className="w-4 h-4" />,
    badge: 'RFC 7807'
  }
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { profile, targetApp } = useTargetApp()

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xs flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      {/* Üst: Menü Linkleri */}
      <div className="space-y-6">
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
            Test Modülleri
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive
                          ? 'bg-blue-700/80 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Alt: Aktif Hedef Uygulama Bilgi Kartı */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>{profile.icon}</span>
            <span className="truncate">{profile.shortName}</span>
          </div>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {profile.badge}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {profile.description}
        </p>
        <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Tablo:</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{profile.defaultTable}</span>
        </div>
      </div>
    </aside>
  )
}
