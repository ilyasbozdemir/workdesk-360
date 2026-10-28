/**
 * <summary>
 * Disk Analiz 360 — Saf (Pure) Squarified Treemap Yerleşim ve Gezinme Hesaplama Modülü.
 * DOM veya UI bağımlılığı içermez; gerçek dosya/klasör boyutlarıyla orantılı dikdörtgenler üretir.
 * </summary>
 */

import { TreemapColorMode, TreemapNodeInput, TreemapRectNode } from './types.js'

export interface TreemapLayoutOptions {
  width: number
  height: number
  colorMode: TreemapColorMode
  /** Çok küçük öğeleri tek bir "Diğer Küçük Öğeler" kutusunda birleştirme eşiği (varsayılan: 85 öğe üstü) */
  maxVisibleBoxes?: number
  /** Etiket gösterimi için minimum genişlik (px) */
  minLabelWidth?: number
  /** Etiket gösterimi için minimum yükseklik (px) */
  minLabelHeight?: number
}

const FOLDER_PALETTE = [
  '#2563eb', // blue-600
  '#4f46e5', // indigo-600
  '#0891b2', // cyan-600
  '#0d9488', // teal-600
  '#7c3aed', // violet-600
  '#0284c7', // sky-600
  '#4338ca', // indigo-700
  '#0f766e'  // teal-700
]

const EXTENSION_COLORS: Record<string, string> = {
  // Video & Medya
  mp4: '#e11d48',
  mkv: '#be123c',
  avi: '#f43f5e',
  mov: '#fb7185',
  mp3: '#db2777',
  wav: '#ec4899',
  // Arşiv & Disk İmajı
  zip: '#d97706',
  rar: '#b45309',
  '7z': '#f59e0b',
  iso: '#92400e',
  tar: '#ca8a04',
  gz: '#eab308',
  // Kurulum & İkili Dosyalar
  exe: '#dc2626',
  msi: '#b91c1c',
  dll: '#991b1b',
  sys: '#7f1d1d',
  // Belgeler
  pdf: '#ea580c',
  doc: '#2563eb',
  docx: '#1d4ed8',
  xls: '#16a34a',
  xlsx: '#15803d',
  ppt: '#c2410c',
  pptx: '#9a3412',
  // Kod & Veri
  json: '#0d9488',
  ts: '#0284c7',
  js: '#ca8a04',
  sql: '#7c3aed',
  db: '#6d28d9',
  sqlite: '#5b21b6',
  log: '#64748b',
  tmp: '#475569',
  bak: '#475569',
  // Görseller
  png: '#059669',
  jpg: '#10b981',
  jpeg: '#10b981',
  webp: '#34d399',
  svg: '#047857'
}

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function resolveNodeColor(node: TreemapNodeInput, mode: TreemapColorMode): string {
  if (node.kind === 'aggregated_small') {
    return '#475569' // slate-600
  }

  if (mode === 'folder') {
    if (node.kind === 'folder') {
      const idx = hashString(node.fullPath) % FOLDER_PALETTE.length
      return FOLDER_PALETTE[idx]
    }
    const parentIdx = hashString(node.parentPath || node.fullPath) % FOLDER_PALETTE.length
    return FOLDER_PALETTE[parentIdx]
  }

  if (mode === 'extension') {
    if (node.kind === 'folder') return '#3b82f6'
    const ext = (node.extension || '').toLowerCase().replace(/^\./, '')
    if (!ext || ext === '(uzantısız)') return '#64748b'
    return EXTENSION_COLORS[ext] || FOLDER_PALETTE[hashString(ext) % FOLDER_PALETTE.length]
  }

  if (mode === 'size_range') {
    const mb = node.sizeBytes / (1024 * 1024)
    if (mb >= 1024) return '#dc2626' // >= 1 GB: Kırmızı
    if (mb >= 250) return '#ea580c'  // >= 250 MB: Turuncu
    if (mb >= 50) return '#d97706'   // >= 50 MB: Kehribar
    if (mb >= 10) return '#2563eb'   // >= 10 MB: Mavi
    return '#0d9488'                 // < 10 MB: Turkuaz
  }

  if (mode === 'age') {
    if (!node.mtimeMs) return '#64748b'
    const ageDays = (Date.now() - node.mtimeMs) / (1000 * 60 * 60 * 24)
    if (ageDays >= 365) return '#7c3aed' // 1+ yıl eski
    if (ageDays >= 180) return '#2563eb' // 6+ ay eski
    if (ageDays >= 30) return '#0891b2'  // 1-6 ay
    return '#16a34a'                     // Son 30 gün
  }

  return '#2563eb'
}

