import os from 'os'
import { workspaceManager } from '../database/workspace'

export function getDeviceInfo() {
  const hostname =
    os.hostname() || process.env.COMPUTERNAME || process.env.HOSTNAME || 'Bilinmeyen PC'
  const username =
    os.userInfo?.()?.username || process.env.USERNAME || process.env.USER || 'Kullanıcı'
  let userFullName = ''
  try {
    const db = workspaceManager.getDb()
    const row = db.prepare("SELECT value FROM settings WHERE key = 'adminName'").get() as {
      value?: string
    }
    if (row?.value) userFullName = row.value
  } catch {}
  const deviceLabel = `${username}@${hostname}`
  return { hostname, username, userFullName, deviceLabel }
}
