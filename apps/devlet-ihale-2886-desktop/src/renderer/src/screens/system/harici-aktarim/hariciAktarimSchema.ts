import { z } from 'zod'

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= daysInMonth
}

/**
 * Kabul edilen biçimler:
 *  - YYYY-MM-DD
 *  - YYYY-MM-DDTHH:mm  /  YYYY-MM-DDTHH:mm:ss[.sss][Z|±HH:mm]
 * Takvim tarihi gerçekten doğrulanır (örn. 2026-99-99 veya 2025-02-30 reddedilir).
 */
export function isValidDateString(val: string): boolean {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|([+-])(\d{2}):(\d{2}))?)?$/.exec(
      val
    )
  if (!m) return false
  if (!isValidCalendarDate(Number(m[1]), Number(m[2]), Number(m[3]))) return false
  if (m[4] !== undefined) {
    if (Number(m[4]) > 23 || Number(m[5]) > 59) return false
    if (m[6] !== undefined && Number(m[6]) > 59) return false
  }
  // Saat dilimi farkı: gerçek dünyada -12:00 … +14:00 aralığında, dakika 0–59
  if (m[7] !== undefined) {
    const tzH = Number(m[8])
    const tzM = Number(m[9])
    const maxH = m[7] === '-' ? 12 : 14
    if (tzM > 59 || tzH > maxH || (tzH === maxH && tzM > 0)) return false
  }
  return true
}

const optionalDateString = z
  .string()
  .trim()
  .refine((val) => !val || isValidDateString(val), {
    message: 'Geçersiz tarih (YYYY-MM-DD veya ISO-8601 biçiminde, gerçek bir takvim tarihi olmalı).'
  })
  .optional()

export const DosyaBilgileriSchema = z
  .object({
    dosyaNo: z.string().trim().optional(),
    dosyaAcilisTarihi: optionalDateString,
    butceYili: z.string().trim().optional(),
    butce: z.enum(['Genel Bütçe', 'Döner Sermaye', 'Diğer', '']).optional(),
    dogrudanTeminNumarasi: z.string().trim().optional(),
    ihaleTarihi: optionalDateString,
    ihaleAsamasi: z.string().trim().optional(),
    isinAdi: z.string().trim().optional(),
    aciklama: z.string().trim().optional(),
    ihalesiYapilacakBirim: z.string().trim().optional(),
    sunulacakMakam: z.string().trim().optional(),
    ihtiyacYeri: z.string().trim().optional(),
    talepTarihSayisi: z.string().trim().optional(),
    kurumsalKod: z.string().trim().optional(),
    fonksiyonelKod: z.string().trim().optional(),
    finansalKod: z.string().trim().optional(),
    ihaleTipi: z.string().optional(),
    alimTuru: z.enum(['Mal Alımı', 'Hizmet Alımı', 'Yapım İşi', 'Danışmanlık', '']).optional(),
    madde: z.enum(['22/d*', '22/a', '22/b', '22/c', '22/d**', '22/e', '22/f', '3/e', '']).optional(),
    teklifSozlesmeTuru: z.enum(['Birim Fiyat', 'Götürü Bedel', '']).optional(),
    altYuklenici: z.enum(['Hayır', 'Evet', '']).optional(),
    kismiTeklif: z.enum(['Hayır', 'Evet', '']).optional(),
    fiyatFarkiDayanagi: z.string().trim().optional(),
    yatirimProjeNo: z.string().trim().optional(),
    avans: z.enum(['Hayır', 'Evet', '']).optional(),
    yaklasikMaliyetDurumu: z
      .enum(['Burada Hesaplanacak', 'Önceden hesaplandı', 'Hesaplanmayacak', 'Hesaplanacak', ''])
      .optional(),
    kdv: z.string().optional(),
    hesaplamaEsasi: z.string().trim().optional(),
    hesaplamada: z.string().trim().optional(),
    tibbiCihaz: z.enum(['Hayır', 'Evet', '']).optional(),
    irtibatYetkilisi: z.string().trim().optional(),
    sonTeklifVermeTarihSaati: optionalDateString,
    tahminiBitisTarihi: optionalDateString
  })
  .passthrough()
  .refine(
    (val) =>
      Boolean(
        (val.isinAdi && val.isinAdi.length > 0) ||
        (val.dosyaNo && val.dosyaNo.length > 0) ||
        (val.dogrudanTeminNumarasi && val.dogrudanTeminNumarasi.length > 0)
      ),
    { message: '"dosyaBilgileri" içerisinde en az "isinAdi" veya "dosyaNo" alanı bulunmalıdır.' }
  )