/**
 * <summary>
 * Çok sayıda küçük veya sıfır baytlık öğe içeren dizinlerde Treemap okunabilirliğini ve
 * performansını korumak için en büyük N öğeyi korur, kalan küçük öğeleri tek bir özet kutuda toplar.
 * </summary>
 */
export function normalizeTreemapInputs(
  items: TreemapNodeInput[],
  maxVisibleBoxes = 80
): TreemapNodeInput[] {
  const positiveItems = items
    .filter((item) => item.sizeBytes > 0)
    .sort((a, b) => b.sizeBytes - a.sizeBytes)

  if (positiveItems.length === 0) {
    return []
  }

  if (positiveItems.length <= maxVisibleBoxes) {
    return positiveItems
  }

  const head = positiveItems.slice(0, maxVisibleBoxes - 1)
  const tail = positiveItems.slice(maxVisibleBoxes - 1)

  let tailBytes = 0
  let tailFiles = 0
  let tailFolders = 0

  for (const t of tail) {
    tailBytes += t.sizeBytes
    if (t.kind === 'folder') {
      tailFolders += 1 + t.folderCount
      tailFiles += t.fileCount
    } else {
      tailFiles += 1
    }
  }

  const parentPath = head[0]?.parentPath || ''
  const aggregatedNode: TreemapNodeInput = {
    id: `aggregated-small-${parentPath}`,
    name: `Diğer Küçük Öğeler (${tail.length} öğe)`,
    fullPath: parentPath,
    parentPath,
    kind: 'aggregated_small',
    sizeBytes: tailBytes,
    fileCount: tailFiles,
    folderCount: tailFolders
  }

  return [...head, aggregatedNode]
}

interface InternalItem {
  node: TreemapNodeInput
  area: number
  byteRatio: number
}

function worstAspectRatio(row: InternalItem[], sideLength: number): number {
  if (row.length === 0 || sideLength <= 0) return Infinity
  let sum = 0
  let maxArea = 0
  let minArea = Infinity
  for (const r of row) {
    sum += r.area
    if (r.area > maxArea) maxArea = r.area
    if (r.area < minArea) minArea = r.area
  }
  if (sum <= 0 || minArea <= 0) return Infinity
  const s2 = sum * sum
  const w2 = sideLength * sideLength
  return Math.max((w2 * maxArea) / s2, s2 / (w2 * minArea))
}

/**
 * <summary>
 * Bruls-Huizing-van Wijk Squarified Treemap algoritması.
 * Dikdörtgenlerin alanlarını gerçek bayt oranlarıyla (%100 matematiksel orantılı) yerleştirir.
 * </summary>
 */
