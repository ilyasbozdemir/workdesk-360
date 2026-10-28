/**
 * <summary>
 * Disk Analiz 360 & Arşiv 360 — Dinamik Evrensel Semantik Dosya & İsim Kümeleme Motoru.
 * Doğal Dil İşleme (NLP) benzeri kelime kök ayrıştırma ile dosya adlarından
 * Konu, Yıl, Proje Kodu, Format ve Gerçek Klasör kümelerini otomatik çıkarır.
 * </summary>
 */

export interface FileItem {
  name: string
  cleanName: string
  path: string
  isDirectory: boolean
  size: number
  ext: string
  mtime?: string
  tags: string[]
}

export interface SmartCluster {
  id: string
  label: string
  count: number
  totalSize: number
  type: 'topic' | 'folder' | 'year' | 'format' | 'project'
  files: FileItem[]
  badge?: string
}

export interface DynamicAnalysisResult {
  smartTopics: SmartCluster[]
  realFolders: SmartCluster[]
  yearClusters: SmartCluster[]
  formatClusters: SmartCluster[]
  topKeywords: { word: string; count: number }[]
}

export const PRESET_MUNICIPAL_TOPICS = [
  '00_KURUMSAL_MEDYA',
  '01_GENEL-YAZISMALAR',
  '02_TAŞINMAZ_İŞLEMLERİ',
  '03_KAMULAŞTIRMA',
  '04_İMAR_UYGULAMALARI',
  '05_İFRAZ_TEVHİD_YOLA_TERK',
  '06_İHALE_ve_ALIM_İŞLERİ',
  '07_ALTYAPI_YOL_KANAL',
  '08_PARK_SPOR_SOSYAL_TESİS',
  '09_ZABİTA_DENETİM',
  '10_PERSONEL_İDARİ',
  '11_KİŞİSEL_DİĞER',
  '99_SINIFLANAMAYAN'
]

// Dosya adlarında tek başına anlam ifade etmeyen gürültü kelimeler (Stopwords)
const STOP_WORDS = new Set([
  've',
  'ile',
  'icin',
  'için',
  'bu',
  'bir',
  'son',
  'yeni',
  'eski',
  'kopya',
  'copy',
  'final',
  'rev',
  'revize',
  'dosya',
  'belge',
  'evrak',
  'ek',
  'ekler',
  'no',
  'nolu',
  'sayili',
  'sayılı',
  'tarihli',
  'hk',
  'hakkinda',
  'hakkında',
  'ait',
  'dair',
  'iliskin',
  'ilişkin',
  'detay',
  'liste',
  'listesi',
  'tablo',
  'tablosu',
  'form',
  'formu',
  'örnek',
  'ornek',
  'taslak',
  'tamam',
  'ok',
  'onay',
  'onayli',
  'imzali',
  'imzalı',
  'tarama',
  'scan',
  'img',
  'image',
  'photo',
  'whatsapp',
  'screenshot',
  'ekran',
  'goruntusu',
  'görüntüsü',
  'document',
  'untitled',
  'adsiz',
  'adsız',
  'klasor',
  'klasör',
  'arsiv',
  'arşiv',
  'data',
  'veri',
  'genel',
  'toplam',
  'tumu',
  'tümü',
  'hepsi',
  'diger',
  'diğer',
  'page',
  'sayfa',
  'part',
  'bolum',
  'bölüm'
])

// Uzantıya göre evrensel dosya format grupları
const FORMAT_GROUPS: Record<string, { label: string; exts: string[] }> = {
  DOCUMENTS: {
    label: '📄 Word & PDF Belgeleri',
    exts: ['.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt']
  },
  SPREADSHEETS: {
    label: '📊 Excel & Tablolar',
    exts: ['.xls', '.xlsx', '.xlsm', '.csv', '.ods']
  },
  PRESENTATIONS: {
    label: '📽️ Sunum Dosyaları',
    exts: ['.ppt', '.pptx', '.odp']
  },
  CAD_GIS: {
    label: '📐 CAD, Harita & CBS',
    exts: ['.dwg', '.dxf', '.dgn', '.ncz', '.shp', '.kml', '.kmz']
  },
  IMAGES: {
    label: '🖼️ Fotoğraf & Görseller',
    exts: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.heic']
  },
  DESIGN: {
    label: '🎨 Tasarım & Vektör',
    exts: ['.psd', '.ai', '.cdr', '.eps', '.indd', '.svg']
  },
  VIDEOS: {
    label: '🎬 Video Kayıtları',
    exts: ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.m4v']
  },
  ARCHIVES: {
    label: '📦 Sıkıştırılmış Arşivler',
    exts: ['.zip', '.rar', '.7z', '.tar', '.gz']
  },
  CODE_DB: {
    label: '💻 Kod & Veri Dosyaları',
    exts: ['.py', '.js', '.ts', '.json', '.sql', '.db', '.sqlite', '.xml', '.html']
  }
}

