import type { TableColumnMapping } from "../types";

/**
 * İzin verilen güvenli SQLite tabloları allowlist'i.
 * SQL Identifier Injection saldırılarını önlemek için zorunludur.
 */
export const ALLOWED_TABLES = new Set([
  "DATA_TeminKalem",
  "DATA_TeminFirma",
  "DATA_TeminKomisyon",
  "DATA_TeminKomisyonUye",
  "DATA_TeminKalemTeklif",
  "DATA_TeminDosyasi",
  "DATA_IhtiyacRaporu",
  "DATA_TeminBelgeSnapshot",
  "DATA_TeminFatura",
  "TANIM_Kalem",
  "TANIM_Firma",
  "TANIM_Personel",
  "TANIM_Kurum",
  "TANIM_Birim",
]);

/**
 * İzin verilen güvenli kolon adları allowlist'i.
 */
export const ALLOWED_COLUMNS = new Set([
  "id",
  "temin_dosya_id",
  "dosya_id",
  "rapor_id",
  "komisyon_id",
  "sira_no",
  "kalem_adi",
  "tasinir_kodu",
  "poz_no",
  "hizmet_kodu",
  "miktar",
  "birim",
  "birimi",
  "olcu_birimi",
  "kdv_orani",
  "aciklama",
  "ozelligi",
  "poz_tanimi",
  "unvan",
  "ad_soyad",
  "gorev",
  "gorevi",
  "komisyon_gorevi",
  "komisyon_turu",
  "karar_no",
  "karar_tarihi",
  "asil_yedek",
  "firma_id",
  "firma_unvani",
  "vergi_no",
  "adres",
  "telefon",
  "eposta",
  "email",
  "personel_id",
  "sicil_no",
  "tckn",
  "teklif_tutari",
  "birim_fiyat",
  "kdv_haric_toplam",
  "para_birimi",
  "temin_kalem_id",
  "temin_firma_id",
  "created_at",
  "updated_at",
  "is_deleted",
]);

/**
 * Şablon hesaplamaları ile doldurulan sanal alanlar.
 */
const VIRTUAL_COLUMNS = new Set([
  "firmaTeklifleriDetay",
  "enUygunFirmaAdi",
  "enDusukFiyat",
  "toplamBedel",
  "teklifler",
  "kalemler",
  "items",
  "ozelligi",
  "malzemeAdi",
  "kalemAdi",
  "siraNo",
  "kodu",
  "tasinirKodu",
  "pozNo",
  "hizmetKodu",
  "birimi",
  "olcuBirimi",
  "kdvOrani",
]);

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * SQL identifier (tablo/kolon) güvenlik doğrulaması.
 */
export function assertSafeIdentifier(
  name: string | undefined,
  type: "table" | "column",
): string {
  if (!name || typeof name !== "string" || !IDENTIFIER_REGEX.test(name.trim())) {
    throw new Error(
      `[resolveTableArray] Güvenlik Hatası: Geçersiz veya güvensiz ${
        type === "table" ? "tablo" : "kolon"
      } adı: "${name}"`,
    );
  }

  const clean = name.trim();
  const allowedSet = type === "table" ? ALLOWED_TABLES : ALLOWED_COLUMNS;

  if (type === "column" && VIRTUAL_COLUMNS.has(clean)) {
    return clean;
  }

  if (!allowedSet.has(clean)) {
    throw new Error(
      `[resolveTableArray] Güvenlik Hatası: İzin verilmeyen veya bilinmeyen ${
        type === "table" ? "tablo" : "kolon"
      }: "${clean}"`,
    );
  }

  return clean;
}

/**
 * Fiyat ayrıştırma ve doğrulama.
 * Negatif, NaN, sonsuz veya NULL değerler filtrelenir.
 */
function parseValidPrice(raw: any): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    if (isNaN(raw) || !isFinite(raw) || raw < 0) return null;
    return raw;
  }
  let str = String(raw).trim();
  if (!str) return null;
  if (str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num) || num < 0) return null;
  return num;
}

/**
 * Sayısal miktar ayrıştırma ve doğrulama.
 */
function parseValidQuantity(raw: any): number {
  if (raw === null || raw === undefined || raw === "") return 1;
  if (typeof raw === "number") {
    if (isNaN(raw) || !isFinite(raw) || raw < 0) return 0;
    return raw;
  }
  let str = String(raw).trim();
  if (!str) return 1;
  if (str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num) || num < 0) return 0;
  return num;
}

/**
 * Türkçe para formatı (Intl.NumberFormat tr-TR).
 */
