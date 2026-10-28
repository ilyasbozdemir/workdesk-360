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
    }
  }
}
