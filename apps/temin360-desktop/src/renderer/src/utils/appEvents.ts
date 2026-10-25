import { useEffect, useRef } from 'react'
import { QueryClient } from '@tanstack/react-query'

export type AppEventType =
  | 'items:changed'
  | 'bids:changed'
  | 'dossier:updated'
  | 'dossier:created'
  | 'dossier:deleted'
  | 'status:changed'
  | 'documents:changed'
  | 'settings:changed'
  | 'workspace:changed'
  | 'workspace:refreshed'
  | 'print_queue:updated'
  | 'theme:changed'
  | 'module:installed'
  | 'module:uninstalled'
  | 'module:trashed'
  | 'module:restored'

export interface AppEventPayload {
  dosyaId?: number | null
  count?: number
  total?: number
  status?: string
  asamaId?: number
  documentId?: string
  [key: string]: any
}

export interface AppEventMessage {
  type: AppEventType
  payload?: AppEventPayload
  timestamp: number
  senderId?: string
}

const SENDER_ID = `win_${Math.random().toString(36).substring(2, 9)}`
const BROADCAST_CHANNEL_NAME = 'temin360_realtime_events'
const CUSTOM_EVENT_NAME = 'temin360_app_event'

let globalQueryClient: QueryClient | null = null
let broadcastChannel: BroadcastChannel | null = null

export function setGlobalQueryClient(client: QueryClient): void {
  globalQueryClient = client
}

export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null
  }
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type && event.data.senderId !== SENDER_ID) {
          handleIncomingEvent(event.data, false)
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel initialization error:', e)
    }
  }
  return broadcastChannel
}

// Subscribe to Electron IPC data-changed events across all windows
if (typeof window !== 'undefined' && window.electron?.ipcRenderer) {
  try {
    window.electron.ipcRenderer.on('app:data-changed', (_event: any, msg: AppEventMessage) => {
      if (msg && msg.type && msg.senderId !== SENDER_ID) {
        handleIncomingEvent(msg, false)
      }
    })
  } catch (e) {
    console.warn('IPC listener registration error:', e)
  }
}

// Internal dispatcher when an event is received (locally or remotely)
function handleIncomingEvent(msg: AppEventMessage, isLocalOrigin: boolean): void {
  // 1. Dispatch custom DOM event in current window for reactive hooks
  window.dispatchEvent(
    new CustomEvent(CUSTOM_EVENT_NAME, {
      detail: msg
    })
  )

  // 2. Automatically invalidate TanStack Query caches
  if (globalQueryClient) {
    const dosyaId = msg.payload?.dosyaId

    if (msg.type === 'items:changed') {
      globalQueryClient.invalidateQueries({ queryKey: ['takip_kalemler'] })
      if (dosyaId) {
        globalQueryClient.invalidateQueries({ queryKey: ['takip_kalemler', dosyaId] })
      }
      globalQueryClient.invalidateQueries({ queryKey: ['temin_dosyalari'] })
      globalQueryClient.invalidateQueries({ queryKey: ['dosyalar'] })
      globalQueryClient.invalidateQueries({ queryKey: ['cikti_merkezi_data'] })
    } else if (msg.type === 'bids:changed') {
      globalQueryClient.invalidateQueries({ queryKey: ['takip_firmalar'] })
      if (dosyaId) {
        globalQueryClient.invalidateQueries({ queryKey: ['takip_firmalar', dosyaId] })
      }
      globalQueryClient.invalidateQueries({ queryKey: ['temin_dosyalari'] })
      globalQueryClient.invalidateQueries({ queryKey: ['dosyalar'] })
      globalQueryClient.invalidateQueries({ queryKey: ['cikti_merkezi_data'] })
    } else if (msg.type === 'documents:changed') {
      globalQueryClient.invalidateQueries({ queryKey: ['takip_belgeler'] })
      if (dosyaId) {
        globalQueryClient.invalidateQueries({ queryKey: ['takip_belgeler', dosyaId] })
      }
      globalQueryClient.invalidateQueries({ queryKey: ['cikti_merkezi_data'] })
    } else if (
      msg.type === 'dossier:updated' ||
      msg.type === 'dossier:created' ||
      msg.type === 'dossier:deleted' ||
      msg.type === 'status:changed'
    ) {
      globalQueryClient.invalidateQueries({ queryKey: ['temin_dosyalari'] })
      globalQueryClient.invalidateQueries({ queryKey: ['dosyalar'] })
      globalQueryClient.invalidateQueries({ queryKey: ['takip_asamalar'] })
      if (dosyaId) {
        globalQueryClient.invalidateQueries({ queryKey: ['takip_kalemler', dosyaId] })
        globalQueryClient.invalidateQueries({ queryKey: ['takip_firmalar', dosyaId] })
        globalQueryClient.invalidateQueries({ queryKey: ['takip_belgeler', dosyaId] })
      }
      globalQueryClient.invalidateQueries({ queryKey: ['cikti_merkezi_data'] })
    } else if (msg.type === 'settings:changed') {
      globalQueryClient.invalidateQueries({ queryKey: ['settings'] })
      globalQueryClient.invalidateQueries({ queryKey: ['kurum'] })
      globalQueryClient.invalidateQueries({ queryKey: ['birimler'] })
      globalQueryClient.invalidateQueries({ queryKey: ['personeller'] })
    } else {
      globalQueryClient.invalidateQueries()
    }
  }

  // 3. Forward to Electron IPC if present and local origin
  if (isLocalOrigin && window.electron?.ipcRenderer) {
    try {
      window.electron.ipcRenderer.send('app:data-changed', msg)
    } catch {
      // noop
    }
  }
}

/**
 * Emit an application event to notify all components, stores, hooks, and external windows in real time.
 */
export function emitAppEvent(type: AppEventType, payload?: AppEventPayload): void {
  const msg: AppEventMessage = {
    type,
    payload,
    timestamp: Date.now(),
    senderId: SENDER_ID
  }

  // 1. Send through BroadcastChannel
  const channel = getBroadcastChannel()
  if (channel) {
    try {
      channel.postMessage(msg)
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e)
    }
  }

  // 2. Dispatch locally
  handleIncomingEvent(msg, true)
}

/**
 * React hook to listen for real-time app events.
 */
export function useAppEventListener(
  eventTypes: AppEventType | AppEventType[] | '*',
  callback: (event: AppEventMessage) => void
): void {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Ensure channel is initialized
    getBroadcastChannel()

    const handler = (e: Event): void => {
      const customEvent = e as CustomEvent<AppEventMessage>
      const msg = customEvent.detail
      if (!msg) return

      if (eventTypes === '*') {
        callbackRef.current(msg)
      } else if (Array.isArray(eventTypes)) {
        if (eventTypes.includes(msg.type)) {
          callbackRef.current(msg)
        }
      } else if (msg.type === eventTypes) {
        callbackRef.current(msg)
      }
    }

    window.addEventListener(CUSTOM_EVENT_NAME, handler)
    return () => {
      window.removeEventListener(CUSTOM_EVENT_NAME, handler)
    }
  }, [eventTypes])
}
