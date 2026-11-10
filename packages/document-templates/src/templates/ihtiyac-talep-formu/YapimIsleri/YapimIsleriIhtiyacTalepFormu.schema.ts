import { z } from "zod";
import { YapimIsleriKalemiSchema } from "../../ihtiyac-listesi/YapimIsleri/YapimIsleriIhtiyacListesi.schema";

export const YapimIsleriIhtiyacTalepFormuSchema = z
  .object({
    alimTuru: z.string().optional(),
    antetSatirlari: z.array(z.string()).optional(),
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
    ihtiyacKalemleri: z.array(YapimIsleriKalemiSchema).optional(),
    gerekce: z.string().optional(),
    altNotlar: z.string().optional(),
    ekler: z.string().optional(),
    onaylayanPersonelAdi: z.string().optional(),
    onaylayanPersonelUnvan: z.string().optional(),
    talepEdenPersonelAdi: z.string().optional(),
    talepEdenPersonelUnvan: z.string().optional(),
    hazirlayanPersonelAdi: z.string().optional(),
    hazirlayanPersonelUnvan: z.string().optional(),
  })
  .catchall(z.any());

export type YapimIsleriIhtiyacTalepFormuType = z.infer<
  typeof YapimIsleriIhtiyacTalepFormuSchema
>;
