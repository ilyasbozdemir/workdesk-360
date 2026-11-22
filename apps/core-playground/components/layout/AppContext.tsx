'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type TargetApp = 'temin360-desktop' | 'app-web' | 'core-standalone' | 'monorepo-all'

export interface AppProfile {
  id: TargetApp
  name: string
  shortName: string
  badge: string
  icon: string
  description: string
  dbEngine: string
  runtime: string
  defaultTable: string
}

export const APP_PROFILES: Record<TargetApp, AppProfile> = {
  'temin360-desktop': {
    id: 'temin360-desktop',
    name: 'Temin 360 Desktop (Electron)',
    shortName: 'Desktop (Electron)',
    badge: 'Desktop App',
    icon: '🖥️',
    description: '4734 Sayılı KİK Doğrudan Temin Süreçleri Masaüstü Uygulaması (SQLite + IPC)',
    dbEngine: 'SQLite (better-sqlite3 / .temin)',
    runtime: 'Electron / Node.js Main Process',
    defaultTable: 'DATA_TeminKomisyon'
  },
  'app-web': {
    id: 'app-web',
    name: 'Temin 360 Web (Next.js / Cloud)',
    shortName: 'Web (Cloud)',
    badge: 'Web App',
    icon: '🌐',
    description: 'Bulut & Tarayıcı Ortamı (Next.js App Router + Prisma / Postgres)',
    dbEngine: 'Prisma ORM / PostgreSQL',
    runtime: 'Node.js Serverless / Edge',
    defaultTable: 'users / procurements'
  },
  'core-standalone': {
    id: 'core-standalone',
    name: 'Core Engine (Standalone Sandbox)',
    shortName: 'Core Engine',
    badge: 'Core Package',
    icon: '⚙️',
    description: '@worksuite-360/core saf çekirdek altyapı ve veri adaptörleri havuzu',
    dbEngine: 'In-Memory SQLite & InMemoryRepository',
    runtime: 'Pure TypeScript / Vitest',
    defaultTable: 'playground_items'
  },
  'monorepo-all': {
    id: 'monorepo-all',
    name: 'WorkDesk 360 Monorepo (Tüm Ekosistem)',
    shortName: 'Tüm Monorepo',
    badge: 'Full Suite',
    icon: '🏢',
    description: 'Tüm paket ve uygulamaların çapraz sözleşme ve veri hattı doğrulaması',
    dbEngine: 'Çoklu Adaptör (SQLite + Prisma + Memory)',
    runtime: 'Hybrid (Node + Web)',
    defaultTable: 'TANIM_Kurum'
  }
}

interface AppContextType {
  targetApp: TargetApp
  profile: AppProfile
  setTargetApp: (app: TargetApp) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [targetApp, setTargetAppState] = useState<TargetApp>('temin360-desktop')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('core_playground_target_app') as TargetApp
      if (saved && APP_PROFILES[saved]) {
        setTargetAppState(saved)
      }
    } catch {
      // localStorage may fail in some environments
    }
  }, [])

  const setTargetApp = (app: TargetApp) => {
    setTargetAppState(app)
    try {
      localStorage.setItem('core_playground_target_app', app)
    } catch {
      // ignore
    }
  }

  return (
    <AppContext.Provider
      value={{
        targetApp,
        profile: APP_PROFILES[targetApp],
        setTargetApp
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useTargetApp(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) {
    return {
      targetApp: 'temin360-desktop',
      profile: APP_PROFILES['temin360-desktop'],
      setTargetApp: () => {}
    }
  }
  return ctx
}
