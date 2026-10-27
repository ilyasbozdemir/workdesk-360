import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export const flowdeskAPI = {
  getTemplates: () => ipcRenderer.invoke('flowdesk:getTemplates'),
  getTemplateById: (id: string) => ipcRenderer.invoke('flowdesk:getTemplateById', id),
  createTemplate: (data: unknown) => ipcRenderer.invoke('flowdesk:createTemplate', data),
  updateTemplate: (id: string, updates: unknown) =>
    ipcRenderer.invoke('flowdesk:updateTemplate', { id, updates }),

  getProcesses: (filter?: unknown) => ipcRenderer.invoke('flowdesk:getProcesses', filter),
  getProcessById: (id: string) => ipcRenderer.invoke('flowdesk:getProcessById', id),
  startProcess: (params: unknown) => ipcRenderer.invoke('flowdesk:startProcess', params),
  advanceStep: (params: unknown) => ipcRenderer.invoke('flowdesk:advanceStep', params),
  rejectStep: (params: unknown) => ipcRenderer.invoke('flowdesk:rejectStep', params),
  returnStep: (params: unknown) => ipcRenderer.invoke('flowdesk:returnStep', params),
  cancelProcess: (processId: string, actor: string, reason: string) =>
    ipcRenderer.invoke('flowdesk:cancelProcess', { processId, actor, reason }),
  archiveProcess: (processId: string, actor: string) =>
    ipcRenderer.invoke('flowdesk:archiveProcess', { processId, actor }),

  getTasks: (filter?: unknown) => ipcRenderer.invoke('flowdesk:getTasks', filter),
  createTask: (data: unknown) => ipcRenderer.invoke('flowdesk:createTask', data),
  completeTask: (taskId: string, actor: string, notes?: string) =>
    ipcRenderer.invoke('flowdesk:completeTask', { taskId, actor, notes }),

  addDocument: (data: unknown) => ipcRenderer.invoke('flowdesk:addDocument', data),
  getDashboardStats: () => ipcRenderer.invoke('flowdesk:getDashboardStats')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('flowdeskAPI', flowdeskAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.flowdeskAPI = flowdeskAPI
}
