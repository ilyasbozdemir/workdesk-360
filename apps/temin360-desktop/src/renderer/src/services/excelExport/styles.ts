import type ExcelJS from 'exceljs'

// -------------------------------------------------------------------------
// RESMİ KURUMSAL TİPOGRAFİ VE STİL SABİTLERİ (Times New Roman & Resmi Tonlar)
// -------------------------------------------------------------------------
export const FONT_FAMILY = 'Times New Roman'

// Başlık ve Vurgu Dolguları (Resmi, Sade, Renksiz / Açık Gri Standart)
export const headerFillOfficial: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' } // Sade Kurumsal Açık Gri (Yazıcı Dostu & Resmi)
}

export const subHeaderFillOfficial: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' } // Çok Açık Resmi Gri
}

export const softGrayFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF9FAFB' } // Açık Soft Zemin Grisi
}

export const zebraFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFFFF' } // Sade Düz Beyaz
}

export const softHighlightFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' } // Vurgulu Satır Grisi
}

// Kenarlıklar (Resmi Çizgili & Net)
export const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  bottom: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
}

export const doubleBottomBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF4B5563' } },
  left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
  bottom: { style: 'double', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
}

export const boxBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF374151' } },
  left: { style: 'medium', color: { argb: 'FF374151' } },
  bottom: { style: 'medium', color: { argb: 'FF374151' } },
  right: { style: 'medium', color: { argb: 'FF374151' } }
}

/**
 * Excel Column index (1-based) to Letter converter (1 -> A, 27 -> AA, etc.)
 */
export function getColumnLetter(colIndex: number): string {
  let temp = colIndex
  let letter = ''
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - mod) / 26)
  }
  return letter
}
