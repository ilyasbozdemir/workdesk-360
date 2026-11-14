import { z } from "zod";
import { BaseTemplateSchema } from "../../base.schema";

export const LuzumTeslimKalemSchema = z.object({
  siraNo: z.number().optional(),
  kodu: z.string().optional(),
  tasinirKodu: z.string().optional(),
  pozNo: z.string().optional(),
  hizmetKodu: z.string().optional(),
  malzemeAdi: z.string().optional(),
  kalemAdi: z.string().optional(),
  imalatAdi: z.string().optional(),
  hizmetAdi: z.string().optional(),
  danismanlikKonusu: z.string().optional(),
  ozelligi: z.string().optional(),
  teknikTarifi: z.string().optional(),
  aciklama: z.string().optional(),
  birimi: z.string().optional(),
  birim: z.string().optional(),
  olcuBirimi: z.string().optional(),
  kdvOrani: z.union([z.string(), z.number()]).optional(),
  miktar: z.union([z.number(), z.string()]).optional(),
});

export const LuzumTeslimKisiSchema = z.object({
  adSoyad: z.string().optional(),
  unvan: z.string().optional(),
});

export const LuzumMuzekkeresiTeslimTesellumSchema = BaseTemplateSchema.extend({
  isinAdi: z.string().optional(),
  isinDegeri: z.string().optional(),
  dosyaNumarasi: z.string().optional(),
  evrakSayisi: z.string().optional(),
  yukleniciFirma: z.string().optional(),
  kurumumuz: z.string().optional(),
  dosyaTarihi: z.string().optional(),
  dosyaKonusu: z.string().optional(),
  ihtiyacKalemleri: z.array(LuzumTeslimKalemSchema).optional(),
  teslimAlanlar: z.array(LuzumTeslimKisiSchema).optional(),
  teslimEdenler: z.array(LuzumTeslimKisiSchema).optional(),
  alimTuru: z.enum(["mal", "hizmet", "danismanlik", "yapim"]).optional(),
});

export type LuzumMuzekkeresiTeslimTesellumType = z.infer<
  typeof LuzumMuzekkeresiTeslimTesellumSchema
>;
