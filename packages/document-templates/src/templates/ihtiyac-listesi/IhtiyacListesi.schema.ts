import { z } from "zod";

// Sub-schemas for specific procurement types
export * from "./MalAlimi/MalAlimiIhtiyacListesi.schema";
export * from "./HizmetAlimi/HizmetAlimiIhtiyacListesi.schema";
export * from "./DanismanlikHizmetAlimi/DanismanlikIhtiyacListesi.schema";
export * from "./YapimIsleri/YapimIsleriIhtiyacListesi.schema";

export const IhtiyacKalemiSchema = z
  .object({
    id: z.number().or(z.string()).optional(),
    siraNo: z.number().or(z.string()),
    kodu: z.string().optional().or(z.null()),
    tasinirKodu: z.string().optional().or(z.null()),
    pozNo: z.string().optional().or(z.null()),
    hizmetKodu: z.string().optional().or(z.null()),
    malzemeAdi: z.string().optional(),
    kalemAdi: z.string().optional(),
    imalatAdi: z.string().optional(),
    hizmetAdi: z.string().optional(),
    danismanlikKonusu: z.string().optional(),
    ozelligi: z.string().optional().or(z.null()),
    teknikTarifi: z.string().optional().or(z.null()),
    aciklama: z.string().optional().or(z.null()),
    kapsam: z.string().optional().or(z.null()),
    birimi: z.string().optional().or(z.null()),
    birim: z.string().optional().or(z.null()),
    olcuBirimi: z.string().optional().or(z.null()),
    kdvOrani: z.number().or(z.string()).optional().or(z.null()),
    miktar: z.number().or(z.string()),
  })
  .catchall(z.any());

export const IhtiyacListesiSchema = z
  .object({
    alimTuru: z.string().optional(),
    alim_turu: z.string().optional(),
    tur: z.string().optional(),
    isinTuru: z.string().optional(),
    antetSatirlari: z.array(z.string()).optional(),
    antetBirimGosterilsin: z.boolean().optional(),
    birimAntetteGosterilsin: z.boolean().optional(),
    // KİK & Standart Form Bilgileri
    kikKodu: z.string().optional(),
    kikAdi: z.string().optional(),
    standartFormKodu: z.string().optional(),
    standartFormAdi: z.string().optional(),
    evrakSayisi: z.string().optional(),
    konu: z.string().optional(),
    dosyaKonusu: z.string().optional(),
    maddeNo: z.string().optional(),
    tarih: z.string().optional(),
    dosyaTarihi: z.string().optional(),
    onayaSunulanTarih: z.string().optional(),
    onayTarihi: z.string().optional(),
    sunulacakMakamAdi: z.string().optional(),
    ihtiyacYeri: z.string().optional(),
    ihtiyacKalemleri: z.array(IhtiyacKalemiSchema).optional(),
    olurYazisi: z.boolean().optional(),
    olurBaslik: z.string().optional(),
    onaylayanPersonelAdi: z.string().optional(),
    onaylayanPersonelUnvan: z.string().optional(),
    talepEdenPersonelAdi: z.string().optional(),
    talepEdenPersonelUnvan: z.string().optional(),
    hazirlayanPersonelAdi: z.string().optional(),
    hazirlayanPersonelUnvan: z.string().optional(),
    hazirlayanTelefon: z.string().optional(),
    hazirlayanEposta: z.string().optional(),
    kurumIci: z.boolean().optional(),
    kurumAdres: z.string().optional(),
    kurumTelefon: z.string().optional(),
    kurumFaks: z.string().optional(),
    kurumWeb: z.string().optional(),
    kurumEposta: z.string().optional(),
    kurumKep: z.string().optional(),
    solLogo: z.string().optional(),
    sagLogo: z.string().optional(),
  })
  .catchall(z.any());

export type IhtiyacListesiType = z.infer<typeof IhtiyacListesiSchema>;
export type IhtiyacKalemiType = z.infer<typeof IhtiyacKalemiSchema>;
