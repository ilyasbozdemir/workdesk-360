export interface SystemInfo {
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
}

export interface AppDetectionResult {
  installed: boolean
  isDevSource?: boolean
  path?: string
  details?: string
  sourceAvailable?: boolean
  launchable?: boolean
  packageName?: string
}

export interface WorkspaceAPI {
  isElectron: boolean
  launchApp: (appId: string) => Promise<{ success: boolean; message?: string }>
  checkAppInstalled: (appId: string) => Promise<AppDetectionResult>
  getSystemInfo: () => Promise<SystemInfo>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  isMaximized?: () => Promise<boolean>
  onMaximizeChange?: (callback: (isMax: boolean) => void) => () => void
}

declare global {
  interface Window {
    workspaceAPI?: WorkspaceAPI
  }
}