export function computeTreemapLayout(
  rawNodes: TreemapNodeInput[],
  options: TreemapLayoutOptions
): TreemapRectNode[] {
  const width = Math.max(0, options.width)
  const height = Math.max(0, options.height)
  const totalCanvasArea = width * height
  if (totalCanvasArea <= 0 || rawNodes.length === 0) {
    return []
  }

  const normalized = normalizeTreemapInputs(rawNodes, options.maxVisibleBoxes ?? 80)
  const totalBytes = normalized.reduce((acc, n) => acc + n.sizeBytes, 0)
  if (totalBytes <= 0) {
    return []
  }

  const items: InternalItem[] = normalized.map((node) => {
    const byteRatio = node.sizeBytes / totalBytes
    return {
      node,
      byteRatio,
      area: byteRatio * totalCanvasArea
    }
  })

  const result: TreemapRectNode[] = []
  const minLabelW = options.minLabelWidth ?? 54
  const minLabelH = options.minLabelHeight ?? 24

  let x = 0
  let y = 0
  let w = width
  let h = height

  function layoutRow(row: InternalItem[]): void {
    if (row.length === 0 || w <= 0 || h <= 0) return
    const rowArea = row.reduce((acc, r) => acc + r.area, 0)
    const horizontal = w >= h
    const side = horizontal ? h : w
    const thickness = side > 0 ? rowArea / side : 0

    let offset = 0
    for (let i = 0; i < row.length; i++) {
      const item = row[i]
      const itemLength = thickness > 0 ? item.area / thickness : 0

      let rx: number
      let ry: number
      let rw: number
      let rh: number

      if (horizontal) {
        rx = x
        ry = y + offset
        rw = Math.max(0, Math.min(w, thickness))
        rh = i === row.length - 1 ? Math.max(0, h - offset) : Math.max(0, itemLength)
      } else {
        rx = x + offset
        ry = y
        rw = i === row.length - 1 ? Math.max(0, w - offset) : Math.max(0, itemLength)
        rh = Math.max(0, Math.min(h, thickness))
      }

      offset += itemLength

      result.push({
        ...item.node,
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        areaRatio: (rw * rh) / totalCanvasArea,
        byteRatio: item.byteRatio,
        colorHex: resolveNodeColor(item.node, options.colorMode),
        showLabel: rw >= minLabelW && rh >= minLabelH
      })
    }

    if (horizontal) {
      x += thickness
      w = Math.max(0, w - thickness)
    } else {
      y += thickness
      h = Math.max(0, h - thickness)
    }
  }

  let currentRow: InternalItem[] = []
  for (const item of items) {
    if (currentRow.length === 0) {
      currentRow.push(item)
      continue
    }
    const shortSide = Math.min(w, h)
    const currentWorst = worstAspectRatio(currentRow, shortSide)
    const candidateWorst = worstAspectRatio([...currentRow, item], shortSide)

    if (candidateWorst <= currentWorst) {
      currentRow.push(item)
    } else {
      layoutRow(currentRow)
      currentRow = [item]
    }
  }

  if (currentRow.length > 0) {
    layoutRow(currentRow)
  }

  return result
}

/**
 * <summary>
 * Kök dizinden (örn: C:\) geçerli alt klasöre (örn: C:\Users\Kullanici\AppData) kadar
 * tıklanabilir breadcrumb zincirini üretir.
 * </summary>
 */
export function buildBreadcrumbs(
  rootPath: string,
  targetPath: string
): Array<{ name: string; fullPath: string }> {
  const normRoot = normalizeWinPath(rootPath)
  const normTarget = normalizeWinPath(targetPath)

  const rootLabel = normRoot.endsWith('\\') && normRoot.length <= 3 ? normRoot : normRoot.split('\\').pop() || normRoot
  const crumbs: Array<{ name: string; fullPath: string }> = [
    { name: rootLabel, fullPath: normRoot }
  ]

  if (normTarget.toLowerCase() === normRoot.toLowerCase()) {
    return crumbs
  }

  if (!normTarget.toLowerCase().startsWith(normRoot.toLowerCase())) {
    return crumbs
  }

  const relativePart = normTarget.slice(normRoot.length).replace(/^\\+/, '')
  if (!relativePart) return crumbs

  const segments = relativePart.split('\\').filter(Boolean)
  let running = normRoot.replace(/\\+$/, '')

  for (const seg of segments) {
    running = `${running}\\${seg}`
    crumbs.push({
      name: seg,
      fullPath: running
    })
  }

  return crumbs
}

export function normalizeWinPath(p: string): string {
  if (!p) return ''
  const replaced = p.replace(/\//g, '\\').trim()
  // "C:" veya "C:\" -> "C:\"
  if (/^[a-zA-Z]:\\?$/.test(replaced)) {
    return `${replaced[0].toUpperCase()}:\\`
  }
  return replaced.replace(/\\+$/, '')
}

