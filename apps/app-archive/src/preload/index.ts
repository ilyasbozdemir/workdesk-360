import { contextBridge, ipcRenderer } from 'electron'
import { AppConfig, AppStatus, FileRecord } from '../shared/types'

export interface Arsiv360Api {
  getStatus: () => Promise<AppStatus>
  getConfig: () => Promise<AppConfig>
  saveConfig: (config: Partial<AppConfig>) => Promise<boolean>
  getFiles: () => Promise<FileRecord[]>
  scanNow: () => Promise<boolean>
  openFile: (filePath: string) => Promise<boolean>
  showInFolder: (filePath: string) => Promise<boolean>
  addTag: (filePath: string, tag: string, sha256?: string | null) => Promise<boolean>
  removeTag: (filePath: string, tag: string) => Promise<boolean>
  getAllTags: () => Promise<string[]>
  onFilesUpdated: (callback: () => void) => () => void
}

const api: Arsiv360Api = {
  getStatus: () => ipcRenderer.invoke('arsiv:getStatus'),
  getConfig: () => ipcRenderer.invoke('arsiv:getConfig'),
  saveConfig: (config) => ipcRenderer.invoke('arsiv:saveConfig', config),
  getFiles: () => ipcRenderer.invoke('arsiv:getFiles'),
  scanNow: () => ipcRenderer.invoke('arsiv:scanNow'),
  openFile: (filePath) => ipcRenderer.invoke('arsiv:openFile', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('arsiv:showInFolder', filePath),
  addTag: (filePath, tag, sha256) => ipcRenderer.invoke('arsiv:addTag', filePath, tag, sha256),
  removeTag: (filePath, tag) => ipcRenderer.invoke('arsiv:removeTag', filePath, tag),
  getAllTags: () => ipcRenderer.invoke('arsiv:getAllTags'),
  onFilesUpdated: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('arsiv:filesUpdated', handler)
    return () => {
      ipcRenderer.removeListener('arsiv:filesUpdated', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('arsiv360', api)
  } catch (error) {
    console.error('Preload expose error:', error)
  }
} else {
  // @ts-ignore
  window.arsiv360 = api
}

