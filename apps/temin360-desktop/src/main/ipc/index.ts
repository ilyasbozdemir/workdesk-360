import { registerDbIpcHandlers } from './db.ipc'
import { registerWorkspaceIpcHandlers } from './workspace.ipc'
import { registerNetworkIpcHandlers } from './network.ipc'
import { registerDocumentIpcHandlers } from './document.ipc'
import { registerTemplateIpcHandlers } from './template.ipc'
import { registerAppIpcHandlers } from './app.ipc'
import { registerDialogIpcHandlers } from './dialog.ipc'
import { registerAiIpcHandlers } from './ai.ipc'
import { registerUpdaterIpcHandlers } from './updater.ipc'
import { registerTestIpcHandlers } from './test.ipc'
import { registerLoggerIpcHandlers } from '../logger'
import { registerArchiveHandlers } from '../archive'
import { registerKutuphaneIpc } from './kutuphane.ipc'

export interface IpcRegistrationOptions {
  closeAllSecondaryWindows: () => void
  setForceQuit: () => void
  safeExitApp?: () => void
  initialFilePath: string | null
}

export function registerAllIpcHandlers(options: IpcRegistrationOptions): void {
  const safeRegister = (name: string, fn: () => void): void => {
    try {
      fn()
    } catch (err: unknown) {
      console.error(`[IPC Register Error] ${name} kaydedilirken hata oluştu:`, err)
    }
  }

  safeRegister('Db', () => registerDbIpcHandlers())
  safeRegister('Workspace', () => registerWorkspaceIpcHandlers(options.closeAllSecondaryWindows))
  safeRegister('Network', () => registerNetworkIpcHandlers())
  safeRegister('Document', () => registerDocumentIpcHandlers())
  safeRegister('Template', () => registerTemplateIpcHandlers())
  safeRegister('App', () =>
    registerAppIpcHandlers(options.setForceQuit, options.initialFilePath, options.safeExitApp)
  )
  safeRegister('Dialog', () => registerDialogIpcHandlers())
  safeRegister('Ai', () => registerAiIpcHandlers())
  safeRegister('Updater', () => registerUpdaterIpcHandlers())
  safeRegister('Test', () => registerTestIpcHandlers())
  safeRegister('Logger', () => registerLoggerIpcHandlers())
  safeRegister('Archive', () => registerArchiveHandlers())
  safeRegister('Kutuphane', () => registerKutuphaneIpc())
}
