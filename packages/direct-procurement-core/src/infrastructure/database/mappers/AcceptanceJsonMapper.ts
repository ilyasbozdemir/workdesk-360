import { AcceptanceRecord } from "../../../domain/file/AcceptanceRecord";

/**
 * Uygulamanın KabulTutanakItem biçimindeki mal kalemi JSON yapısı.
 * `DATA_TeminDosyasi.sablon_tercihleri.kabulTutanaklari[].kalemler` dizisinde saklanır.
 */
export interface MalKalemiJson {
  /** Mal kalemi sıra no (1-tabanlı) */
  siraNo: number;
  /** Malzemenin adı */
  malzemeAdi: string;
  /** Varsa teknik özelliği */
  ozelligi: string;
  /** Ölçü birimi (Adet, Kg, Metre vb.) */
  birimi: string;
  /** İhtiyaç duyulan toplam miktar */
  miktari: number;
  /** Önceki tutanaklarda teslim alınmış toplam miktar */
  oncekiTeslimAlinan?: number;
  /** Bu tutanak dahil kümülatif teslim alınan miktar */
  toplamTeslimAlinan: number;
  /** Bu tutanak ile muayene ve kabulü yapılan miktar */
  kabulMiktari: number;
  [k: string]: unknown;
}

/**
 * `DATA_TeminDosyasi.sablon_tercihleri.kabulTutanaklari` içinde saklanan kabul tutanağı JSON nesnesi.
 */
export interface KabulTutanakJson {
  /** Benzersiz tutanak kimlik metni (Örn: "kt-275-1") */
  id: string;
  /** Resmi evrak tutanak no (Örn: "KT-2025-001") */
  tutanakNo: string;
  /** Tutanak tarihi (YYYY-AA-GG) */
  tutanakTarihi: string;
  /** Kabul değerlendirme durumu */
  durum: "kabul" | "kismi" | "sartli" | "red";
  /** Tutanak onaylandı mı? */
  onaylandi?: boolean;
  /** Onay tarihi */
  onayTarihi?: string;
  /** Muayenesi yapılan mal kalemleri */
  kalemler?: MalKalemiJson[];
  [k: string]: unknown;
}

/**
 * Kabul tutanakları ile ihtiyaç kalemlerini eşlemek için kullanılan referans arayüzü.
 */
export interface ItemRef {
  /** Kalem ID */
  id: number;
  /** Kalem sıra no */
  siraNo: number;
  /** Kalem adı */
  name: string;
  /** Ölçü birimi */
  unit: string;
  /** Toplam ihtiyaç miktarı */
  quantity: number;
}

/**
 * JSON formatındaki kabul tutanaklarını etki alanı `AcceptanceRecord` nesnelerine dönüştürür.
 *
 * @remarks
 * Kimlik kuralı: JSON dizisindeki sıra indeksi (`index + 1`) aggregate'teki `seqNo` değeridir.
 * Bir tutanak onaylı sayılması için `onaylandi === true` olmalı ve `durum !== 'red'` şartını sağlamalıdır.
 *
 * @param json - Veritabanından okunan JSON kabul tutanakları dizisi.
 * @param items - Dosyaya ait ihtiyaç kalemleri referansları.
 * @returns Yeniden oluşturulmuş `AcceptanceRecord` nesneleri listesi.
 */
export function acceptancesFromJson(
  json: readonly KabulTutanakJson[],
  items: readonly ItemRef[],
): AcceptanceRecord[] {
  const bySira = new Map(items.map((i) => [i.siraNo, i.id]));
  return json.map((t, i) => {
    const lines = (t.kalemler ?? []).flatMap((k) => {
      const itemId = bySira.get(k.siraNo);
      return itemId !== undefined && k.kabulMiktari > 0
        ? [{ itemId, quantity: k.kabulMiktari }]
        : [];
    });
    const approved = t.onaylandi === true && t.durum !== "red";
    return AcceptanceRecord.restore(
      i + 1,
      t.tutanakTarihi ?? "",
      lines,
      approved ? "approved" : "draft",
      t.onayTarihi,
    );
  });
}

/**
 * Etki alanında güncellenen `AcceptanceRecord` tutanaklarını mevcut JSON yapısıyla birleştirir.
 *
 * @remarks
 * Akıllı birleştirme kuralları:
 * - Var olan kayıtta yalnızca onay durumu ve onay tarihi güncellenir; UI'a ait diğer alanlar (fatura, irsaliye vb.) korunur.
 * - Aggregate üzerinde yeni eklenen tutanaklar UI biçimine uygun kimlik ve numara şablonuyla (`KT-yyyy-nnn`) eklenir.
 * - Kümülatif teslim alınan miktarlar ve önceki teslimat geçmişi otomatik hesaplanır.
 *
 * @param existing - Mevcut JSON kabul tutanakları dizisi.
 * @param records - Etki alanındaki güncel `AcceptanceRecord` listesi.
 * @param items - İhtiyaç kalemleri listesi.
 * @param dosyaId - Temin dosya ID.
 * @returns Veritabanına yazılacak nihai JSON kabul tutanakları listesi.
 */
export function acceptancesToJson(
  existing: readonly KabulTutanakJson[],
  records: readonly AcceptanceRecord[],
  items: readonly ItemRef[],
  dosyaId: number,
): KabulTutanakJson[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: KabulTutanakJson[] = [];

  for (let i = 0; i < Math.max(existing.length, records.length); i++) {
    const rec = records.find((r) => r.seqNo === i + 1);
    const base = existing[i];

    if (base) {
      if (
        !rec || rec.status !== "approved" ||
        (base.onaylandi === true && base.durum !== "red")
      ) out.push(base);
      else {out.push({
          ...base,
          onaylandi: true,
          onayTarihi: rec.approvedAt ?? base.onayTarihi,
        });}
      continue;
    }
    if (!rec) continue;

    // yeni kayıt: önceki onaylı teslimleri hesapla
    const prior = new Map<number, number>();
    for (const r of records) {
      if (r.seqNo >= rec.seqNo || r.status !== "approved") continue;
      r.lines.forEach((l) =>
        prior.set(l.itemId, (prior.get(l.itemId) ?? 0) + l.quantity)
      );
    }
    const kalemler: MalKalemiJson[] = rec.lines.flatMap((l) => {
      const it = byId.get(l.itemId);
      if (!it) return [];
      const before = prior.get(l.itemId) ?? 0;
      return [{
        siraNo: it.siraNo,
        malzemeAdi: it.name,
        ozelligi: "",
        birimi: it.unit,
        miktari: it.quantity,
        oncekiTeslimAlinan: before,
        toplamTeslimAlinan: before + l.quantity,
        kabulMiktari: l.quantity,
      }];
    });
    const year = (rec.date || "").slice(0, 4) ||
      String(new Date().getFullYear());
    out.push({
      id: `kt-${dosyaId}-${rec.seqNo}`,
      tutanakNo: `KT-${year}-${String(rec.seqNo).padStart(3, "0")}`,
      tutanakTarihi: rec.date,
      durum: "kabul",
      onaylandi: rec.status === "approved",
      ...(rec.approvedAt ? { onayTarihi: rec.approvedAt } : {}),
      kalemler,
      created_at: rec.date,
    });
  }
  return out;
}
