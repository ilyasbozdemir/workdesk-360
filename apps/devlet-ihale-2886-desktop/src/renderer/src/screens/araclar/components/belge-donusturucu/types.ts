export type SubTool = 'docx-to-pdf' | 'images-to-pdf' | 'image-converter'

export interface ImageItem {
  id: string
  name: string
  size: number
  dataUrl: string
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
}

export interface DocxFile {
  name: string
  size: number
  base64?: string
  filePath?: string
}

export interface StatusMessage {
  type: 'success' | 'error'
  text: string
}

export interface SourceImg {
  name: string
  size: number
  dataUrl: string
  width: number
  height: number
  type: string
}

export interface ConvertedImgData {
  dataUrl: string
  size: number
  width: number
  height: number
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
