import { z } from "zod";
import { BaseTemplateSchema } from "../../base.schema";

export const LuzumOnayEkiKalemSchema = z.object({
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

export type LuzumOnayEkiKalemType = z.infer<typeof LuzumOnayEkiKalemSchema>;

export const LuzumMuzekkeresiOnayEkiSchema = BaseTemplateSchema.extend({
  ekNo: z.string().optional(),
  dosyaKonusu: z.string().optional(),
  kurumMetni: z.string().optional(),
  kurumumuz: z.string().optional(),
  talepEdenPersonelAdi: z.string().optional(),
  talepEdenPersonelUnvan: z.string().optional(),
  hazirlayanPersonelAdi: z.string().optional(),
  hazirlayanPersonelUnvan: z.string().optional(),
  altKurumTipi: z.string().optional(),
  ihtiyacKalemleri: z.array(LuzumOnayEkiKalemSchema).optional(),
  dosyaTarihi: z.string().optional(),
  alimTuru: z.enum(["mal", "hizmet", "danismanlik", "yapim"]).optional(),
});

export type LuzumMuzekkeresiOnayEkiType = z.infer<
  typeof LuzumMuzekkeresiOnayEkiSchema
>;