export const formatTR = (val: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

/**
 * Çoklu satır içeren belge tablolarını (örneğin ihtiyaç kalemleri, teklif cetvelleri)
 * SQL enjeksiyon korumalı, deterministik ve veri bütünlüğünü garanti eden motorla çözer.
 */
export async function resolveTableArray(
  rule: TableColumnMapping,
  activeDosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  resolvedPayload: Record<string, any>,
  sablonDegiskeni: string,
  templateId?: string,
): Promise<void> {
  // 1. SQL Güvenlik ve Doğrulama
  const safeTable = assertSafeIdentifier(rule.tablo, "table");
  const rawIliskiliId =
    rule.iliskili_id !== undefined && rule.iliskili_id !== ""
      ? rule.iliskili_id
      : "temin_dosya_id";
  const safeIliskiliId = assertSafeIdentifier(rawIliskiliId, "column");

  if (rule.altEslestirme) {
    for (const [_, dbCol] of Object.entries(rule.altEslestirme)) {
      if (typeof dbCol === "string") {
        assertSafeIdentifier(dbCol, "column");
      }
    }
  }

  // 2. Tablo Verisini Çekme
  let rows: any[] = [];
  if (safeTable === "DATA_TeminKalem") {
    try {
      // Deterministic correlated subqueries with strict priority:
      // Priority 1: tasinir_kodu match (ordered deterministically by tanim.id ASC)
      // Priority 2: kalem_adi match (ordered deterministically by tanim.id ASC)
      // Fallback: empty string
      // Because this is a correlated scalar subquery in SELECT, Cartesian multiplication is impossible.
      const tkQuery = `
        SELECT tk.*, 
               COALESCE(
                 NULLIF(tk.aciklama, ''),
                 (SELECT tanim.ozelligi FROM TANIM_Kalem tanim 
                  WHERE tk.tasinir_kodu IS NOT NULL AND tk.tasinir_kodu != '' AND tanim.tasinir_kodu = tk.tasinir_kodu
                  ORDER BY tanim.id ASC LIMIT 1),
                 (SELECT tanim.ozelligi FROM TANIM_Kalem tanim 
                  WHERE tk.kalem_adi IS NOT NULL AND tk.kalem_adi != '' AND tanim.kalem_adi = tk.kalem_adi
                  ORDER BY tanim.id ASC LIMIT 1),
                 ''
               ) as aciklama,
               COALESCE(
                 NULLIF(tk.aciklama, ''),
                 (SELECT tanim.ozelligi FROM TANIM_Kalem tanim 
                  WHERE tk.tasinir_kodu IS NOT NULL AND tk.tasinir_kodu != '' AND tanim.tasinir_kodu = tk.tasinir_kodu
                  ORDER BY tanim.id ASC LIMIT 1),
                 (SELECT tanim.ozelligi FROM TANIM_Kalem tanim 
                  WHERE tk.kalem_adi IS NOT NULL AND tk.kalem_adi != '' AND tanim.kalem_adi = tk.kalem_adi
                  ORDER BY tanim.id ASC LIMIT 1),
                 ''
               ) as ozelligi
        FROM DATA_TeminKalem tk
        WHERE tk.temin_dosya_id = ?
        ORDER BY tk.id ASC
      `;
      rows = await queryExecutor(tkQuery, [activeDosyaId]);
    } catch (subqueryErr) {
      const errMsg =
        subqueryErr instanceof Error ? subqueryErr.message : String(subqueryErr);
      const isMissingTanim =
        errMsg.includes("no such table") || errMsg.includes("no such column");

      if (isMissingTanim) {
        console.warn(
          `[resolveTableArray] TANIM_Kalem tablosu veya kolonu bulunamadı, doğrudan SELECT ile devam ediliyor:`,
          errMsg,
        );
        rows = await queryExecutor(
          `SELECT * FROM ${safeTable} WHERE ${safeIliskiliId} = ? ORDER BY id ASC`,
          [activeDosyaId],
        );
      } else {
        // Beklenmeyen kritik SQL / bağlantı hatası fırlatılır
        console.error(
          `[resolveTableArray] Kritik Veritabanı Hatası: Kalem sorgusu yürütülemedi:`,
          errMsg,
        );
        throw subqueryErr;
      }
    }
  } else {
    rows = await queryExecutor(
      `SELECT * FROM ${safeTable} WHERE ${safeIliskiliId} = ? ORDER BY id ASC`,
      [activeDosyaId],
    );
  }

  // 3. Firma ve Teklif İhtiyacı Tespiti
  let firms: any[] = [];
  const bidsMap: Record<string, number> = {};

  const isLuzumOrIhtiyac = templateId &&
    (templateId.includes("luzum") ||
      templateId.includes("ihtiyac") ||
      templateId.includes("teknik_sartname") ||
      templateId.includes("tasinir"));

  const needsFirms = !isLuzumOrIhtiyac &&
    safeTable === "DATA_TeminKalem" &&
    ((rule as any).teklifleriDahilEt ||
      (rule.altEslestirme &&
        ("firmaTeklifleriDetay" in rule.altEslestirme ||
          "enUygunFirmaAdi" in rule.altEslestirme ||
          "enDusukFiyat" in rule.altEslestirme ||
          "teklifler" in rule.altEslestirme)) ||
      (templateId &&
        (templateId.includes("piyasa") ||
          templateId.includes("yaklasik") ||
          templateId.includes("teklif") ||
          templateId.includes("fiyat") ||
          templateId.includes("kabul"))));

  if (needsFirms) {
    try {
      const firmQuery = `SELECT df.id as temin_firma_id,
                                COALESCE(NULLIF(df.unvan, ''), NULLIF(f.unvan, ''), 'İstekli Firma') as unvan
                         FROM DATA_TeminFirma df
                         LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
                         WHERE df.temin_dosya_id = ?
                         ORDER BY df.id ASC`;
      firms = await queryExecutor(firmQuery, [activeDosyaId]);
      if (firms && firms.length > 0) {
        resolvedPayload["firmalar"] = firms.map((f: any) => ({
          unvan: f.unvan,
        }));
      }

      const bidQuery =
        `SELECT temin_kalem_id, temin_firma_id, birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ? ORDER BY id ASC`;
      const bidRows = await queryExecutor(bidQuery, [activeDosyaId]);

      const validKalemIds = new Set(rows.map((r: any) => Number(r.id)));
      const validFirmaIds = new Set(firms.map((f: any) => Number(f.temin_firma_id)));

      (bidRows || []).forEach((b: any) => {
        const kalemId = Number(b.temin_kalem_id);
        const firmaId = Number(b.temin_firma_id);
        if (!kalemId || !firmaId) return;

        // Dosya dışı veya ilişkisiz kalem/firma tekliflerini filtrele (Data Integrity)
        if (!validKalemIds.has(kalemId) || !validFirmaIds.has(firmaId)) {
          console.warn(
            `[resolveTableArray] Veri Bütünlüğü Uyarısı: Dosya dışı veya geçersiz kalem/firma teklifi filtrelendi (Kalem: ${kalemId}, Firma: ${firmaId})`,
          );
          return;
        }

        const price = parseValidPrice(b.birim_fiyat);
        const key = `${kalemId}_${firmaId}`;

        if (price !== null) {
          if (bidsMap[key] !== undefined) {
            console.warn(
              `[resolveTableArray] Mükerrer Teklif Tespiti: Kalem #${kalemId} ve Firma #${firmaId} için mükerrer teklif kaydı bulundu. Deterministik en düşük fiyat korunuyor.`,
            );
            // Mükerrer teklif varsa deterministik olarak geçerli en düşük fiyatı koru
            if (price < bidsMap[key]) {
              bidsMap[key] = price;
            }
          } else {
            bidsMap[key] = price;
          }
        }
      });
    } catch (firmErr) {
      const errMsg = firmErr instanceof Error ? firmErr.message : String(firmErr);
      const isMissingTable =
        errMsg.includes("no such table") || errMsg.includes("no such column");

      if (isMissingTable) {
        console.warn(
          `[resolveTableArray] Firma/teklif tablosu bulunamadı, fallback modunda devam ediliyor:`,
          errMsg,
        );
      } else {
        // Beklenmeyen kritik SQL / bağlantı hatası fırlatılır
        console.error(
          `[resolveTableArray] Kritik Veritabanı Hatası: Firma veya teklif sorgusu yürütülemedi:`,
          errMsg,
        );
        throw firmErr;
      }
    }
  }

  const firmTotals: number[] = (firms || []).map(() => 0);

  // 4. Payload Alanlarının Dönüştürülmesi
  resolvedPayload[sablonDegiskeni] = rows.map((row: any, idx: number) => {
    const defaultMiktar = parseValidQuantity(row.miktar);

    const item: Record<string, any> = {
      ...row,
      id: row.id,
      siraNo: row.sira_no || idx + 1,
      kodu: row.poz_no || row.tasinir_kodu || row.hizmet_kodu || "",
      tasinirKodu: row.tasinir_kodu || "",
      pozNo: row.poz_no || "",
      hizmetKodu: row.hizmet_kodu || "",
      malzemeAdi: row.kalem_adi || "",
      kalemAdi: row.kalem_adi || "",
      imalatAdi: row.kalem_adi || "",
      hizmetAdi: row.kalem_adi || "",
      danismanlikKonusu: row.kalem_adi || "",
      ozelligi: row.poz_tanimi || row.aciklama || "",
      teknikTarifi: row.poz_tanimi || row.aciklama || "",
      aciklama: row.aciklama || "",
      birimi: row.olcu_birimi || row.birim || "Adet",
      birim: row.olcu_birimi || row.birim || "Adet",
      olcuBirimi: row.olcu_birimi || row.birim || "Adet",
      kdvOrani: row.kdv_orani !== undefined && row.kdv_orani !== null
        ? Number(row.kdv_orani)
        : 20,
      miktar: defaultMiktar,
    };

    if (rule.altEslestirme) {
      for (const [templateKey, dbColumn] of Object.entries(rule.altEslestirme)) {
        item[templateKey] = row[dbColumn] ?? row[templateKey] ??
          item[templateKey] ?? "";
      }
    }

    if (!item.ozelligi || item.ozelligi === "") {
      item.ozelligi = row.poz_tanimi || row.aciklama || row.ozelligi || "";
    }
    if (!item.malzemeAdi || item.malzemeAdi === "") {
      item.malzemeAdi = row.kalem_adi || row.malzemeAdi || "";
    }
    if (!item.birimi || item.birimi === "") {
      item.birimi = row.olcu_birimi || row.birim || row.birimi || "Adet";
    }
    if (!item.kodu || item.kodu === "") {
      item.kodu = row.poz_no || row.tasinir_kodu || row.hizmet_kodu ||
        row.kodu || "-";
    }
    if (item.miktar === undefined || item.miktar === null || item.miktar === "") {
      item.miktar = defaultMiktar;
    }

    // 5. Firma Teklifleri ve En Düşük Fiyat Analizi
    if (safeTable === "DATA_TeminKalem" && needsFirms) {
      if (firms && firms.length > 0) {
        let minPrice = Infinity;
        let minIdx = -1;

        const firmaTeklifleriDetay = firms.map((f: any, fIdx: number) => {
          const rawPrice = bidsMap[`${row.id}_${f.temin_firma_id}`];
          const price =
            typeof rawPrice === "number" && isFinite(rawPrice) && rawPrice > 0
              ? rawPrice
              : 0;

          const rowMiktar = parseValidQuantity(row.miktar ?? item.miktar);
          const total = Math.round(price * rowMiktar * 100) / 100;

          if (price > 0) {
            firmTotals[fIdx] = Math.round((firmTotals[fIdx] + total) * 100) / 100;

            // Deterministik en düşük seçim:
            // price < minPrice ise güncellenir.
            // Eşitlik durumunda ilk firma (düşük index/ID) deterministik olarak korunur.
            if (price < minPrice) {
              minPrice = price;
              minIdx = fIdx;
            }
          }

          return {
            birimFiyat: price > 0 ? formatTR(price) : "-",
            tutar: total > 0 ? formatTR(total) : "-",
          };
        });

        item["firmaTeklifleriDetay"] = firmaTeklifleriDetay;

        if (minIdx !== -1 && firms[minIdx]) {
          const rowMiktar = parseValidQuantity(row.miktar ?? item.miktar);
          const itemTotal = Math.round(minPrice * rowMiktar * 100) / 100;

          item["enUygunFirmaAdi"] = firms[minIdx].unvan;
          item["enDusukFiyat"] = formatTR(minPrice);
          item["toplamBedel"] = formatTR(itemTotal);
        } else {
          item["enUygunFirmaAdi"] = item["enUygunFirmaAdi"] || "-";
          item["enDusukFiyat"] = item["enDusukFiyat"] || "-";
          item["toplamBedel"] = item["toplamBedel"] || "-";
        }
      } else {
        item["enUygunFirmaAdi"] = "-";
        item["enDusukFiyat"] = "-";
        item["toplamBedel"] = "-";
        item["firmaTeklifleriDetay"] = [];
      }
    }

    return item;
  });

  // 6. Firma Toplamları
  if (safeTable === "DATA_TeminKalem" && firms && firms.length > 0) {
    resolvedPayload["firmaToplamlariDetay"] = firmTotals.map((tot: number) => ({
      toplam: tot > 0 ? formatTR(tot) : "-",
    }));
  }

  // 7. Geriye Dönük Uyumluluk Alias'ları
  if (sablonDegiskeni === "ihtiyacKalemleri") {
    resolvedPayload["kalemler"] = resolvedPayload[sablonDegiskeni];
    resolvedPayload["items"] = resolvedPayload[sablonDegiskeni];
  }
}
