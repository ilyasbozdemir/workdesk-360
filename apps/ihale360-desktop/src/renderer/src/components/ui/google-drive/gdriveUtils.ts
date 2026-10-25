import type { BackupManifest } from '../../../../../shared/types/backupManifest'

export interface GDriveFile {
  id: string
  name: string
  size?: string
  modifiedTime?: string
  createdTime?: string
  description?: string
  manifest?: BackupManifest | null
  manifestFileId?: string | null
  manifestVerified?: boolean
  isVerified?: boolean
  appProperties?: {
    backupId?: string
    projectId?: string
    targetFileId?: string
    sha256?: string
    dataRevision?: string
    parentBackupId?: string
    deviceName?: string
    userName?: string
    userFullName?: string
    deviceLabel?: string
    appVersion?: string
    projectRoot?: string
    lastUserMutationAt?: string
    integrityHash?: string
  }
}

export type StatusType = 'success' | 'error' | 'info'
export interface StatusMsg {
  text: string
  type: StatusType
}

export type AuthTab = 'api' | 'manual'

export const SUPPORTED_BACKUP_EXTS = ['temin']

/** Tırnakları ve tüm boşluk/satır sonlarını temizler (Client ID, Secret, Refresh Token). */
export const cleanSecret = (value?: string | null): string =>
  (value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/[\r\n\s]+/g, '')

/** cleanSecret + baştaki "Bearer " önekini kaldırır (Access Token). */
export const cleanAccessToken = (value?: string | null): string =>
  (value ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/[\r\n\s]+/g, '')

export const isSupportedBackup = (fileName: string): boolean => {
  const lower = fileName.toLowerCase()
  return SUPPORTED_BACKUP_EXTS.some((ext) => lower.endsWith('.' + ext))
}

