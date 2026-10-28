/**
 * Disk Analiz 360 — Ortak Tip Tanımları (Main, Preload ve Renderer Katmanları)
 */

export interface DriveInfo {
  /** Sürücü harfi veya kök dizin (örn: "C:\\", "D:\\") */
  mountPath: string
  /** Sürücü kodu (örn: "C:", "D:") */
  driveCode: string
  /** Birim etiketi (örn: "Yerel Disk", "Veri") */
  label: string
  /** Dosya sistemi (örn: "NTFS", "exFAT", "FAT32", "Bilinmiyor") */
  fileSystem: string
  /** Toplam kapasite (Bayt) */
  totalBytes: number
  /** Kullanılan alan (Bayt) */
  usedBytes: number
  /** Boş alan (Bayt) */
  freeBytes: number
  /** Doluluk yüzdesi (0 - 100) */
  usagePercent: number
  /** Sürücü okunabilir/erişilebilir durumda mı? */
  accessible: boolean
  /** Erişilemiyorsa hata açıklaması */
  error?: string
  /** Sistem sürücüsü mü? (örn: C:\) */
  isSystemDrive: boolean
}

export type ScanStatus = 'idle' | 'running' | 'completed' | 'cancelled' | 'failed'

export interface ScanProgressPayload {
  sessionId: string
  rootPath: string
  status: ScanStatus
  phase: 'scanning_tree' | 'aggregating_folders' | 'detecting_duplicates' | 'completed' | 'cancelled' | 'failed'
  scannedFiles: number
  scannedFolders: number
  totalBytes: number
  skippedCount: number
  errorCount: number
  incrementalReusedCount: number
  elapsedMs: number
  currentPath?: string
}

export interface ScanSessionRecord {
  id: string
  rootPath: string
  driveCode: string
  status: ScanStatus
  startedAt: string
  completedAt?: string
  durationMs: number
  totalFiles: number
  totalFolders: number
  totalBytes: number
  skippedCount: number
  errorCount: number
  incrementalReusedCount: number
}

export type FileHashStatus = 'none' | 'fast_hashed' | 'verified_sha256' | 'skipped' | 'error'

export type CleanupCategory =
  | 'none'
  | 'temp_file'
  | 'old_log'
  | 'large_file'
  | 'old_download'
  | 'duplicate'
  | 'user_selected'

export interface IndexedFileRecord {
  id: string
  sessionId: string
  rootPath: string
  fullPath: string
  parentPath: string
  name: string
  extension: string
  sizeBytes: number
  mtimeMs: number
  ctimeMs: number
  fileIndex?: string
  cleanupCategory: CleanupCategory
  fastHash?: string
  sha256?: string
  hashStatus: FileHashStatus
  updatedAt: string
}

export interface IndexedFolderRecord {
  fullPath: string
  sessionId: string
  rootPath: string
  parentPath: string
  name: string
  depth: number
  directFileCount: number
  directFolderCount: number
  recursiveFileCount: number
  recursiveFolderCount: number
  directBytes: number
  recursiveBytes: number
  updatedAt: string
}

export interface ScanErrorRecord {
  id: string
  sessionId: string
  targetPath: string
  errorCode: string
  errorMessage: string
  itemType: 'file' | 'folder' | 'reparse_point'
  occurredAt: string
}

export interface ExtensionStat {
  extension: string
  categoryLabel: string
  fileCount: number
  totalBytes: number
  percentage: number
}

export interface SizeBucketStat {
  bucketId: string
  label: string
  minBytes: number
  maxBytes: number | null
  fileCount: number
  totalBytes: number
}

export interface DuplicateFileMember {
  id: string
  fullPath: string
  parentPath: string
  name: string
  extension: string
  sizeBytes: number
  mtimeMs: number
  ctimeMs: number
  sha256: string
  hashStatus: FileHashStatus
}

export interface DuplicateGroup {
  groupKey: string
  sha256: string
  sizeBytes: number
  fileCount: number
  /** Tüm kopyaların toplam boyutu (N * S) */
  totalGroupBytes: number
  /** En az 1 kopya korunduğunda kazanılabilecek maksimum alan ((N - 1) * S) */
  maxRecoverableBytes: number
  files: DuplicateFileMember[]
}

export interface DuplicateSummary {
  totalGroups: number
  totalDuplicateFiles: number
  totalRecoverableBytes: number
  groups: DuplicateGroup[]
}

export interface CleanupCandidateGroup {
  category: CleanupCategory
  title: string
  description: string
  riskLevel: 'low' | 'medium' | 'review_required'
  guidanceNote: string
  fileCount: number
  estimatedBytes: number
  items: IndexedFileRecord[]
}

export interface CleanupExecutionItemRequest {
  fullPath: string
  expectedSizeBytes: number
  expectedMtimeMs: number
  duplicateGroupSha256?: string
}

export interface CleanupExecutionResultItem {
  fullPath: string
  sizeBytes: number
  status: 'success' | 'failed' | 'blocked'
  reason?: string
}

export interface CleanupBatchSummary {
  batchId: string
  executedAt: string
  requestedCount: number
  successCount: number
  failedCount: number
  blockedCount: number
  /** Silinen/taşınan dosyaların toplam boyutu */
  estimatedSavedBytes: number
  /** İşlem öncesi ve sonrası diskteki gerçek boş alan farkı (Çöp Kutusu aynı diskteyse 0 olabilir) */
  measuredFreeSpaceDeltaBytes: number
  freeSpaceBeforeBytes?: number
  freeSpaceAfterBytes?: number
  items: CleanupExecutionResultItem[]
}

