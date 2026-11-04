import { useMemo } from 'react'
import Fuse from 'fuse.js'
import { FileRecord } from '../../../shared/types'

export function useSearch(files: FileRecord[], searchQuery: string): FileRecord[] {
  const fuse = useMemo(() => {
    return new Fuse(files, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'relativePath', weight: 0.3 },
        { name: 'tags', weight: 0.2 }
      ],
      threshold: 0.35,
      ignoreLocation: true,
      useExtendedSearch: true
    })
  }, [files])

  return useMemo(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return files
    return fuse.search(trimmed).map((result) => result.item)
  }, [files, searchQuery, fuse])
}

