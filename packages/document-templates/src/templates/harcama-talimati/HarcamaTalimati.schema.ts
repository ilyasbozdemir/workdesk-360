import { z } from "zod";
import { BaseTemplateSchema } from "../../base.schema";

export const HarcamaTalimatiSchema = BaseTemplateSchema.extend({
  evrakSayisi: z.string().optional(),
  tarih: z.string().optional(),
  idareAdi: z.string().optional(),
  gerekce: z.string().optional(),
  isAdi: z.string().optional(),
  miktar: z.string().optional(),
  sure: z.string().optional(),
  teminSekli: z.string().optional(),
  yaklasikMaliyet: z.union([z.string(), z.number()]).optional(),
  odenekTutari: z.union([z.string(), z.number()]).optional(),
  gerceklestirmeGorevlileri: z.union([z.string(), z.array(z.string())]).optional(),
  gerceklestirmeGorevlisiAdi: z.string().optional(),
  gerceklestirmeGorevlisiUnvan: z.string().optional(),
  gerceklestirmeGorevlisiUnvani: z.string().optional(),
  aciklama: z.string().optional(),
  isinAciklamasi: z.string().optional(),
  mutemetAdi: z.string().optional(),
  mutemetUnvan: z.string().optional(),
  muhasebeYetkilisiAdi: z.string().optional(),
  muhasebeYetkilisi: z.string().optional(),
  isTutari: z.union([z.string(), z.number()]).optional(),
  sunumTarihi: z.string().optional(),
  hazirlayanPersonelAdi: z.string().optional(),
  hazirlayanPersonelUnvan: z.string().optional(),
  olurTarihi: z.string().optional(),
  onaylayanPersonelAdi: z.string().optional(),
  onaylayanPersonelUnvan: z.string().optional(),
});

export type HarcamaTalimatiType = z.infer<typeof HarcamaTalimatiSchema>;
