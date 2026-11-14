import { z } from "zod";

export const DanismanlikLuzumKalemiSchema = z
  .object({
    id: z.number().or(z.string()).optional(),
    siraNo: z.number().or(z.string()),
    kodu: z.string().optional().or(z.null()),
    hizmetKodu: z.string().optional().or(z.null()),
    danismanlikKonusu: z.string().optional(),
    kalemAdi: z.string().optional(),
    malzemeAdi: z.string().optional(),
    ozelligi: z.string().optional().or(z.null()),
    aciklama: z.string().optional().or(z.null()),
    kapsam: z.string().optional().or(z.null()),
    birimi: z.string().optional().or(z.null()),
    birim: z.string().optional().or(z.null()),
    kdvOrani: z.number().or(z.string()).optional().or(z.null()),
    miktar: z.number().or(z.string()),
  })
  .catchall(z.any());

export const DanismanlikLuzumMuzekkeresiSchema = z
  .object({
    alimTuru: z.string().optional(),
    alim_turu: z.string().optional(),
    tur: z.string().optional(),
    antetSatirlari: z.any().optional(),
    evrakSayisi: z.any().optional(),
    dosyaKonusu: z.any().optional(),
    maddeNo: z.any().optional(),
    tarih: z.any().optional(),
    onayaSunulanTarih: z.any().optional(),
    onayTarihi: z.any().optional(),
    dosyaTarihi: z.any().optional(),
    onaylayanPersonelAdi: z.any().optional(),
    onaylayanPersonelUnvan: z.any().optional(),
    hazirlayanPersonelAdi: z.any().optional(),
    hazirlayanPersonelUnvan: z.any().optional(),
    hazirlayanTelefon: z.any().optional(),
    hazirlayanEposta: z.any().optional(),
    talepEdenPersonelAdi: z.any().optional(),
    talepEdenPersonelUnvan: z.any().optional(),
    sunulacakMakamAdi: z.any().optional(),
    ihtiyacYeri: z.any().optional(),
    ihtiyacKalemleri: z.array(DanismanlikLuzumKalemiSchema).optional(),
    olurBaslik: z.any().optional(),
    solLogo: z.any().optional(),
    sagLogo: z.any().optional(),
    kurumIci: z.any().optional(),
    isinAciklamasi: z.any().optional(),
    aciklamaMaddeleri: z.any().optional(),
    hasAciklamaMaddeleri: z.any().optional(),
    olurYazisi: z.any().optional(),
  })
  .catchall(z.any());

export type DanismanlikLuzumMuzekkeresiType = z.infer<typeof DanismanlikLuzumMuzekkeresiSchema>;
export type DanismanlikLuzumKalemiType = z.infer<typeof DanismanlikLuzumKalemiSchema>;
