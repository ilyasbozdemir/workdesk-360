import React from 'react'
import { ActiveFileShortcuts } from '@renderer/components/layout/ActiveFileShortcuts'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { routeComponents } from '@renderer/components/layout/routeComponents'
import { normalizePath, useTabStore } from '@renderer/store/tabStore'
import { APP_ROUTES } from '@renderer/constants/routeConstants'

interface ProcurementWorkspaceProps {
  expiredPaths: Record<string, boolean>
}

export const ProcurementWorkspace: React.FC<ProcurementWorkspaceProps> = ({ expiredPaths }) => {
  const { activeDosyaId } = useWorkspaceStore()
  const { alwaysShowQuickMenu } = useSettingsStore()
  const { tabs, activeTabPath } = useTabStore()

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden relative">
      {(activeDosyaId || alwaysShowQuickMenu) && <ActiveFileShortcuts />}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        {tabs.map((tab) => {
          const isActive = tab.path === activeTabPath
          const isExpired = expiredPaths[tab.path]

          if (isExpired) return null

          const cleanPath = normalizePath(tab.path).split('?')[0]
          const Component = routeComponents[cleanPath]
          if (!Component) return null

          return (
            <div
              key={tab.path}
              style={{ display: isActive ? 'block' : 'none' }}
              className={
                cleanPath === APP_ROUTES.BELGE_ONIZLEME
                  ? 'h-full w-full absolute inset-0 p-0 overflow-hidden'
                  : 'h-full w-full absolute inset-0 p-6 overflow-auto'
              }
            >
              <Component />
            </div>
          )
        })}
      </main>
    </div>
  )
}