export const MalzemeKalemiSchema = z
  .object({
    siraNo: z.number().int().positive().optional(),
    malzemeKodu: z.string().trim().optional(),
    malzemeAdi: z.string().trim().min(1, 'Kalem / Malzeme adı boş olamaz.'),
    ozelligi: z.string().trim().optional(),
    birimi: z.string().trim().optional(),
    kdvOrani: z.string().or(z.number()).optional(),
    miktar: z.number().min(0, 'Miktar sıfır veya daha büyük olmalıdır.'),
    birimFiyat: z.number().min(0, 'Birim fiyat negatif olamaz.').optional(),
    toplamTutar: z.number().min(0).optional(),
    fiyatKaynagi: z.string().trim().optional(),
    tasinirKodu: z.string().trim().optional(),
    okasKodu: z.string().trim().optional()
  })
  .passthrough()

export const TeklifKaydiSchema = z
  .object({
    id: z.string().trim().optional(),
    siraNo: z.number().int().positive().optional(),
    firma: z.string().trim().min(1, 'Teklif veren firma adı boş olamaz.'),
    firmaNo: z.string().trim().optional(),
    vergiNo: z.string().trim().optional(),
    iletisim: z.string().trim().optional(),
    yer: z.string().trim().optional(),
    yetkili: z.string().trim().optional(),
    istekTarihi: optionalDateString,
    istekSekli: z.string().trim().optional(),
    durum: z.string().trim().optional(),
    teklifTarihi: optionalDateString,
    tutarKdvHaric: z.number().min(0).optional(),
    kdvOrani: z.string().or(z.number()).optional(),
    gecerlilikGun: z.string().trim().optional(),
    not: z.string().trim().optional(),
    kalemFiyatlari: z.array(z.string().or(z.number())).optional()
  })
  .passthrough()

export const KomisyonUyesiSchema = z
  .object({
    siraNo: z.number().int().positive().optional(),
    gorevi: z.string().trim().min(1, 'Görev alanı gereklidir.'),
    adiSoyadi: z.string().trim().min(1, 'Komisyon üyesi adı soyadı gereklidir.'),
    unvani: z.string().trim().optional()
  })
  .passthrough()

export const KomisyonlarSchema = z
  .object({
    yaklasikMaliyet: z.array(KomisyonUyesiSchema).optional(),
    muayeneKabul: z.array(KomisyonUyesiSchema).optional()
  })
  .passthrough()

export const KabulTutanakMalzemeSchema = z
  .object({
    siraNo: z.number().int().positive().optional(),
    malzemeAdi: z.string().trim().min(1, 'Kabul tutanağı malzeme adı boş olamaz.'),
    ozelligi: z.string().trim().optional(),
    birimi: z.string().trim().optional(),
    miktari: z.string().or(z.number()).optional(),
    teslimAlinan: z.string().or(z.number()).optional(),
    kabulMiktari: z.string().or(z.number()).optional()
  })
  .passthrough()

export const KabulTutanagiSchema = z
  .object({
    id: z.string().trim().optional(),
    kabulTarihi: optionalDateString,
    firma: z.string().trim().optional(),
    sayi: z.string().trim().optional(),
    teslimAlan: z.string().trim().optional(),
    teslimYeri: z.string().trim().optional(),
    faturaTarihi: optionalDateString,
    faturaNo: z.string().trim().optional(),
    not: z.string().trim().optional(),
    malzemeler: z.array(KabulTutanakMalzemeSchema).optional()
  })
  .passthrough()

export const DogrudanTeminSchema = z
  .object({
    id: z.string().trim().optional(),
    versiyon: z.string().trim().optional(),
    aktarimTarihi: optionalDateString,
    dosyaBilgileri: DosyaBilgileriSchema,
    malzemeler: z.array(MalzemeKalemiSchema).optional(),
    teklifler: z.array(TeklifKaydiSchema).optional(),
    kazananFirmalar: z
      .array(
        z
          .object({
            firmaNo: z.string().trim().optional(),
            firmaUnvani: z.string().trim(),
            iletisim: z.string().trim().optional(),
            semtSehir: z.string().trim().optional(),
            sozlesme: z.string().trim().optional()
          })
          .passthrough()
      )
      .optional(),
    komisyonlar: KomisyonlarSchema.optional(),
    kabulTutanaklari: z.array(KabulTutanagiSchema).optional(),
    sablon: z.record(z.string(), z.any()).optional(),
    f: z.record(z.string(), z.string()).optional(),
    mat: z.array(z.array(z.string())).optional()
  })
  .passthrough()

export type ValidatedDogrudanTemin = z.infer<typeof DogrudanTeminSchema>

export function validateDogrudanTeminPayload(rawJson: unknown): {
  success: boolean
  data?: ValidatedDogrudanTemin
  errors?: string[]
} {
  const result = DogrudanTeminSchema.safeParse(rawJson)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map((issue) => {
    const pathStr = issue.path.join(' > ')
    return pathStr ? `[${pathStr}] ${issue.message}` : issue.message
  })

  return { success: false, errors }
}
