import { z } from "zod";
import { BaseTemplateSchema } from "../../base.schema";

export const KapakDetayItemSchema = z.object({
  label: z.string(),
  lines: z.array(z.string()),
  isBold: z.boolean().optional(),
});

export type KapakDetayItem = z.infer<typeof KapakDetayItemSchema>;

export const DogrudanTeminDosyasiSchema = BaseTemplateSchema.extend({
  ustLogo: z.string().optional(),
  solLogo: z.string().optional(),
  sagLogo: z.string().optional(),
  antetSatirlari: z.array(z.string()).optional(),
  kapakBasligi: z.string().optional(),
  kapakDetaylari: z.array(KapakDetayItemSchema).optional(),
  butceYili: z.string().optional(),
  alimTuru: z.string().optional(),
  teminSekli: z.string().optional(),
  dosyaTarihi: z.string().optional(),
  isAdi: z.string().optional(),
  isinAdi: z.string().optional(),
  isinAciklamasi: z.string().optional(),
  gerekce: z.string().optional(),
  yukleniciFirma: z.string().optional(),
  yukleniciDetay: z.record(z.any()).optional(),
  firmaAdi: z.string().optional(),
  firmaVkn: z.string().optional(),
  firmaAdres: z.string().optional(),
  sozlesmeBedeli: z.union([z.string(), z.number()]).optional(),
  kdvOrani: z.union([z.string(), z.number()]).optional(),
  kdvTutari: z.union([z.string(), z.number()]).optional(),
  toplamTutar: z.union([z.string(), z.number()]).optional(),
  tutarYazi: z.string().optional(),
  dipnotYili: z.union([z.string(), z.number()]).optional(),
});

export type DogrudanTeminDosyasiType = z.infer<typeof DogrudanTeminDosyasiSchema>;
