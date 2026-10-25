import { useState, useCallback } from 'react'

export interface UseSetSelectionReturn<T> {
  selectedIds: Set<T>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<T>>>
  handleToggleSelectRow: (id: T) => void
  handleToggleSelectAll: (allIds: T[]) => void
  clearSelection: () => void
}

/**
 * Tablolarda Set tabanlı çoklu satır seçimi için ortak hook.
 */
export function useSetSelection<T = number>(initial: T[] = []): UseSetSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(() => new Set(initial))

  const handleToggleSelectRow = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleSelectAll = useCallback((allIds: T[]) => {
    setSelectedIds((prev) => {
      if (prev.size === allIds.length && allIds.length > 0) {
        return new Set()
      }
      return new Set(allIds)
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    setSelectedIds,
    handleToggleSelectRow,
    handleToggleSelectAll,
    clearSelection
  }
}
