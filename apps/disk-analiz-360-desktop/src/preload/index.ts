import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  CleanupExecutionItemRequest,
  DiskAnalyzerSettings,
  ExplorerDirectoryResponse,
  PythonExitEvent,
  PythonMigrationReports,
  PythonOutputEvent,
  ScanProgressPayload
} from '../shared/types.js'

export const diskAnalizAPI = {
  // 1. Disk Analiz 360 — SQLite, Treemap & Güvenli Temizlik
  getDrives: () => ipcRenderer.invoke('diskAnaliz:getDrives'),
  selectFolderDialog: () => ipcRenderer.invoke('diskAnaliz:selectFolderDialog'),
  selectFolder: () => ipcRenderer.invoke('diskAnaliz:selectFolderDialog'),
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

  // 2. Arşiv 360 & Dizin-Rapor — Akıllı Dosya Gezgini, Etiketleme & Native Python Motoru
  listDirectory: (
    dirPath: string,
    options?: { maxDepth?: number }
  ): Promise<ExplorerDirectoryResponse> =>
    ipcRenderer.invoke('diskAnaliz:listDirectory', dirPath, options),
  openFile: (filePath: string) => ipcRenderer.invoke('diskAnaliz:openFile', filePath),
  addFileTag: (data: { filePath: string; tag: string }) =>
    ipcRenderer.invoke('diskAnaliz:addFileTag', data),
  removeFileTag: (data: { filePath: string; tag: string }) =>
    ipcRenderer.invoke('diskAnaliz:removeFileTag', data),
  runPythonTask: (data: { taskId: string; scriptName: string; args: string[] }) =>
    ipcRenderer.invoke('diskAnaliz:runPythonTask', data),
  stopPythonTask: (data: { taskId: string }) =>
    ipcRenderer.invoke('diskAnaliz:stopPythonTask', data),
  onPythonOutput: (callback: (data: PythonOutputEvent) => void) => {
    const subscription = (_event: unknown, value: PythonOutputEvent): void => callback(value)
    ipcRenderer.on('diskAnaliz:pythonOutput', subscription)
    return () => ipcRenderer.removeListener('diskAnaliz:pythonOutput', subscription)
  },
  onPythonExit: (callback: (data: PythonExitEvent) => void) => {
    const subscription = (_event: unknown, value: PythonExitEvent): void => callback(value)
    ipcRenderer.on('diskAnaliz:pythonExit', subscription)
    return () => ipcRenderer.removeListener('diskAnaliz:pythonExit', subscription)
  },
  getMigrationReports: (): Promise<PythonMigrationReports> =>
    ipcRenderer.invoke('diskAnaliz:getMigrationReports'),
  checkFilesExist: (filePaths: string[]): Promise<Record<string, boolean>> =>
    ipcRenderer.invoke('diskAnaliz:checkFilesExist', filePaths),
  moveFiles: (data: { filePaths: string[]; destinationFolder?: string }) =>
    ipcRenderer.invoke('diskAnaliz:moveFiles', data),
  deleteFiles: (data: { filePaths: string[]; useRecycleBin?: boolean }) =>
    ipcRenderer.invoke('diskAnaliz:deleteFiles', data),

  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('diskAnalizAPI', diskAnalizAPI)
    contextBridge.exposeInMainWorld('api', diskAnalizAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.diskAnalizAPI = diskAnalizAPI
  // @ts-ignore
  window.api = diskAnalizAPI
}
