import { ipcMain } from 'electron'
import { validateIpcSender } from '../utils/senderGuard'
import { WorkflowService } from './workflowService'

export function registerWorkflowHandlers(): void {
  /**
   * Aktif dosya için workflow durumunu getir
   */
  ipcMain.handle('workflow:get-instance', async (event, dosyaId: number) => {
    validateIpcSender(event, 'workflow:get-instance')
    if (!dosyaId) return null
    return WorkflowService.getOrCreateInstance(dosyaId)
  })

  /**
   * Aktif dosya için mevcut kullanılabilir eylemleri ve kural durumlarını getir
   */
  ipcMain.handle(
    'workflow:get-available-actions',
    async (event, payload: { dosyaId: number; actorRole?: string; actorId?: string }) => {
      validateIpcSender(event, 'workflow:get-available-actions')
      if (!payload?.dosyaId) return []
      return WorkflowService.getAvailableActions(
        payload.dosyaId,
        payload.actorRole || 'satin_alma',
        payload.actorId || 'CURRENT_USER'
      )
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
    if (!dosyaId) return []
    return WorkflowService.getWorkflowHistory(dosyaId)
  })

  /**
   * Görevler listesi
   */
  ipcMain.handle(
    'workflow:get-tasks',
    async (event, filter?: { dosyaId?: number; role?: string; status?: string }) => {
      validateIpcSender(event, 'workflow:get-tasks')
      return WorkflowService.getTasks(filter)
    }
  )

  /**
   * Bildirimler listesi
   */
  ipcMain.handle('workflow:get-notifications', async (event, unreadOnly: boolean = false) => {
    validateIpcSender(event, 'workflow:get-notifications')
    return WorkflowService.getNotifications(unreadOnly)
  })

  /**
   * Bildirimi okundu olarak işaretle
   */
  ipcMain.handle('workflow:mark-notification-read', async (event, notificationId: string) => {
    validateIpcSender(event, 'workflow:mark-notification-read')
    if (!notificationId) return
    WorkflowService.markNotificationRead(notificationId)
  })

  /**
   * Tüm bildirimleri okundu olarak işaretle
   */
  ipcMain.handle('workflow:mark-all-notifications-read', async (event) => {
    validateIpcSender(event, 'workflow:mark-all-notifications-read')
    WorkflowService.markAllNotificationsRead()
  })
}

