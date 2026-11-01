import type { DocumentDataSource, ResolveContext, TableColumnMapping } from "../types.js";

/**
 * Demo adapter. Gerçek projede burası mevcut SQL executor / query layer'a bağlanır.
 * Buradaki tablo isimleri ve örnek kayıtlar sadece anlatım amaçlıdır.
 */
export class DemoDataSource implements DocumentDataSource {
  async resolve(mapping: TableColumnMapping, _context: ResolveContext): Promise<unknown> {
    if (mapping.deger !== undefined) return mapping.deger;
    if (mapping.varsayilan !== undefined) return mapping.varsayilan;

    if (mapping.tablo === "TANIM_Kurum" && mapping.sutun === "ad") {
      return "XXX  Belediyesi";
    }
    if (mapping.tablo === "DATA_TeminDosyasi" && mapping.sutun === "dosyaNo") {
      return "2026/15";
    }
    if (mapping.tablo === "DATA_TeminDosyasi" && mapping.sutun === "teslimSuresi") {
      return "30 gün";
    }
    if (mapping.tablo === "DATA_TeminKalem") {
      return [
        { ad: "Bilgisayar", miktar: 5 },
        { ad: "Yazıcı", miktar: 2 }
      ];
    }

    return null;
  }
}
