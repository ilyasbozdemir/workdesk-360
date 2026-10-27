import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export const api = {
  getPersonelList: () => ipcRenderer.invoke('personel:list'),
  getPersonelById: (id: string) => ipcRenderer.invoke('personel:get', id),
  createPersonel: (data: any) => ipcRenderer.invoke('personel:create', data),
  updatePersonel: (data: any) => ipcRenderer.invoke('personel:update', data),
  getIzinBakiyesi: (personelId: string, yil?: number) => ipcRenderer.invoke('personel:bakiye', { personelId, yil }),
  getIzinTipiKurallari: () => ipcRenderer.invoke('izin:kurallar'),

  getIzinTalepleri: (personelId?: string) => ipcRenderer.invoke('izin:list', personelId),
  createIzinTalebi: (params: any) => ipcRenderer.invoke('izin:create', params),
  approveIzinTalebi: (izinId: string, onaylayanAdi?: string, aciklama?: string) =>
    ipcRenderer.invoke('izin:approve', { izinId, onaylayanAdi, aciklama }),
  rejectIzinTalebi: (izinId: string, onaylayanAdi?: string, gerekce?: string) =>
    ipcRenderer.invoke('izin:reject', { izinId, onaylayanAdi, gerekce }),
  returnIzinTalebi: (izinId: string, onaylayanAdi?: string, gerekce?: string) =>
    ipcRenderer.invoke('izin:return', { izinId, onaylayanAdi, gerekce }),

  getGorevlendirmeler: (personelId?: string) => ipcRenderer.invoke('gorevlendirme:list', personelId),
  createGorevlendirme: (data: any) => ipcRenderer.invoke('gorevlendirme:create', data),

  getAuditHistory: (personelId?: string) => ipcRenderer.invoke('audit:list', personelId),
  getBirimler: () => ipcRenderer.invoke('birim:list')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