/**
 * Türkçe karakterleri koruyarak anlamlı kelimeleri ayrıştırır
 */
export function tokenizeFilename(nameWithoutExt: string): string[] {
  const cleaned = nameWithoutExt
    .replace(/[_\-\.,;:\(\)\[\]\{\}\/\\+\*&#@!?'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const rawTokens = cleaned.split(' ')
  const validTokens: string[] = []

  for (const raw of rawTokens) {
    const lower = raw.toLocaleLowerCase('tr-TR')
    if (lower.length < 3) continue
    if (/^\d+$/.test(lower)) continue
    if (/^[0-9a-f]{6,}$/i.test(lower)) continue
    if (STOP_WORDS.has(lower)) continue

    validTokens.push(lower)
  }

  return validTokens
}

/**
 * Dosya adından veya tarihten Yıl (2010 - 2030 arası) çıkarır
 */
export function extractYear(name: string, mtime?: string): string | null {
  const yearMatch = name.match(/(?:^|[^0-9])(199\d|20[0-2]\d|2030)(?:$|[^0-9])/)
  if (yearMatch) return yearMatch[1]
  if (mtime) {
    const d = new Date(mtime)
    if (!Number.isNaN(d.getTime())) return d.getFullYear().toString()
  }
  return null
}

/**
 * Dosya adından Ada/Parsel veya İhale Kayıt Numarası (İKN: 2024/123456) gibi kalıpları yakalar
 */
export function extractProjectCode(name: string): string | null {
  const iknMatch = name.match(/(?:^|[^0-9])(20[12]\d)[\/\-_](\d{4,7})(?:$|[^0-9])/)
  if (iknMatch) return `İKN: ${iknMatch[1]}/${iknMatch[2]}`

  const adaMatch = name.match(/(?:^|[^0-9])(\d{1,5})\s*ada\s*(\d{1,5})\s*parsel\b/i)
  if (adaMatch) return `${adaMatch[1]} Ada ${adaMatch[2]} Parsel`

  return null
}

/**
 * Kelimenin baş harfini büyütür (Türkçe uyumlu)
 */
function capitalizeTR(word: string): string {
  if (!word) return ''
  return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1)
}

/**
 * Verilen dosya listesini anında analiz ederek dinamik kümeler üretir.
 */
export function analyzeArchiveFiles(files: FileItem[], baseDir?: string): DynamicAnalysisResult {
  const wordFreq = new Map<string, FileItem[]>()
  const phraseFreq = new Map<string, FileItem[]>()
  const folderMap = new Map<string, FileItem[]>()
  const yearMap = new Map<string, FileItem[]>()
  const formatMap = new Map<string, FileItem[]>()

  for (const file of files) {
    if (file.isDirectory) {
      folderMap.set(file.name, [])
      continue
    }

    // 1. Gerçek Alt Klasör Analizi
    if (baseDir && file.path.startsWith(baseDir)) {
      const rel = file.path.slice(baseDir.length).replace(/^[\\\/]+/, '')
      const parts = rel.split(/[\\\/]/)
      if (parts.length > 1) {
        const topFolder = parts[0]
        const list = folderMap.get(topFolder) || []
        list.push(file)
        folderMap.set(topFolder, list)
      }
    }

    // 2. Yıl Analizi
    const yr = extractYear(file.name, file.mtime)
    if (yr) {
      const list = yearMap.get(yr) || []
      list.push(file)
      yearMap.set(yr, list)
    } else {
      const list = yearMap.get('Tarihsiz') || []
      list.push(file)
      yearMap.set('Tarihsiz', list)
    }

    // 3. Format Analizi
    const ext = (file.ext || '').toLowerCase()
    let matchedFormat = 'OTHER'
    for (const [key, grp] of Object.entries(FORMAT_GROUPS)) {
      if (grp.exts.includes(ext)) {
        matchedFormat = key
        break
      }
    }
    const fList = formatMap.get(matchedFormat) || []
    fList.push(file)
    formatMap.set(matchedFormat, fList)

    // 4. İsimden Otomatik Konu / Kelime Madenciliği
    const tokens = tokenizeFilename(file.cleanName || file.name)
    const uniqueTokens = Array.from(new Set(tokens))

    for (const t of uniqueTokens) {
      const list = wordFreq.get(t) || []
      list.push(file)
      wordFreq.set(t, list)
    }

    // İkili kelime öbekleri (Bigrams)
    for (let i = 0; i < tokens.length - 1; i++) {
      const w1 = tokens[i]
      const w2 = tokens[i + 1]
      if (w1 !== w2) {
        const bigram = `${w1} ${w2}`
        const list = phraseFreq.get(bigram) || []
        if (!list.includes(file)) {
          list.push(file)
          phraseFreq.set(bigram, list)
        }
      }
    }
  }

  // A) AKILLI KONU KÜMELERİ OLUŞTURMA
  const smartTopics: SmartCluster[] = []
  const usedWords = new Set<string>()

  const sortedPhrases = Array.from(phraseFreq.entries())
    .filter(([_, list]) => list.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)

  for (const [phrase, list] of sortedPhrases.slice(0, 12)) {
    const words = phrase.split(' ')
    words.forEach((w) => usedWords.add(w))
    smartTopics.push({
      id: `phrase_${phrase}`,
      label: words.map(capitalizeTR).join(' '),
      count: list.length,
      totalSize: list.reduce((acc, f) => acc + (f.size || 0), 0),
      type: 'topic',
      files: list,
      badge: 'Öbek'
    })
  }

  const minCount = files.length > 30 ? 2 : 1
  const sortedWords = Array.from(wordFreq.entries())
    .filter(([w, list]) => list.length >= minCount && !usedWords.has(w))
    .sort((a, b) => b[1].length - a[1].length)

  for (const [word, list] of sortedWords.slice(0, 18)) {
    smartTopics.push({
      id: `word_${word}`,
      label: capitalizeTR(word),
      count: list.length,
      totalSize: list.reduce((acc, f) => acc + (f.size || 0), 0),
      type: 'topic',
      files: list
    })
  }

  smartTopics.sort((a, b) => b.count - a.count)

  // B) GERÇEK KLASÖRLER
  const realFolders: SmartCluster[] = Array.from(folderMap.entries())
    .map(([folderName, list]) => ({
      id: `folder_${folderName}`,
      label: folderName,
      count: list.length,
      totalSize: list.reduce((acc, f) => acc + (f.size || 0), 0),
      type: 'folder' as const,
      files: list
    }))
    .sort((a, b) => b.count - a.count)

  // C) YIL KÜMELERİ
  const yearClusters: SmartCluster[] = Array.from(yearMap.entries())
    .map(([yr, list]) => ({
      id: `year_${yr}`,
      label: yr === 'Tarihsiz' ? '📅 Yılı Belirsiz' : `📅 ${yr} Yılı`,
      count: list.length,
      totalSize: list.reduce((acc, f) => acc + (f.size || 0), 0),
      type: 'year' as const,
      files: list,
      badge: yr
    }))
    .sort((a, b) => b.badge!.localeCompare(a.badge!))

  // D) FORMAT KÜMELERİ
  const formatClusters: SmartCluster[] = Array.from(formatMap.entries())
    .map(([key, list]) => ({
      id: `fmt_${key}`,
      label: FORMAT_GROUPS[key]?.label || '📁 Diğer Formatlar',
      count: list.length,
      totalSize: list.reduce((acc, f) => acc + (f.size || 0), 0),
      type: 'format' as const,
      files: list
    }))
    .sort((a, b) => b.count - a.count)

  // E) EN ÇOK GEÇEN KELİMELER
  const topKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .map(([word, list]) => ({ word, count: list.length }))

  return {
    smartTopics,
    realFolders,
    yearClusters,
    formatClusters,
    topKeywords
  }
}

