export interface UseWindowControlsReturn {
  minimize: () => void
  maximize: () => void
  close: () => void
  forceQuit: () => void
}

export function useWindowControls(): UseWindowControlsReturn {
  const minimize = (): void => {
    window.electron?.ipcRenderer.send('window-minimize')
  }

  const maximize = (): void => {
    window.electron?.ipcRenderer.send('window-maximize')
  }

  const close = (): void => {
    window.electron?.ipcRenderer.send('window-close')
  }

  const forceQuit = (): void => {
    window.electron?.ipcRenderer.invoke('app:force-quit').catch(() => {
      window.electron?.ipcRenderer.send('window-close')
    })
  }

  return {
    minimize,
    maximize,
    close,
    forceQuit
  }
}
