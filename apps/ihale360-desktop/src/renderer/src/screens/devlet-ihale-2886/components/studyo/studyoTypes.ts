export interface CustomField {
  id: string
  key: string
  label: string
  tip: 'metin' | 'sayi' | 'para' | 'tarih' | 'secim' | 'cok_satirli'
  deger: string
  secenekler?: string[]
}

export interface FormDataType {
  ihaleKayitNo: string
  ihaleAdi: string
  islemTuru: string
  usul: string
  muhammenBedel: number
  ihaleTarihi: string
  ihaleSaati: string
  ihaleYeri: string
  kurumAdi: string
  sayiNo: string
  kararNo: string
  il: string
  ilce: string
  mahalleKoy: string
  ada: string
  parsel: string
  yuzolcumuM2: number
  cinsi: string
  adres: string
}

export type StudyoLeftTab = 'form' | 'builder' | 'vars' | 'revisions'

export interface BelgeVeSablonStudyoTabProps {
  initialDosyaId?: string
}

export interface Standard2886Template {
  kod: string
  ad: string
  kategori: string
  templateHtml: string
}