export const formatFileSize = (bytes?: string | number): string => {
  if (!bytes) return '—'
  const num = Number(bytes)
  if (isNaN(num)) return '—'
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${(num / (1024 * 1024)).toFixed(2)} MB`
}

export const errorText = (err: unknown, fallback: string): string =>
  (err instanceof Error && err.message) || fallback

/**
 * Dosya adından proje kök adını ayıklar.
 * Örnekler:
 *   - "Proje.temin" -> "Proje"
 *   - "Proje_2026-10-19_15-30.temin" -> "Proje"
 *   - "Proje_2026-10-19_15-30-45.temin" -> "Proje"
 *   - "Proje_surum#2.temin" -> "Proje"
 */
export function extractProjectRootName(filename: string): string {
  if (!filename) return ''
  return filename
    .trim()
    .replace(/\.temin$/i, '')
    .replace(/_\d{4}[-_.]\d{2}[-_.]\d{2}(?:[-_.T]\d{2}[-_.]\d{2}(?:[-_.]\d{2})?)?$/i, '')
    .replace(/_surum\s*#?\d+$/i, '')
    .trim()
}

/**
 * Buluttaki dosyanın gerçekten bu projeye ait bir yedek olup olmadığını doğrular.
 * Proje kök adı "ihale" ise:
 *   - "ihale_2026-10-19_15-30.temin" -> true
 *   - "ihale_ek_bina_2026-10-19_15-30.temin" -> false (başka proje)
 *   - "ihale.temin" -> true
 */
export function isBackupOfProject(
  cloudFileName: string,
  projectRoot: string,
  cloudProjectRootProp?: string
): boolean {
  if (!cloudFileName || !projectRoot) return false
  const rootLower = projectRoot.trim().toLowerCase()
  if (!rootLower) return false

  if (cloudProjectRootProp && cloudProjectRootProp.trim().toLowerCase() === rootLower) {
    return true
  }

  const cleanCloud = cloudFileName
    .trim()
    .toLowerCase()
    .replace(/\.temin$/i, '')
  if (cleanCloud === rootLower) return true

  if (!cleanCloud.startsWith(rootLower + '_')) return false

  const remainder = cleanCloud.slice(rootLower.length + 1)
  const isDatePattern =
    /^\d{4}[-_.]\d{2}[-_.]\d{2}(?:[-_.T]\d{2}[-_.]\d{2}(?:[-_.]\d{2})?)?$/i.test(remainder)
  const isSurumPattern = /^surum\s*#?\d+$/i.test(remainder)
  return isDatePattern || isSurumPattern
}

/**
 * Dosya adındaki tarih damgasını (YYYY-MM-DD_HH-mm) milisaniye epoch olarak ayrıştırır.
 */
export function parseBackupFilenameTimestamp(filename: string): number | null {
  if (!filename) return null
  const match = filename.match(
    /_(\d{4})[-_.](\d{2})[-_.](\d{2})[-_.T](\d{2})[-_.](\d{2})(?:[-_.](\d{2}))?(?:\.temin)?$/i
  )
  if (!match) return null
  const [, y, m, d, hh, mm, ss] = match
  const date = new Date(
    parseInt(y, 10),
    parseInt(m, 10) - 1,
    parseInt(d, 10),
    parseInt(hh, 10),
    parseInt(mm, 10),
    ss ? parseInt(ss, 10) : 0
  )
  const time = date.getTime()
  return isNaN(time) ? null : time
}

/**
 * Bulut yedek dosyasının en güncel temsil ettiği zaman damgasını hesaplar.
 */
export function getCloudFileTimestamp(f: GDriveFile): number {
  const modified = f.modifiedTime ? new Date(f.modifiedTime).getTime() : 0
  const created = f.createdTime ? new Date(f.createdTime).getTime() : 0
  const parsed = parseBackupFilenameTimestamp(f.name) || 0
  return Math.max(modified, created, parsed)
}

/**
 * Yedekleri en yeni zaman damgasına göre azalan sırada sıralar.
 */
export function sortCloudBackups(files: GDriveFile[]): GDriveFile[] {
  return [...files].sort((a, b) => getCloudFileTimestamp(b) - getCloudFileTimestamp(a))
}

export interface VersionEvaluationInput {
  currentFileName: string
  activeMeta?: {
    project_id?: string
    data_revision?: number
    last_backup_id?: string | null
    last_user_mutation_at?: string
    updated_at?: string
    institution?: string
    integrity_hash?: string
  } | null
  lastBackupFileId?: string | null
  lastBackupFileName?: string | null
  knownBackupFileIds?: string[]
  isDirty?: boolean
  currentDeviceName?: string
  currentDeviceLabel?: string
  cloudFiles: GDriveFile[]
}

export interface VersionEvaluationResult {
  hasNewerVersion: boolean
  newerFile: GDriveFile | null
  isConflict: boolean
  reason: string
}

/**
 * Buluttaki yedekler ile yerel çalışma alanını karşılaştırarak daha güncel bir sürümün olup olmadığını
 * kullanıcı değişiklikleri ve sürüm sinyallerini birlikte değerlendirerek hesaplar.
 */
export function evaluateNewerVersion(input: VersionEvaluationInput): VersionEvaluationResult {
  const {
    currentFileName,
    activeMeta,
    lastBackupFileId,
    lastBackupFileName,
    knownBackupFileIds = [],
    isDirty = false,
    currentDeviceName,
    currentDeviceLabel,
    cloudFiles = []
  } = input

  const validBackups = cloudFiles.filter((f) => f.name.toLowerCase().endsWith('.temin'))
  if (validBackups.length === 0) {
    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'Bulutta geçerli .temin yedeği bulunamadı'
    }
  }

  const projectRoot = extractProjectRootName(currentFileName)
  if (!projectRoot) {
    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'Geçerli bir proje kök adı tespit edilemedi'
    }
  }

  const matching = validBackups.filter((f) => {
    const isRootMatch = isBackupOfProject(
      f.name,
      projectRoot,
      f.appProperties?.projectRoot || (f.appProperties?.deviceName ? undefined : undefined)
    )
    if (!isRootMatch) return false

    // Farklı projelerin isim benzerliğinden ötürü yanlışlıkla aynı proje sayılmaması (projectId doğrulaması)
    const cloudProjectId = f.manifest?.projectId || f.appProperties?.projectId
    if (cloudProjectId && activeMeta?.project_id && cloudProjectId !== activeMeta.project_id) {
      return false
    }
    return true
  })

  if (matching.length === 0) {
    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'Bu projeye ait bulut yedeği bulunamadı'
    }
  }

  const sortedMatching = sortCloudBackups(matching)
  const latestCloudFile = sortedMatching[0]
  if (!latestCloudFile) {
    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'Eşleşen yedek bulunamadı'
    }
  }

  // 1. Manifest Tabanlı Kesin Sürüm ve Çakışma Değerlendirmesi
  const latestManifest = latestCloudFile.manifest
  if (latestManifest) {
    const cloudRev = latestManifest.dataRevision
    const localRev = activeMeta?.data_revision || 1
    const isSameBackupId =
      (activeMeta?.last_backup_id && latestManifest.backupId === activeMeta.last_backup_id) ||
      (lastBackupFileId && latestCloudFile.id === lastBackupFileId)

    if (isSameBackupId && !isDirty) {
      return {
        hasNewerVersion: false,
        newerFile: null,
        isConflict: false,
        reason: 'En güncel bulut yedeği [Doğrulanmış Manifest] zaten yerel sistemde açık'
      }
    }

    if (cloudRev > localRev) {
      if (isDirty) {
        return {
          hasNewerVersion: true,
          newerFile: latestCloudFile,
          isConflict: true,
          reason: `Bulutta daha yeni bir veri revizyonu var (Bulut Rev: ${cloudRev}, Yerel Rev: ${localRev}) ancak yerelde de kaydedilmemiş değişiklikler mevcut (Çakışma)`
        }
      }
      return {
        hasNewerVersion: true,
        newerFile: latestCloudFile,
        isConflict: false,
        reason: `Bulutta doğrulanmış daha yeni bir veri revizyonu mevcut (Bulut Rev: ${cloudRev}, Yerel Rev: ${localRev})`
      }
    }

    if (cloudRev === localRev) {
      // Aynı revizyon sayısına sahip ancak farklı yedek ID'si -> iki farklı cihazda bağımsız değişiklik yapılmış
      if (activeMeta?.last_backup_id && latestManifest.backupId !== activeMeta.last_backup_id) {
        return {
          hasNewerVersion: true,
          newerFile: latestCloudFile,
          isConflict: true,
          reason: `Aynı revizyon numarasına (${cloudRev}) sahip bağımsız bir cihaz yedeği tespit edildi (Eşzamanlı değişiklik çakışması)`
        }
      }
    }

    if (cloudRev < localRev) {
      return {
        hasNewerVersion: false,
        newerFile: null,
        isConflict: false,
        reason: `Yerel dosya veri revizyonu (${localRev}) buluttakinden (${cloudRev}) daha güncel`
      }
    }
  }

  const latestNameLower = latestCloudFile.name.trim().toLowerCase()
  const currentNameLower = currentFileName.trim().toLowerCase()
  const lastBackupNameLower = (lastBackupFileName || '').trim().toLowerCase()

  const isExactCurrentFile = latestNameLower === currentNameLower
  const isLastBackupLoaded =
    (lastBackupFileId && latestCloudFile.id === lastBackupFileId) ||
    (lastBackupNameLower && latestNameLower === lastBackupNameLower) ||
    knownBackupFileIds.includes(latestCloudFile.id)

  // Eğer buluttaki en yeni dosya zaten şu an açık olan dosya ise ve yerelde kaydedilmemiş değişiklik yoksa
  if ((isExactCurrentFile || isLastBackupLoaded) && !isDirty) {
    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'En güncel bulut yedeği zaten yerel sistemde açık'
    }
  }

  const cloudTime = getCloudFileTimestamp(latestCloudFile)

  // Yerel referans zamanı: Yalnızca gerçek kullanıcı değişikliklerini veya son yedek zamanını temel al!
  // Şema göçü veya dosya açılışının güncellediği updated_at tek başına baz alınmaz.
  const localMutationTime = activeMeta?.last_user_mutation_at
    ? new Date(activeMeta.last_user_mutation_at).getTime()
    : 0
  const localBackupTime = lastBackupFileName
    ? parseBackupFilenameTimestamp(lastBackupFileName) || 0
    : 0
  const currentFileTime = parseBackupFilenameTimestamp(currentFileName) || 0
  const localReferenceTime = Math.max(localMutationTime, localBackupTime, currentFileTime)

  const cloudDevName = latestCloudFile.appProperties?.deviceName?.trim().toLowerCase()
  const cloudDevLabel = latestCloudFile.appProperties?.deviceLabel?.trim().toLowerCase()
  const localDevName = currentDeviceName?.trim().toLowerCase()
  const localDevLabel = currentDeviceLabel?.trim().toLowerCase()

  const isSameDevice = !!(
    (localDevName && cloudDevName && localDevName === cloudDevName) ||
    (localDevLabel && cloudDevLabel && localDevLabel === cloudDevLabel)
  )

  // Aynı cihaz tarafından yüklenmişse ve dosya kimliği/adı zaten biliniyorsa
  if (isSameDevice && isLastBackupLoaded && !isDirty) {
    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'Yedek bu cihaz tarafından yüklendi ve yerelde güncel'
    }
  }

  // 1. Durum: Yerelde kullanıcı tarafından kaydedilmemiş veya bekleyen bir veri değişikliği yok
  if (!isDirty) {
    // Buluttaki dosya farklı bir yedek ise ve referans zamandan daha yeni veya eşit ise
    if (!isLastBackupLoaded && !isExactCurrentFile && cloudTime >= localReferenceTime) {
      return {
        hasNewerVersion: true,
        newerFile: latestCloudFile,
        isConflict: false,
        reason: 'Bulutta yerelden daha yeni bir yedek mevcut (Yerel temiz)'
      }
    }

    if (cloudTime > localReferenceTime + 10000) {
      return {
        hasNewerVersion: true,
        newerFile: latestCloudFile,
        isConflict: false,
        reason: 'Bulut yedeği yerel referans zamandan daha yeni'
      }
    }

    return {
      hasNewerVersion: false,
      newerFile: null,
      isConflict: false,
      reason: 'Yerel dosya güncel'
    }
  }

  // 2. Durum: Yerelde kaydedilmemiş kullanıcı değişiklikleri var (isDirty: true)
  if (cloudTime > localMutationTime + 60000) {
    return {
      hasNewerVersion: true,
      newerFile: latestCloudFile,
      isConflict: true,
      reason:
        'Bulutta yeni sürüm var, ancak yerelde de kaydedilmemiş değişiklikler mevcut (Çakışma)'
    }
  }

  return {
    hasNewerVersion: false,
    newerFile: null,
    isConflict: false,
    reason: 'Yerelde yapılan son kullanıcı değişikliği buluttan daha güncel'
  }
}
