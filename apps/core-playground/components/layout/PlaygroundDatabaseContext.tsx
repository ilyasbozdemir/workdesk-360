'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ActiveDatabaseInfo } from '@/lib/database/playgroundDb'
import {
  getActiveDatabaseInfoAction,
  switchPlaygroundDatabaseAction,
  openAndActivateTeminPackageAction,
  openPresetTeminPackageAction,
  openDesktopTeminPackageAction,
} from '@/app/actions'

interface PlaygroundDatabaseContextType {
  activeDbInfo: ActiveDatabaseInfo | null
  isLoading: boolean
  isSwitching: boolean
  lastUpdated: Date | null
  refreshDbInfo: () => Promise<ActiveDatabaseInfo | null>
  switchDatabase: (target: 'desktop' | 'fixture') => Promise<boolean>
  openTeminPackage: (file: File) => Promise<boolean>
  openPresetTemin: () => Promise<boolean>
  openDesktopTemin: () => Promise<boolean>
  triggerFilePicker: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

const PlaygroundDatabaseContext = createContext<PlaygroundDatabaseContextType | undefined>(undefined)

export const PlaygroundDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDbInfo, setActiveDbInfo] = useState<ActiveDatabaseInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshDbInfo = useCallback(async (): Promise<ActiveDatabaseInfo | null> => {
    setIsLoading(true)
    try {
      const info = await getActiveDatabaseInfoAction()
      setActiveDbInfo(info)
      setLastUpdated(new Date())
      return info
    } catch (err) {
      console.warn('[PlaygroundDatabaseContext] refreshDbInfo error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshDbInfo()
  }, [refreshDbInfo])

  const switchDatabase = useCallback(async (target: 'desktop' | 'fixture'): Promise<boolean> => {
    setIsSwitching(true)
    try {
      const res = await switchPlaygroundDatabaseAction(target)
      if (res.success && res.data) {
        setActiveDbInfo(res.data)
        setLastUpdated(new Date())
        return true
      }
      return false
    } catch (err) {
      console.error('[PlaygroundDatabaseContext] switchDatabase error:', err)
      return false
    } finally {
      setIsSwitching(false)
    }
  }, [])

  const openTeminPackage = useCallback(async (file: File): Promise<boolean> => {
    setIsSwitching(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await openAndActivateTeminPackageAction(formData)
      if (res.success && res.data) {
        setActiveDbInfo(res.data)
        setLastUpdated(new Date())
        return true
      }
      return false
    } catch (err) {
      console.error('[PlaygroundDatabaseContext] openTeminPackage error:', err)
      return false
    } finally {
      setIsSwitching(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  const openPresetTemin = useCallback(async (): Promise<boolean> => {
    setIsSwitching(true)
    try {
      const res = await openPresetTeminPackageAction()
      if (res.success && res.data) {
        setActiveDbInfo(res.data)
        setLastUpdated(new Date())
        return true
      }
      return false
    } catch (err) {
      console.error('[PlaygroundDatabaseContext] openPresetTemin error:', err)
      return false
    } finally {
      setIsSwitching(false)
    }
  }, [])

  const openDesktopTemin = useCallback(async (): Promise<boolean> => {
    setIsSwitching(true)
    try {
      const res = await openDesktopTeminPackageAction()
      if (res.success && res.data) {
        setActiveDbInfo(res.data)
        setLastUpdated(new Date())
        return true
      }
      return false
    } catch (err) {
      console.error('[PlaygroundDatabaseContext] openDesktopTemin error:', err)
      return false
    } finally {
      setIsSwitching(false)
    }
  }, [])

  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <PlaygroundDatabaseContext.Provider
      value={{
        activeDbInfo,
        isLoading,
        isSwitching,
        lastUpdated,
        refreshDbInfo,
        switchDatabase,
        openTeminPackage,
        openPresetTemin,
        openDesktopTemin,
        triggerFilePicker,
        fileInputRef,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) openTeminPackage(f)
        }}
        accept=".temin,.sqlite"
        className="hidden"
      />
      {children}
    </PlaygroundDatabaseContext.Provider>
  )
}

export function usePlaygroundDatabase(): PlaygroundDatabaseContextType {
  const ctx = useContext(PlaygroundDatabaseContext)
  if (!ctx) {
    throw new Error('usePlaygroundDatabase must be used within a PlaygroundDatabaseProvider')
  }
  return ctx
}
