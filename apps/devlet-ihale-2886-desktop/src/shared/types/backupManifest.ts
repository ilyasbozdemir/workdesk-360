/**
 * TEMİN 360 - Anonim Yedekleme Manifesti (Backup Manifest)
 *
 * Her `.temin` yedeği ile eşleşen bir `.json` manifest dosyası bulunur:
 * Örnek: `Proje_2026-10-19_18-30.temin` <-> `Proje_2026-10-19_18-30.json`
 *
 * GİZLİLİK VE ANONİMLİK KURALI:
 * Bu manifestte kullanıcı adı, kurum adı, ad-soyad, bilgisayarın hostname'i,
 * yerel dosya yolları, e-posta, OAuth token'ları veya hassas iş verileri ASLA yer almaz.
 */

export interface BackupManifest {
  /** Manifest şema sürümü (gelecekteki genişletmeler için) */
  manifestVersion: 1

  /** Her yedekleme için benzersiz UUID v4 */
  backupId: string

  /**
   * Aynı çalışma projesinde cihazlar arasında ortak, kalıcı ve rastgele UUID v4.
   * Proje oluşturulduğunda bir kez atanır ve kopyalandığında/aktarıldığında korunur.
   */
  projectId: string

  /** Asıl yedek dosyasının adı (örn: `Proje_2026-10-19_18-30.temin`) */
  fileName: string

  /** Google Drive üzerindeki asıl `.temin` dosyasının dosya kimliği */
  driveFileId?: string

  /** Gerçek `.temin` dosyasının SHA-256 karma özeti (küçük harf hex, 64 karakter) */
  sha256: string

  /** Bayt cinsinden `.temin` dosya boyutu */
  fileSize: number

  /** UTC ISO-8601 yedek oluşturma zamanı */
  createdAt: string

  /**
   * Yalnızca gerçek kullanıcı verisi değiştiğinde artan sürüm sayacı.
   * Şema migration, seed ve açılış bakım işlemleri bu sayacı artırmaz.
   */
  dataRevision: number

  /** Önceki bilinen yedeğin kimliği (zincir takibi için), bilinmiyorsa null */
  parentBackupId: string | null

  /** Yedekleme yapan TEMİN 360 uygulama sürümü (örn: 1.0.0-rc.4) */
  appVersion: string

  /**
   * Kişisel bilgi içermeyen, bu cihazda yerel olarak rastgele üretilmiş UUID v4.
   * Hostname veya kullanıcı adından türetilmez.
   */
  deviceId: string
}

/**
 * Verilen nesnenin geçerli ve güvenli bir BackupManifest olup olmadığını doğrular.
 */
export function isBackupManifest(obj: unknown): obj is BackupManifest {
  if (!obj || typeof obj !== 'object') return false
  const m = obj as Record<string, unknown>

  if (m.manifestVersion !== 1) return false
  if (typeof m.backupId !== 'string' || m.backupId.length < 10) return false
  if (typeof m.projectId !== 'string' || m.projectId.length < 10) return false
  if (typeof m.fileName !== 'string' || !m.fileName.toLowerCase().endsWith('.temin')) return false
  if (typeof m.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(m.sha256)) return false
  if (typeof m.fileSize !== 'number' || m.fileSize <= 0) return false
  if (typeof m.createdAt !== 'string' || isNaN(new Date(m.createdAt).getTime())) return false
  if (typeof m.dataRevision !== 'number' || m.dataRevision < 1) return false
  if (m.parentBackupId !== null && typeof m.parentBackupId !== 'string') return false
  if (typeof m.appVersion !== 'string' || !m.appVersion) return false
  if (typeof m.deviceId !== 'string' || m.deviceId.length < 10) return false

  // Anonimlik koruması: Kişisel/hassas alanlar barındırılmamalıdır
  const forbiddenKeys = [
    'hostname',
    'username',
    'userFullName',
    'institution',
    'token',
    'email',
    'path',
    'filePath'
  ]
  for (const k of forbiddenKeys) {
    if (k in m && m[k] !== undefined) return false
  }

  return true
}
