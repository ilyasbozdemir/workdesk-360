export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Electron native clipboard IPC (tam yetkili, odak bağımsız)
  try {
    if (window.electron?.ipcRenderer) {
      const res = await window.electron.ipcRenderer.invoke('clipboard:writeText', text || '')
      if (res === true) return true
    }
  } catch {
    // proceed to web fallback
  }

  // 2. Web Clipboard API
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text || '')
      return true
    }
  } catch {
    // Electron/browser permission error, proceed to fallback
  }

  // 3. Fallback textarea execCommand
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text || ''
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    textarea.setAttribute('readonly', '')
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textarea)
    return successful
  } catch (err) {
    console.error('Kopyalama hatası:', err)
    return false
  }
}

export async function readFromClipboard(): Promise<string> {
  // 1. Electron native clipboard IPC (tam yetkili, odak bağımsız)
  try {
    if (window.electron?.ipcRenderer) {
      const res = await window.electron.ipcRenderer.invoke('clipboard:readText')
      if (typeof res === 'string') {
        return res
      }
    }
  } catch (err) {
    console.warn('Native clipboard read error:', err)
  }

  // 2. Web API fallback
  if (navigator?.clipboard?.readText) {
    try {
      return await navigator.clipboard.readText()
    } catch (webErr) {
      console.warn('Web clipboard.readText error:', webErr)
    }
  }

  return ''
}
