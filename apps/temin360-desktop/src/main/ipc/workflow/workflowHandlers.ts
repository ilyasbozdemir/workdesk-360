import { ipcMain } from 'electron'
import { validateIpcSender } from '../utils/senderGuard'
import { WorkflowService } from './workflowService'
import { workspaceManager } from '../../database/workspace'

export function registerWorkflowHandlers(): void {
  /**
   * Aktif dosya için workflow durumunu getir
   */
  ipcMain.handle('workflow:get-instance', async (event, dosyaId: number) => {
    validateIpcSender(event, 'workflow:get-instance')
    if (!dosyaId || !workspaceManager.isOpen()) return null
    try {
      return WorkflowService.getOrCreateInstance(dosyaId)
    } catch {
      return null
    }
  })

  /**
   * Aktif dosya için mevcut kullanılabilir eylemleri ve kural durumlarını getir
   */
  ipcMain.handle(
    'workflow:get-available-actions',
    async (event, payload: { dosyaId: number; actorRole?: string; actorId?: string }) => {
      validateIpcSender(event, 'workflow:get-available-actions')
      if (!payload?.dosyaId || !workspaceManager.isOpen()) return []
      try {
        return WorkflowService.getAvailableActions(
          payload.dosyaId,
          payload.actorRole || 'satin_alma',
          payload.actorId || 'CURRENT_USER'
        )
      } catch {
        return []
      }
    }
  )

  /**
   * Süreç geçişini çalıştır (State transition)
   */
  ipcMain.handle(
    'workflow:execute-transition',
    async (
      event,
      payload: {
        dosyaId: number
        transitionId: string
        actorRole: string
        actorId?: string
        reason?: string
        faturaNo?: string
        faturaTarihi?: string
      }
    ) => {
      validateIpcSender(event, 'workflow:execute-transition')
      if (!workspaceManager.isOpen()) {
        throw new Error('Açık bir çalışma dosyası bulunamadı.')
      }
      if (!payload?.dosyaId || !payload?.transitionId) {
        throw new Error('Eksik geçiş parametreleri (dosyaId ve transitionId zorunludur).')
      }

      return WorkflowService.executeTransition(
        payload.dosyaId,
        payload.transitionId,
        payload.actorRole || 'satin_alma',
        payload.actorId || 'CURRENT_USER',
        {
          reason: payload.reason,
          faturaNo: payload.faturaNo,
          faturaTarihi: payload.faturaTarihi
        }
      )
    }
  )

  /**
   * Dosya süreç geçmişi
   */
  ipcMain.handle('workflow:get-history', async (event, dosyaId: number) => {
    validateIpcSender(event, 'workflow:get-history')
    if (!dosyaId || !workspaceManager.isOpen()) return []
    try {
      return WorkflowService.getWorkflowHistory(dosyaId)
    } catch {
      return []
    }
  })

  /**
   * Görevler listesi
   */
  ipcMain.handle(
    'workflow:get-tasks',
    async (event, filter?: { dosyaId?: number; role?: string; status?: string }) => {
      validateIpcSender(event, 'workflow:get-tasks')
      if (!workspaceManager.isOpen()) return []
      try {
        return WorkflowService.getTasks(filter)
      } catch {
        return []
      }
    }
  )

  /**
   * Bildirimler listesi
   */
  ipcMain.handle('workflow:get-notifications', async (event, unreadOnly: boolean = false) => {
    validateIpcSender(event, 'workflow:get-notifications')
    if (!workspaceManager.isOpen()) return []
    try {
      return WorkflowService.getNotifications(unreadOnly)
    } catch {
      return []
    }
  })

  /**
   * Bildirimi okundu olarak işaretle
   */
  ipcMain.handle('workflow:mark-notification-read', async (event, notificationId: string) => {
    validateIpcSender(event, 'workflow:mark-notification-read')
    if (!notificationId || !workspaceManager.isOpen()) return
    try {
      WorkflowService.markNotificationRead(notificationId)
    } catch {
      // sessiz yut
    }
  })

  /**
   * Tüm bildirimleri okundu olarak işaretle
   */
  ipcMain.handle('workflow:mark-all-notifications-read', async (event) => {
    validateIpcSender(event, 'workflow:mark-all-notifications-read')
    if (!workspaceManager.isOpen()) return
    try {
      WorkflowService.markAllNotificationsRead()
    } catch {
      // sessiz yut
    }
  })
}

