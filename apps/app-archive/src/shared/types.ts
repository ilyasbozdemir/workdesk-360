export interface FileRecord {
  id: number
  path: string
  relativePath: string
  name: string
  ext: string
  size: number
  mtimeMs: number
  ctimeMs: number
  sha256?: string | null
  category: string
  tags?: string[]
}

export interface ViewRule {
  ext?: string[]
  nameRegex?: string
  pathGlob?: string
  minSizeMB?: number
  maxSizeMB?: number
  modifiedWithinDays?: number
  createdWithinDays?: number
  tags?: string[]
}

export interface VirtualView {
  id: string
  name: string
  icon?: string
  description?: string
  isDuplicateView?: boolean
  rules: ViewRule
}

export interface AppConfig {
  version: string
  appName: string
  rootFolder: string
  autoScan: boolean
  lazyHashing: boolean
  groupBy: ('category' | 'date_year_month')[]
  views: VirtualView[]
}

export interface AppStatus {
  baseDir: string
  documentsDir: string
  configPath: string
  dbPath: string
  isPortable: boolean
  isFallbackAppData: boolean
  fallbackReason?: string | null
  fileCount: number
  tagCount: number
  isScanning: boolean
}

export interface FileFilterState {
  viewId: string
  categoryFilter?: string | null
  dateGroupFilter?: string | null
  tagFilter?: string | null
  searchQuery?: string
  sortBy: 'name' | 'size' | 'mtime' | 'ext'
  sortDirection: 'asc' | 'desc'
  viewMode: 'table' | 'grid'
}

