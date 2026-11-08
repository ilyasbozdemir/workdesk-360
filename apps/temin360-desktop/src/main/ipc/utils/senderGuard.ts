import { IpcMainInvokeEvent } from 'electron'

/**
 * IPC Gönderici Doğrulama Güvenlik Katmanı
 * Renderer sürecinden gelen IPC çağrılarının yalnızca izin verilen
 * yerel uygulama pencerelerinden (file://, localhost dev server) geldiğini doğrular.
 */
export function validateIpcSender(event: IpcMainInvokeEvent, channelName: string): void {
  if (!event || !event.sender) {
    throw new Error(`[IPC Security] Geçersiz gönderici: ${channelName}`)
  }

  // Sender URL kontrolü
  const frameUrl = event.senderFrame?.url || ''
  const senderUrl = event.sender.getURL ? event.sender.getURL() : ''
  const effectiveUrl = frameUrl || senderUrl

  if (effectiveUrl) {
    const isAllowed =
      effectiveUrl.startsWith('file://') ||
      effectiveUrl.startsWith('http://localhost:') ||
      effectiveUrl.startsWith('http://127.0.0.1:') ||
      effectiveUrl.startsWith('devtools://')

    if (!isAllowed) {
      throw new Error(
        `[IPC Security] Yetkisiz gönderici URL: "${effectiveUrl}" (kanal: ${channelName})`
      )
    }
  }
}

