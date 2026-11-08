import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      shell: {
        openExternal: (url: string) => Promise<void>
      }
    }
    api: {
      aiGenerate: (options: {
        prompt: string
        systemInstruction?: string
        enableDatabaseAccess?: boolean
      }) => Promise<{ success: boolean; data?: string; error?: string }>
      aiTest: (
        provider: string,
        apiKey: string
      ) => Promise<{ success: boolean; data?: string; error?: string }>
      getAppVersion?: () => Promise<string>
      setDevVersion?: (mode: boolean, version: string) => Promise<void>
      getAuditHistory?: (filter?: {
        recordId?: number
        tableName?: string
        limit?: number
      }) => Promise<Record<string, unknown>[]>
      verifyAuditChain?: () => Promise<{
        isValid: boolean
        totalRecords: number
        unhashedRecords: number
        brokenRecordId?: number
        error?: string
      }>
      getActiveSessionStatus?: () => Promise<{
        isReadOnly: boolean
        isTampered: boolean
        tamperReason?: string
      }>
      finance?: {
        getIncomingProcurements: () => Promise<any[]>
        getBudgetSummary: () => Promise<any[]>
        executeDirectPayment: (payload: any) => Promise<{ success: boolean; message?: string; error?: string }>
      }
      accounting?: {
        getMifDrafts: () => Promise<any[]>
        getOebDrafts: () => Promise<any[]>
      }
      workflow?: {
        getInstance: (dosyaId: number) => Promise<any>
        getAvailableActions: (payload: { dosyaId: number; actorRole?: string; actorId?: string }) => Promise<any[]>
        executeTransition: (payload: {
          dosyaId: number
          transitionId: string
          actorRole: string
          actorId?: string
          reason?: string
          faturaNo?: string
          faturaTarihi?: string
        }) => Promise<{ success: boolean; instance?: any; transition?: any; error?: string }>
        getHistory: (dosyaId: number) => Promise<any[]>
        getTasks: (filter?: { dosyaId?: number; role?: string; status?: string }) => Promise<any[]>
        getNotifications: (unreadOnly?: boolean) => Promise<any[]>
        markNotificationRead: (id: string) => Promise<void>
        markAllNotificationsRead: () => Promise<void>
      }
    }
  }
}
