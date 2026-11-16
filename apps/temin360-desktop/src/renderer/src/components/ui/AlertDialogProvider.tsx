import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from './AlertDialog'
import { overlayManager } from '../../services/overlay/overlayManager'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle
} from 'lucide-react'
import { cn } from '../../utils/cn'

export type DialogVariant = 'default' | 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmDialogOptions {
  title?: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

export interface AlertDialogOptions {
  title?: string
  message: React.ReactNode
  confirmText?: string
  variant?: DialogVariant
}

interface DialogState {
  isOpen: boolean
  isAlert: boolean
  title: string
  message: React.ReactNode
  confirmText: string
  cancelText: string
  variant: DialogVariant
  resolve: (value: boolean) => void
}

interface AlertDialogContextType {
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>
  alert: (options: AlertDialogOptions | string) => Promise<void>
}

const AlertDialogContext = createContext<AlertDialogContextType | null>(null)

// Singleton for imperative calls outside React tree
let globalDialogHandler: {
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>
  alert: (options: AlertDialogOptions | string) => Promise<void>
} | null = null

export const dialogs = {
  confirm: (options: ConfirmDialogOptions | string): Promise<boolean> => {
    if (globalDialogHandler) {
      return globalDialogHandler.confirm(options)
    }
    // Fallback if provider not yet mounted
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const msg = typeof options === 'string' ? options : String(options.message)
      return Promise.resolve(window.confirm(msg))
    }
    return Promise.resolve(false)
  },
  alert: (options: AlertDialogOptions | string): Promise<void> => {
    if (globalDialogHandler) {
      return globalDialogHandler.alert(options)
    }
    // Fallback
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      const msg = typeof options === 'string' ? options : String(options.message)
      window.alert(msg)
    }
    return Promise.resolve()
  }
}

export function AlertDialogProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [dialogState, setDialogState] = useState<DialogState | null>(null)
  const overlayUnregisterRef = useRef<(() => void) | null>(null)
  const closedReasonRef = useRef<'confirm' | 'cancel' | null>(null)

  // OverlayManager registration to guarantee input responsiveness and no stuck locks
  useEffect(() => {
    if (dialogState?.isOpen) {
      overlayUnregisterRef.current = overlayManager.register({
        id: 'radix-alert-dialog',
        priority: 9999
      })
    } else {
      overlayUnregisterRef.current?.()
      overlayUnregisterRef.current = null
      overlayManager.cleanRogueLocks()
    }

    return () => {
      overlayUnregisterRef.current?.()
      overlayUnregisterRef.current = null
    }
  }, [dialogState?.isOpen])

  const confirm = useCallback((options: ConfirmDialogOptions | string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      closedReasonRef.current = null
      const opts = typeof options === 'string' ? { message: options } : options
      setDialogState({
        isOpen: true,
        isAlert: false,
        title: opts.title || 'İşlem Onayı',
        message: opts.message,
        confirmText: opts.confirmText || (opts.variant === 'danger' ? 'Evet, Onayla' : 'Tamam'),
        cancelText: opts.cancelText || 'Vazgeç',
        variant: opts.variant || 'default',
        resolve
      })
    })
  }, [])

  const alert = useCallback((options: AlertDialogOptions | string): Promise<void> => {
    return new Promise<void>((resolve) => {
      closedReasonRef.current = null
      const opts = typeof options === 'string' ? { message: options } : options
      setDialogState({
        isOpen: true,
        isAlert: true,
        title: opts.title || (opts.variant === 'danger' ? 'Hata' : opts.variant === 'warning' ? 'Uyarı' : 'Bilgi'),
        message: opts.message,
        confirmText: opts.confirmText || 'Tamam',
        cancelText: '',
        variant: opts.variant || 'info',
        resolve: () => resolve()
      })
    })
  }, [])

  useEffect(() => {
    globalDialogHandler = { confirm, alert }

    // Safe monkey patch for native window.alert to prevent Windows Electron focus death (#20400, #41603)
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert
      const hasNativeDialogBridge = Boolean(
        (window as any).electronDialogs || (window as any).electron?.dialog
      )
      if (!hasNativeDialogBridge) {
        window.alert = (message?: any) => {
          alert(String(message ?? ''))
        }
      }

      return () => {
        globalDialogHandler = null
        if (!hasNativeDialogBridge) {
          window.alert = originalAlert
        }
      }
    }

    return () => {
      globalDialogHandler = null
    }
  }, [confirm, alert])

  const handleClose = useCallback((confirmed: boolean): void => {
    setDialogState((prev) => {
      if (!prev) return null
      prev.resolve(confirmed)
      return null
    })
  }, [])

  const getVariantStyles = (variant: DialogVariant) => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-500" />,
          actionClass: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 dark:hover:bg-red-600',
          titleColor: 'text-red-700 dark:text-red-400',
          containerBg: 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          actionClass: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 dark:hover:bg-amber-600',
          titleColor: 'text-amber-800 dark:text-amber-400',
          containerBg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          actionClass: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 dark:hover:bg-emerald-600',
          titleColor: 'text-emerald-800 dark:text-emerald-400',
          containerBg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
        }
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-500" />,
          actionClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:hover:bg-blue-500',
          titleColor: 'text-blue-800 dark:text-blue-400',
          containerBg: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
        }
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />,
          actionClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:hover:bg-blue-500',
          titleColor: 'text-slate-900 dark:text-slate-100',
          containerBg: 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800'
        }
    }
  }

  const currentStyles = dialogState ? getVariantStyles(dialogState.variant) : null

  return (
    <AlertDialogContext.Provider value={{ confirm, alert }}>
      {children}

      <AlertDialog
        open={Boolean(dialogState?.isOpen)}
        onOpenChange={(open) => {
          if (!open && dialogState) {
            const confirmed = closedReasonRef.current === 'confirm'
            closedReasonRef.current = null
            handleClose(confirmed)
          }
        }}
      >
        {dialogState && currentStyles && (
          <AlertDialogContent className="max-w-md sm:max-w-lg">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                {currentStyles.icon}
              </div>

              <div className="flex-1 min-w-0">
                <AlertDialogHeader className="text-left space-y-1">
                  <AlertDialogTitle className={cn('text-base font-bold tracking-tight', currentStyles.titleColor)}>
                    {dialogState.title}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {dialogState.message}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-5 flex-row justify-end space-x-2">
                  {!dialogState.isAlert && (
                    <AlertDialogCancel
                      onClick={() => {
                        closedReasonRef.current = 'cancel'
                      }}
                      className="text-xs font-semibold px-4 py-2 h-9 rounded-xl"
                    >
                      {dialogState.cancelText}
                    </AlertDialogCancel>
                  )}
                  <AlertDialogAction
                    onClick={() => {
                      closedReasonRef.current = 'confirm'
                    }}
                    className={cn(
                      'text-xs font-semibold px-4 py-2 h-9 rounded-xl',
                      currentStyles.actionClass
                    )}
                  >
                    {dialogState.confirmText}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </AlertDialogContext.Provider>
  )
}

export function useConfirm(): (options: ConfirmDialogOptions | string) => Promise<boolean> {
  const context = useContext(AlertDialogContext)
  if (!context) {
    return (options) => dialogs.confirm(options)
  }
  return context.confirm
}

export function useAlert(): (options: AlertDialogOptions | string) => Promise<void> {
  const context = useContext(AlertDialogContext)
  if (!context) {
    return (options) => dialogs.alert(options)
  }
  return context.alert
}
