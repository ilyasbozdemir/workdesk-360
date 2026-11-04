import { minimatch } from 'minimatch'
import { FileRecord, ViewRule } from '../../shared/types'

export function evaluateRules(file: FileRecord, rule?: ViewRule | null): boolean {
  if (!rule) return true

  // 1. Uzantı Filtresi (ext[])
  if (rule.ext && rule.ext.length > 0) {
    const fileExt = file.ext.replace(/^\./, '').toLowerCase()
    const matchesExt = rule.ext.some((e) => e.replace(/^\./, '').toLowerCase() === fileExt)
    if (!matchesExt) return false
  }

  // 2. İsim Regex Filtresi (nameRegex)
  if (rule.nameRegex && rule.nameRegex.trim() !== '') {
    try {
      const regex = new RegExp(rule.nameRegex, 'i')
      if (!regex.test(file.name)) return false
    } catch {
      // Hatalı regex durumunda filtreyi geçersiz sayıp reddediyoruz
      return false
    }
  }

  // 3. Dosya Yolu Glob Filtresi (pathGlob)
  if (rule.pathGlob && rule.pathGlob.trim() !== '') {
    try {
      const normalizedPath = file.relativePath.replace(/\\/g, '/')
      const matchesGlob = minimatch(normalizedPath, rule.pathGlob, {
        nocase: true,
        matchBase: true
      })
      if (!matchesGlob) return false
    } catch {
      return false
    }
  }

  // 4. Boyut Filtreleri (MB cinsinden)
  const sizeBytes = file.size
  if (rule.minSizeMB !== undefined && rule.minSizeMB !== null && rule.minSizeMB > 0) {
    if (sizeBytes < rule.minSizeMB * 1024 * 1024) return false
  }
  if (rule.maxSizeMB !== undefined && rule.maxSizeMB !== null && rule.maxSizeMB > 0) {
    if (sizeBytes > rule.maxSizeMB * 1024 * 1024) return false
  }

  // 5. Değiştirilme Tarihi (modifiedWithinDays)
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000

  if (rule.modifiedWithinDays !== undefined && rule.modifiedWithinDays > 0) {
    const diffDays = (now - file.mtimeMs) / oneDayMs
    if (diffDays > rule.modifiedWithinDays) return false
  }

  // 6. Oluşturulma Tarihi (createdWithinDays)
  if (rule.createdWithinDays !== undefined && rule.createdWithinDays > 0) {
    const diffDays = (now - file.ctimeMs) / oneDayMs
    if (diffDays > rule.createdWithinDays) return false
  }

  // 7. Etiket Filtresi (tags[])
  if (rule.tags && rule.tags.length > 0) {
    const fileTags = (file.tags || []).map((t) => t.toLowerCase())
    const hasAnyTag = rule.tags.some((rt) => fileTags.includes(rt.toLowerCase()))
    if (!hasAnyTag) return false
  }

  return true
}

