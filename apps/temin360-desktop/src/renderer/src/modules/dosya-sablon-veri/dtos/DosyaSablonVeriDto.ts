/**
 * DATA_TeminBelgeSnapshot (eski DATA_DosyaSablonVeri) DTO Modelleri
 */

export interface DosyaSablonVeriDto {
  id?: number
  dosya_id: number
  temin_dosya_id?: number
  sablon_kodu: string
  veri_json: string
  updated_at?: string
}

export interface SaveDosyaSablonVeriResultDto {
  success: boolean
  dosya_id?: number
  temin_dosya_id?: number
  sablon_kodu: string
}
