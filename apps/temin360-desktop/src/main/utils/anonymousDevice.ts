import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { app } from 'electron'

let cachedAnonymousDeviceId: string | null = null

/**
 * Bu bilgisayar için yerel, kalıcı, rastgele üretilmiş anonim cihaz kimliğini (UUID v4) döndürür.
 * Hostname, kullanıcı adı veya herhangi bir kişisel bilgiden türetilmez.
 */
export function getAnonymousDeviceId(): string {
  if (cachedAnonymousDeviceId) {
    return cachedAnonymousDeviceId
  }

  try {
    const userDataPath = app.getPath('userData')
    const idFilePath = path.join(userDataPath, 'anonymous_device_id.json')

    if (fs.existsSync(idFilePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(idFilePath, 'utf-8'))
        if (raw?.deviceId && typeof raw.deviceId === 'string' && raw.deviceId.length >= 10) {
          cachedAnonymousDeviceId = raw.deviceId
          return cachedAnonymousDeviceId!
        }
      } catch {
        // Okuma hatası durumunda aşağıda yeniden üretilir
      }
    }

    // Yeni rastgele UUID v4 üret ve kaydet
    const newId = crypto.randomUUID()
    try {
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      fs.writeFileSync(idFilePath, JSON.stringify({ deviceId: newId }, null, 2), 'utf-8')
    } catch (saveErr) {
      console.warn('[anonymousDevice] Cihaz kimliği kaydedilemedi:', saveErr)
    }

    cachedAnonymousDeviceId = newId
    return newId
  } catch {
    // Electron app henüz hazır değilse veya test ortamındaysa fallback
    cachedAnonymousDeviceId = crypto.randomUUID()
    return cachedAnonymousDeviceId
  }
}