export interface CleanupHistoryRecord {
  id: string
  batchId: string
  filePath: string
  sizeBytes: number
  method: 'trash'
  status: 'success' | 'failed' | 'blocked'
  errorMessage?: string
  estimatedSavedBytes: number
  measuredFreeSpaceDeltaBytes: number
  createdAt: string
}

export type TreemapColorMode = 'folder' | 'extension' | 'size_range' | 'age'

export interface TreemapNodeInput {
  id: string
  name: string
  fullPath: string
  parentPath: string
  kind: 'folder' | 'file' | 'aggregated_small'
  sizeBytes: number
  extension?: string
  mtimeMs?: number
  fileCount: number
  folderCount: number
  hasAccessError?: boolean
}

export interface TreemapRectNode extends TreemapNodeInput {
  x: number
  y: number
  width: number
  height: number
  areaRatio: number
  byteRatio: number
  colorHex: string
  showLabel: boolean
}

export interface TreemapViewResponse {
  currentFolder: IndexedFolderRecord | null
  breadcrumbs: Array<{ name: string; fullPath: string }>
  childrenFolders: IndexedFolderRecord[]
  childrenFiles: IndexedFileRecord[]
  treemapNodes: TreemapNodeInput[]
  isIndexStale: boolean
  staleReason?: string
}

export interface AnalysisDashboardSummary {
  session: ScanSessionRecord | null
  topFolders: IndexedFolderRecord[]
  largestFiles: IndexedFileRecord[]
  oldestFiles: IndexedFileRecord[]
  extensionStats: ExtensionStat[]
  sizeBuckets: SizeBucketStat[]
  recentErrors: ScanErrorRecord[]
}

export interface DiskAnalyzerSettings {
  excludedPaths: string[]
  largeFileThresholdMb: number
  oldFileThresholdDays: number
  followSymlinks: boolean
}

export interface ExplorerSubfolderInfo {
  name: string
  path: string
  fileCount: number
}

export interface ExplorerDirectoryResponse {
  success: boolean
  targetDir?: string
  items?: Array<{
    name: string
    cleanName: string
    path: string
    isDirectory: boolean
    size: number
    ext: string
    mtime: string
    tags: string[]
  }>
  subfolders?: ExplorerSubfolderInfo[]
  totalCount?: number
  message?: string
}

export interface VirtualFolderRecord {
  id: string
  name: string
  color: string
  description?: string
  filePaths: string[]
  isSmart?: boolean
  smartRule?: 'large_files' | 'recent_files' | 'zero_byte' | 'has_duplicates' | 'cad_drawings' | 'images' | 'documents'
  createdAt: string
  updatedAt: string
}

export type WorkspaceViewMode = 'grid' | 'list' | 'details' | 'gallery'

export interface FilePreviewResponse {
  success: boolean
  filePath: string
  fileName: string
  fileSize: number
  mtime: string
  category: 'image' | 'text' | 'pdf' | 'binary'
  previewUrl?: string
  textContent?: string
  lineCount?: number
  error?: string
}

export interface PythonOutputEvent {
  taskId: string
  type: 'stdout' | 'stderr'
  text: string
}

export interface PythonExitEvent {
  taskId: string
  code: number | null
}

export interface PythonMigrationReports {
  duplicate?: {
    summary?: {
      report_title?: string
      scan_date?: string
      elapsed_seconds?: number
      scanned_drives?: string[]
      scan_status?: 'COMPLETE' | 'PARTIAL_WITH_ERRORS'
      is_complete_scan?: boolean
      total_errors_count?: number
      skipped_unreadable_dirs_count?: number
      skipped_unreadable_files_count?: number
      unverified_hash_files_count?: number
      changed_during_scan_count?: number
      zero_byte_files_count?: number
      zero_byte_groups_count?: number
      zero_byte_included?: boolean
      scan_errors?: Array<{
        path: string
        stage: string
        error_type: string
        message: string
      }>
      total_files_scanned?: number
      total_size_scanned?: number
      total_size_scanned_formatted?: string
      duplicate_groups_count?: number
      duplicate_files_count?: number
      total_wasted_bytes?: number
      total_wasted_formatted?: string
      cross_drive_groups_count?: number
      cross_drive_wasted_bytes?: number
      cross_drive_wasted_formatted?: string
      large_groups_count?: number
    }
    duplicates?: Array<{
      group_id: number
      hash: string
      size_bytes: number
      size_formatted: string
      count: number
      wasted_bytes: number
      wasted_formatted: string
      is_zero_byte?: boolean
      drives: string[]
      is_cross_drive: boolean
      files: Array<{
        path: string
        drive: string
        folder: string
        filename: string
        modified: string
      }>
    }>
  }
  migration?: {
    source_drive?: string
    target_dir?: string
    max_path_limit?: number
    total_files?: number
    total_bytes?: number
    total_gb?: number
    shortened_count?: number
    shortened_samples?: Array<{
      source: string
      relative_source: string
      destination: string
      source_len: number
      dest_len: number
      was_shortened: boolean
      changes: string[]
      size_bytes: number
    }>
    summary?: {
      total_files_scanned?: number
      shortened_paths_count?: number
    }
  }
}


