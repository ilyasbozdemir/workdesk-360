import { AcceptanceRecord } from "../../domain/file/AcceptanceRecord";

/**
 * Uygulamanın KabulTutanakItem biçimi (DATA_TeminDosyasi.sablon_tercihleri.kabulTutanaklari).
 * Yalnızca burada kullandığımız alanlar tiplendi; diğer alanlar (fatura, irsaliye, islenmisMi ...)
 * olduğu gibi KORUNUR, çünkü onları mevcut ekranlar yönetir.
 */
export interface MalKalemiJson {
  siraNo: number;
  malzemeAdi: string;
  ozelligi: string;
  birimi: string;
  miktari: number;
  oncekiTeslimAlinan?: number;
  toplamTeslimAlinan: number;
  kabulMiktari: number;
  [k: string]: unknown;
}
export interface KabulTutanakJson {
  id: string;
  tutanakNo: string;
  tutanakTarihi: string;
  durum: "kabul" | "kismi" | "sartli" | "red";
  onaylandi?: boolean;
  onayTarihi?: string;
  kalemler?: MalKalemiJson[];
  [k: string]: unknown;
}

export interface ItemRef {
  id: number;
  siraNo: number;
  name: string;
  unit: string;
  quantity: number;
}

/**
 * Kimlik kuralı: JSON dizisindeki SIRA (index+1) = aggregate'teki seqNo.
 * (UI da numarayı `uzunluk + 1` ile üretiyor.) Onaylı sayılma: onaylandi=true ve durum 'red' değil.
 * Kalem eşlemesi: MalKalemiItem.siraNo ↔ DATA_TeminKalem.sira_no.
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
 * Aggregate'in güncel tutanaklarını mevcut JSON'a birleştirir:
 *  - var olan kayıtta yalnızca onay durumu/tarihi güncellenir, diğer tüm alanlar korunur;
 *  - yeni kayıt (aggregate'te açılmış) UI'nin biçimiyle eklenir (KT-yyyy-nnn).
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
