import { z } from 'zod'

export const BaseTemplateSchema = z.object({
  _meta: z
    .object({
      templateId: z.string(),
      templateVersion: z.string(),
      documentNumber: z.string().optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional()
    })
    .optional(),
  kurumAdi: z.string().optional(),
  kurumUst: z.string().optional(),
  mudurluk: z.string().optional(),
  idareAdi: z.string().optional(),
  kurumAdres: z.string().optional(),
  kurumTelefon: z.string().optional(),
  kurumFaks: z.string().optional(),
  kurumWeb: z.string().url().optional(),
  kurumEposta: z.string().email().optional(),
  kurumKep: z.string().optional(),
  antetSatirlari: z.array(z.string()).optional(),
  antetBirimGosterilsin: z.boolean().optional(),
  birimAntetteGosterilsin: z.boolean().optional(),
  solLogo: z.string().url().optional(),
  sagLogo: z.string().url().optional(),
  evrakSayisi: z.string().optional(),
  // KİK & Standart Form Destek Alanları (İsteğe Bağlı)
  kikKodu: z.string().optional(),
  kikAdi: z.string().optional(),
  standartFormKodu: z.string().optional(),
  standartFormAdi: z.string().optional(),
  dosyaKonusu: z.string().optional(),
  isAdi: z.string().optional(),
  isinAdi: z.string().optional(),
  isinAciklamasi: z.string().optional(),
  tarih: z.string().optional(),
  dosyaTarihi: z.string().optional(),
  teminNo: z.string().optional(),
  teminSekli: z.string().optional(),
  maddeNo: z.string().optional(),
  butceYili: z.string().optional(),
  butceTertibi: z.array(z.string()).optional(),
  butceKodu: z.string().optional(),
  yaklasikMaliyet: z.string().optional(),
  odenekTutari: z.string().optional(),
  projeNo: z.string().optional(),
  avansSartlari: z.string().optional(),
  fiyatFarkiSartlari: z.string().optional(),
  yillaraYaygin: z.string().optional(),
  sozlesmeYapilacak: z.string().optional(),
  hesaplamaEsasi: z.string().optional(),
  komisyonTakdiri: z.string().optional(),
  hazirlayanPersonelAdi: z.string().optional(),
  hazirlayanPersonelUnvan: z.string().optional(),
  hazirlayanTelefon: z.string().optional(),
  hazirlayanEposta: z.string().email().optional(),
  onaylayanPersonelAdi: z.string().optional(),
  onaylayanPersonelUnvan: z.string().optional(),
  baskanAdi: z.string().optional(),
  baskanUnvan: z.string().optional(),
  talepEdenPersonelAdi: z.string().optional(),
  talepEdenPersonelUnvan: z.string().optional(),
  talepEdenTelefon: z.string().optional(),
  sunanPersonelAdi: z.string().optional(),
  sunanPersonelUnvan: z.string().optional(),
  sunanTelefon: z.string().optional(),
  ilgiliPersonelAdi: z.string().optional(),
  ilgiliPersonelUnvan: z.string().optional(),
  ilgiliTelefon: z.string().optional(),
  irtibatTelefon: z.string().optional(),
  yukleniciFirma: z.string().optional(),
  yukleniciAdresi: z.string().optional(),
  yukleniciIlce: z.string().optional(),
  yukleniciIl: z.string().optional(),
  yukleniciTelefon: z.string().optional(),
  yukleniciFaks: z.string().optional(),
  yukleniciEposta: z.string().email().optional(),
  yukleniciVergiDairesi: z.string().optional(),
  yukleniciVergiNo: z.string().optional(),
  idareAdresi: z.string().optional(),
  idareTelefon: z.string().optional(),
  idareEposta: z.string().email().optional(),
  komisyon: z
    .array(
      z.object({
        adSoyad: z.string(),
        unvan: z.string(),
        gorevi: z.string().optional()
      })
    )
    .optional(),
  fiyatKomisyonu: z.array(z.any()).optional(),
  muayeneKomisyonu: z.array(z.any()).optional(),
  ihaleKomisyonu: z.array(z.any()).optional(),
  kurumumuz: z.string().optional(),
  kurumunuz: z.string().optional(),
  kurumu: z.string().optional(),
  kurumlari: z.string().optional(),
  kurumIci: z.boolean().optional(),
  olurYazisi: z.boolean().optional(),
  isAverageBasis: z.boolean().optional(),
  isEnDusuk: z.boolean().optional(),
  isMal: z.boolean().optional(),
  isHizmet: z.boolean().optional(),
  isYapim: z.boolean().optional(),
  sunulacakMakamAdi: z.string().optional(),
  belgeModu: z.enum(['standart', 'koordinasyonlu', 'hizli_onay']).optional(),
  rota: z
    .array(
      z.object({
        t: z.string().optional(),
        a: z.string().optional(),
        u: z.string().optional(),
        sira: z.number().optional(),
        tarih: z.string().optional()
      })
    )
    .optional(),
  koordinasyon: z
    .array(
      z.object({
        adSoyad: z.string().optional(),
        unvan: z.string().optional(),
        tarih: z.string().optional(),
        rol: z.string().optional()
      })
    )
    .optional()
});

export type BaseTemplate = z.infer<typeof BaseTemplateSchema>;
export const BaseDocumentSchema = BaseTemplateSchema;
export type BaseDocument = BaseTemplate;
