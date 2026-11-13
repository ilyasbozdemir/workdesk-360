import { z } from "zod";

export const DanismanlikKalemiSchema = z
  .object({
    id: z.number().or(z.string()).optional(),
    siraNo: z.number().or(z.string()),
    kodu: z.string().optional().or(z.null()),
    hizmetKodu: z.string().optional().or(z.null()),
    danismanlikKonusu: z.string().optional(),
    kalemAdi: z.string().optional(),
    malzemeAdi: z.string().optional(),
    ozelligi: z.string().optional().or(z.null()),
    kapsam: z.string().optional().or(z.null()),
    aciklama: z.string().optional().or(z.null()),
    birimi: z.string().optional().or(z.null()),
    birim: z.string().optional().or(z.null()),
    kdvOrani: z.number().or(z.string()).optional().or(z.null()),
    miktar: z.number().or(z.string()),
  })
  .catchall(z.any());

export const DanismanlikIhtiyacListesiSchema = z
  .object({
    alimTuru: z.string().optional(),
    antetSatirlari: z.array(z.string()).optional(),
    antetBirimGosterilsin: z.boolean().optional(),
    birimAntetteGosterilsin: z.boolean().optional(),
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
    ihtiyacKalemleri: z.array(DanismanlikKalemiSchema).optional(),
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

export type DanismanlikIhtiyacListesiType = z.infer<typeof DanismanlikIhtiyacListesiSchema>;
export type DanismanlikKalemiType = z.infer<typeof DanismanlikKalemiSchema>;

