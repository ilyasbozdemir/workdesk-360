import { ProcessMapping } from "./types";
import {
  formatDateTR,
  toLocativeSuffix,
  toPossessiveSuffix,
} from "../utils/textHelpers";
import {
  formatOfficialEvrakSayisi,
  resolveEvrakSayisi,
} from "./helpers/resolveEvrakSayisi";
import { resolveAntetSatirlari } from "./helpers/resolveAntetSatirlari";
import { resolveFormula } from "./helpers/resolveFormula";
import { resolveTableArray } from "./helpers/resolveTableArray";
import { resolveCommissionMembers } from "./helpers/resolveCommissionMembers";
import { resolveSingleColumn } from "./helpers/resolveSingleColumn";

export {
  formatDateTR,
  formatOfficialEvrakSayisi,
  resolveAntetSatirlari,
  resolveEvrakSayisi,
  resolveFormula,
  toLocativeSuffix,
  toPossessiveSuffix,
};

/**
 * Resolves all variables in a ProcessMapping using database query execution.
 * Production-hardened with query deduplication, automatic cache eviction on failure,
 * single-roundtrip logo extraction and Turkish date normalization.
 */
export async function resolveTemplateData(
  mapping: ProcessMapping,
  activeDosyaId: number,
  rawQueryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  templateId?: string,
): Promise<Record<string, any>> {
  // Query cache with automatic eviction on rejection
  const queryCache = new Map<string, Promise<any[]>>();
  const queryExecutor = (sql: string, params: any[]): Promise<any[]> => {
    const key = `${sql}__${JSON.stringify(params)}`;
    if (!queryCache.has(key)) {
      const p = rawQueryExecutor(sql, params).catch((err) => {
        // Evict failed promise so future attempts or retries can re-execute cleanly
        queryCache.delete(key);
        return Promise.reject(err);
      });
      queryCache.set(key, p);
    }
    return queryCache.get(key)!;
  };

  // Pre-fetch main tables in parallel (only tables actually consumed downstream)
  if (activeDosyaId) {
    queryExecutor("SELECT * FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1", [
      activeDosyaId,
    ]).catch(() => {});
    queryExecutor("SELECT * FROM TANIM_Kurum LIMIT 1", []).catch(() => {});
  }

  const resolvedPayload: Record<string, any> = {};
  let evrakSayisiResolved = false;

  for (const [sablonDegiskeni, rule] of Object.entries(mapping)) {
    // 0. Automatic official evrakSayisi formatting (E-DETSIS-SDP-0001)
    if (sablonDegiskeni === "evrakSayisi" && rule.deger === undefined) {
      resolvedPayload["evrakSayisi"] = await resolveEvrakSayisi(
        activeDosyaId,
        queryExecutor,
      );
      evrakSayisiResolved = true;
      continue;
    }

    // 0.b Automatic institution antet lines formatting
    if (sablonDegiskeni === "antetSatirlari" && !rule.deger) {
      resolvedPayload["antetSatirlari"] = await resolveAntetSatirlari(
        activeDosyaId,
        queryExecutor,
      );
      continue;
    }

    // 1. Static value
    if (rule.deger !== undefined) {
      resolvedPayload[sablonDegiskeni] = rule.deger;
      continue;
    }

    // 2. Formula value
    if (rule.formul) {
      resolvedPayload[sablonDegiskeni] = await resolveFormula(
        rule.formul,
        activeDosyaId,
        queryExecutor,
      );
      continue;
    }

    // 3. Array of objects (e.g. ihtiyacKalemleri)
    if (
      rule.tablo && rule.sutun === "*" && rule.altEslestirme && rule.iliskili_id
    ) {
      await resolveTableArray(
        rule,
        activeDosyaId,
        queryExecutor,
        resolvedPayload,
        sablonDegiskeni,
        templateId,
      );
      continue;
    }

    // 3.5 Commission members
    if (
      sablonDegiskeni === "fiyatKomisyonu" ||
      sablonDegiskeni === "muayeneKomisyonu" ||
      sablonDegiskeni === "komisyon" ||
      sablonDegiskeni === "komisyonUyeleri" ||
      sablonDegiskeni === "gorevlendirilenler"
    ) {
      await resolveCommissionMembers(
        sablonDegiskeni,
        activeDosyaId,
        templateId,
        queryExecutor,
        resolvedPayload,
      );
      continue;
    }

    // 4. Single table columns or JSON array of strings
    if (rule.tablo && rule.sutun && rule.sutun !== "*") {
      await resolveSingleColumn(
        rule,
        sablonDegiskeni,
        activeDosyaId,
        queryExecutor,
        resolvedPayload,
      );
    }
  }

  // Automatic solLogo and sagLogo fallback: Unified single roundtrip query
  if (!resolvedPayload["solLogo"] || !resolvedPayload["sagLogo"]) {
    try {
      const res = await queryExecutor(
        "SELECT logo_sol, logo_sag FROM TANIM_Kurum LIMIT 1",
        [],
      );
      const row = res?.[0];
      if (row) {
        if (!resolvedPayload["solLogo"] && row.logo_sol) {
          const clean = String(row.logo_sol).replace(/['"]+/g, "").trim();
          if (clean) resolvedPayload["solLogo"] = row.logo_sol;
        }
        if (!resolvedPayload["sagLogo"] && row.logo_sag) {
          const clean = String(row.logo_sag).replace(/['"]+/g, "").trim();
          if (clean) resolvedPayload["sagLogo"] = row.logo_sag;
        }
      }
    } catch (err) {
      console.warn(
        "[resolveTemplateData] Kurum logoları çekilemedi:",
        err instanceof Error ? err.message : String(err),
      );
    }

    // Fallback: settings table for both left & right logos in a single query
    if (!resolvedPayload["solLogo"] || !resolvedPayload["sagLogo"]) {
      try {
        const ayarRes = await queryExecutor(
          "SELECT key, value FROM settings WHERE key IN ('logoLeft', 'sol_logo', 'logoRight', 'sag_logo')",
          [],
        );
        if (!resolvedPayload["solLogo"]) {
          const logoVal = ayarRes?.find((r: any) =>
            r.key === "logoLeft" || r.key === "sol_logo"
          )?.value;
          const clean = logoVal
            ? String(logoVal).replace(/['"]+/g, "").trim()
            : "";
          if (clean) resolvedPayload["solLogo"] = logoVal;
        }
        if (!resolvedPayload["sagLogo"]) {
          const logoVal = ayarRes?.find((r: any) =>
            r.key === "logoRight" || r.key === "sag_logo"
          )?.value;
          const clean = logoVal
            ? String(logoVal).replace(/['"]+/g, "").trim()
            : "";
          if (clean) resolvedPayload["sagLogo"] = logoVal;
        }
      } catch (err) {
        console.warn(
          "[resolveTemplateData] Ayarlar tablosundan logolar çekilemedi:",
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }

  // Format all date variables into Turkish GG.AA.YYYY format & fallback to file date
  let defaultFileDate = "";
  try {
    const dRes = await queryExecutor(
      "SELECT dosya_acilis_tarihi, temin_tarihi, created_at FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1",
      [activeDosyaId],
    );
    if (dRes && dRes.length > 0) {
      defaultFileDate = formatDateTR(
        dRes[0].dosya_acilis_tarihi || dRes[0].temin_tarihi ||
          dRes[0].created_at,
      );
    }
  } catch (err) {
    console.warn(
      "[resolveTemplateData] Dosya tarihi çekilemedi:",
      err instanceof Error ? err.message : String(err),
    );
  }

  for (const key of Object.keys(resolvedPayload)) {
    let val = resolvedPayload[key];
    if (
      key.toLowerCase().includes("tarih") &&
      (!val || String(val).trim() === "" ||
        String(val).startsWith("[Belirtilmedi"))
    ) {
      resolvedPayload[key] = defaultFileDate || formatDateTR(new Date());
    } else if (
      typeof val === "string" &&
      (/^\d{4}-\d{2}-\d{2}/.test(val) || key.toLowerCase().includes("tarih"))
    ) {
      resolvedPayload[key] = formatDateTR(val);
    }
  }

  // Ensure official EBYS / E-DETSİS evrakSayisi format (E-10234521-934.01-0001) is populated for all templates
  if (
    !evrakSayisiResolved ||
    !resolvedPayload["evrakSayisi"] ||
    String(resolvedPayload["evrakSayisi"]).trim() === "" ||
    String(resolvedPayload["evrakSayisi"]).includes("/")
  ) {
    resolvedPayload["evrakSayisi"] = await resolveEvrakSayisi(
      activeDosyaId,
      queryExecutor,
    );
  }
  if (!resolvedPayload["evrakNo"]) {
    resolvedPayload["evrakNo"] = resolvedPayload["evrakSayisi"];
  }

  return resolvedPayload;
}
