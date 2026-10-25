/**
 * DATA_DosyaSablonVeri DTO Modelleri
 */

export interface DosyaSablonVeriDto {
  id?: number
  temin_dosya_id: number
  sablon_kodu: string
  veri_json: string
  updated_at?: string
}

export interface SaveDosyaSablonVeriResultDto {
  success: boolean
  temin_dosya_id: number
  sablon_kodu: string
}
