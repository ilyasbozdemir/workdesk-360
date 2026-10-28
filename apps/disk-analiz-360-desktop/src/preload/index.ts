import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  CleanupExecutionItemRequest,
  DiskAnalyzerSettings,
  ScanProgressPayload
} from '../shared/types.js'

export const diskAnalizAPI = {
  getDrives: () => ipcRenderer.invoke('diskAnaliz:getDrives'),
  selectFolderDialog: () => ipcRenderer.invoke('diskAnaliz:selectFolderDialog'),
  startScan: (params: { rootPath: string; detectDuplicates?: boolean }) =>
    ipcRenderer.invoke('diskAnaliz:startScan', params),
  cancelScan: () => ipcRenderer.invoke('diskAnaliz:cancelScan'),
  onScanProgress: (callback: (progress: ScanProgressPayload) => void) => {
    const handler = (_event: unknown, payload: ScanProgressPayload): void => callback(payload)
    ipcRenderer.on('diskAnaliz:scanProgress', handler)
    return () => {
      ipcRenderer.removeListener('diskAnaliz:scanProgress', handler)
    }
  },
  getDashboardSummary: (rootPath?: string) =>
    ipcRenderer.invoke('diskAnaliz:getDashboardSummary', rootPath),
  getTreemapView: (params: { rootPath: string; folderPath?: string }) =>
    ipcRenderer.invoke('diskAnaliz:getTreemapView', params),
  searchFiles: (params?: {
    rootPath?: string
    parentPath?: string
    query?: string
    extension?: string
    minSizeBytes?: number
    sortBy?: 'size_desc' | 'size_asc' | 'name_asc' | 'mtime_asc' | 'mtime_desc'
    limit?: number
  }) => ipcRenderer.invoke('diskAnaliz:searchFiles', params),
  getDuplicates: (rootPath?: string) => ipcRenderer.invoke('diskAnaliz:getDuplicates', rootPath),
  runDuplicateCheck: (rootPath?: string) =>
    ipcRenderer.invoke('diskAnaliz:runDuplicateCheck', rootPath),
  getCleanupCandidates: (rootPath?: string) =>
    ipcRenderer.invoke('diskAnaliz:getCleanupCandidates', rootPath),
  executeTrashCleanup: (requests: CleanupExecutionItemRequest[]) =>
    ipcRenderer.invoke('diskAnaliz:executeTrashCleanup', requests),
  getCleanupHistory: (limit?: number) =>
    ipcRenderer.invoke('diskAnaliz:getCleanupHistory', limit),
  getScanSessions: (limit?: number) =>
    ipcRenderer.invoke('diskAnaliz:getScanSessions', limit),
  getScanErrors: (sessionId?: string) =>
    ipcRenderer.invoke('diskAnaliz:getScanErrors', sessionId),
  getSettings: () => ipcRenderer.invoke('diskAnaliz:getSettings'),
  updateSettings: (updates: Partial<DiskAnalyzerSettings>) =>
    ipcRenderer.invoke('diskAnaliz:updateSettings', updates),
  showInFolder: (targetPath: string) =>
    ipcRenderer.invoke('diskAnaliz:showInFolder', targetPath),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('diskAnalizAPI', diskAnalizAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.diskAnalizAPI = diskAnalizAPI
}

