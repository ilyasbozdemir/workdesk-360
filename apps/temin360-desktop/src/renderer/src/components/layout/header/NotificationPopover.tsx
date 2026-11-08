import React, { useRef, useState, useEffect } from 'react'
import {
  Bell,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCheck,
  FolderOpen
} from 'lucide-react'
import { formatDate } from '@renderer/utils/formatters'
import { useClickOutside } from '@renderer/hooks/useClickOutside'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'

export const NotificationPopover = React.memo(function NotificationPopover(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'notifications' | 'tasks'>('notifications')
  const { setActiveDosyaId } = useWorkspaceStore()
  const popoverRef = useRef<HTMLDivElement>(null)

  useClickOutside(popoverRef, () => setIsOpen(false), isOpen)

  const loadData = async () => {
    try {
      if (window.api?.workflow) {
        const [notifs, tsks] = await Promise.all([
          window.api.workflow.getNotifications(),
          window.api.workflow.getTasks({ status: 'OPEN' })
        ])
        setNotifications(notifs || [])
        setTasks(tsks || [])
      }
    } catch (err) {
      console.warn('[NotificationPopover] load error:', err)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.readAt).length
  const openTaskCount = tasks.length

  const handleMarkAllRead = async () => {
    try {
      if (window.api?.workflow) {
        await window.api.workflow.markAllNotificationsRead()
        await loadData()
      }
    } catch (err) {
      console.warn('[NotificationPopover] mark all read error:', err)
    }
  }

  const handleItemClick = async (item: any) => {
    try {
      if (item.dosyaId) {
        setActiveDosyaId(item.dosyaId)
      }
      if (item.id && !item.readAt && window.api?.workflow) {
        await window.api.workflow.markNotificationRead(item.id)
        await loadData()
      }
      setIsOpen(false)
    } catch (err) {
      console.warn('[NotificationPopover] click error:', err)
    }
  }

  const getIcon = (type: string): React.JSX.Element => {
    switch (type) {
      case 'WORKFLOW_COMPLETED':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      case 'TASK_RETURNED':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
      case 'FINANCE_REVIEW_REQUESTED':
      case 'TASK_ASSIGNED':
      case 'warning':
        return <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={(): void => {
          setIsOpen(!isOpen)
          if (!isOpen) loadData()
        }}
        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 relative cursor-pointer"
        title="Bildirimler ve Süreç Görevleri"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount + openTaskCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 shadow-sm">
            {unreadCount + openTaskCount > 9 ? '9+' : unreadCount + openTaskCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Süreç & Görev Merkezi
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded text-[10px] font-bold">
                  {unreadCount} yeni
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-semibold"
                  title="Tümünü okundu yap"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tümünü Oku
                </button>
              )}
              <button
                type="button"
                onClick={(): void => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                title="Kapat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Tab Seçici */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs bg-slate-50/30 dark:bg-slate-950/20">
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition-all ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Bildirimler ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-2 font-bold text-center border-b-2 transition-all ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Açık Görevler ({tasks.length})
            </button>
          </div>

          {/* Liste İçeriği */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
            {activeTab === 'notifications' ? (
              notifications.length > 0 ? (
                notifications.map((item, i) => (
                  <div
                    key={`notif-${item.id || i}`}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex gap-2.5 cursor-pointer ${
                      !item.readAt ? 'bg-blue-55/15 dark:bg-blue-955/10 font-semibold' : ''
                    }`}
                  >
                    {getIcon(item.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-100 leading-tight truncate">
                          {item.title}
                        </p>
                        {!item.readAt && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-400 font-mono">
                        <span>{formatDate(item.createdAt)}</span>
                        {item.dosyaId && (
                          <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                            <FolderOpen className="w-2.5 h-2.5" />
                            Dosya #{item.dosyaId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Henüz bir süreç bildirimi bulunmuyor.
                </div>
              )
            ) : tasks.length > 0 ? (
              tasks.map((task, i) => (
                <div
                  key={`task-${task.id || i}`}
                  onClick={() => handleItemClick(task)}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex gap-2.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-100 leading-tight mb-0.5">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-[11px] text-slate-550 dark:text-slate-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-mono">
                      <span>Rol: {task.requiredRole || 'Tüm'}</span>
                      {task.dosyaId && (
                        <span className="text-blue-600 dark:text-blue-400">
                          Dosya #{task.dosyaId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Bekleyen açık görev bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})
