import type { TableColumnMapping } from "../types";
import { toLocativeSuffix, toPossessiveSuffix } from "../../utils/textHelpers";

export async function resolveSingleColumn(
  rule: TableColumnMapping,
  sablonDegiskeni: string,
  activeDosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  resolvedPayload: Record<string, any>,
): Promise<void> {
  try {
    const effectiveRule = { ...rule };
    // Smart normalization for TANIM_Kurum columns
    if (effectiveRule.tablo === "TANIM_Kurum") {
      if (effectiveRule.sutun === "ust_idari_birim") {
        effectiveRule.sutun = "ust_kurum_adi";
      }
    }

    // Smart normalization for DATA_TeminDosyasi columns
    if (effectiveRule.tablo === "DATA_TeminDosyasi") {
      if (effectiveRule.sutun === "hazirlayan_personel_ad") {
        effectiveRule.sutun = "hazirlayan_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "ad_soyad";
      } else if (effectiveRule.sutun === "hazirlayan_personel_unvan") {
        effectiveRule.sutun = "hazirlayan_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "unvan";
      } else if (effectiveRule.sutun === "hazirlayan_telefon") {
        effectiveRule.sutun = "hazirlayan_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "telefon";
      } else if (effectiveRule.sutun === "onaylayan_personel_ad") {
        effectiveRule.sutun = "onay_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "ad_soyad";
      } else if (effectiveRule.sutun === "onaylayan_personel_unvan") {
        effectiveRule.sutun = "onay_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "unvan";
      } else if (effectiveRule.sutun === "onaylayan_personel_id") {
        effectiveRule.sutun = "onay_personel_id";
      } else if (effectiveRule.sutun === "kazanan_firma_id") {
        effectiveRule.sutun = "firma_id";
      } else if (effectiveRule.sutun === "olusturma_tarihi") {
        effectiveRule.sutun = "dosya_acilis_tarihi";
      } else if (effectiveRule.sutun === "temin_no_clean") {
        effectiveRule.sutun = "temin_no";
      } else if (effectiveRule.sutun === "talep_eden_personel_ad") {
        effectiveRule.sutun = "talep_eden_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "ad_soyad";
      } else if (effectiveRule.sutun === "talep_eden_personel_unvan") {
        effectiveRule.sutun = "talep_eden_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "unvan";
      } else if (effectiveRule.sutun === "talep_eden_telefon") {
        effectiveRule.sutun = "talep_eden_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "telefon";
      } else if (effectiveRule.sutun === "sunan_personel_ad") {
        effectiveRule.sutun = "sunan_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "ad_soyad";
      } else if (effectiveRule.sutun === "sunan_personel_unvan") {
        effectiveRule.sutun = "sunan_personel_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "unvan";
      } else if (
        effectiveRule.sutun === "sunan_telefon" ||
        effectiveRule.sutun === "irtibat_telefon"
      ) {
        effectiveRule.sutun = "irtibat_yetkilisi_id";
        effectiveRule.iliskiliTablo = "TANIM_Personel";
        effectiveRule.iliskiliSutun = "telefon";
      } else if (effectiveRule.sutun === "isin_suresi") {
        effectiveRule.sutun = "teslim_tarihi";
      } else if (effectiveRule.sutun === "ihale_usulu") {
        effectiveRule.sutun = "ihale_sekli";
      } else if (effectiveRule.sutun === "odenek_tutari") {
        effectiveRule.sutun = "yaklasik_maliyet";
      } else if (effectiveRule.sutun === "butce_tertibi") {
        effectiveRule.sutun = "ekonomik_kod";
      } else if (effectiveRule.sutun === "alim_turu") {
        effectiveRule.sutun = "tur";
      } else if (
        effectiveRule.sutun === "onay_tarihi" ||
        effectiveRule.sutun === "dosya_tarihi"
      ) {
        effectiveRule.sutun = "dosya_acilis_tarihi";
      } else if (effectiveRule.sutun === "isin_gerekcesi") {
        effectiveRule.sutun = "isin_aciklamasi";
      }
    }

    let query = "";
    let params: any[] = [];

    if (effectiveRule.iliskiliTablo && effectiveRule.iliskiliSutun) {
      query =
        `SELECT p.${effectiveRule.iliskiliSutun} AS res_val FROM ${effectiveRule.tablo} d LEFT JOIN ${effectiveRule.iliskiliTablo} p ON d.${effectiveRule.sutun} = p.id WHERE d.id = ? LIMIT 1`;
      params = [activeDosyaId];
    } else if (effectiveRule.iliskili_id) {
      query =
        `SELECT ${effectiveRule.sutun} AS res_val FROM ${effectiveRule.tablo} WHERE ${effectiveRule.iliskili_id} = ? LIMIT 1`;
      params = [activeDosyaId];
    } else if (
      effectiveRule.tablo &&
      effectiveRule.tablo.toLowerCase().startsWith("data_")
    ) {
      query =
        `SELECT ${effectiveRule.sutun} AS res_val FROM ${effectiveRule.tablo} WHERE id = ? LIMIT 1`;
      params = [activeDosyaId];
    } else {
      query =
        `SELECT ${effectiveRule.sutun} AS res_val FROM ${effectiveRule.tablo} LIMIT 1`;
    }

    const res = await queryExecutor(query, params);
    const firstRow = res?.[0];
    const sutunKey = effectiveRule.sutun as string | undefined;
    const iliskiliKey = effectiveRule.iliskiliSutun as string | undefined;
    let rawValue = firstRow?.res_val !== undefined
      ? firstRow.res_val
      : sutunKey && firstRow?.[sutunKey] !== undefined
      ? firstRow[sutunKey]
      : iliskiliKey && firstRow?.[iliskiliKey] !== undefined
      ? firstRow[iliskiliKey]
      : undefined;

    // Dynamic fallback for sunulacakMakamAdi: First check DATA_TeminDosyasi, then TANIM_Kurum
    if (sablonDegiskeni === "sunulacakMakamAdi") {
      try {
        let kurumRow: any = null;
        const kRes = await queryExecutor(
          "SELECT kurum_adi, ust_kurum_adi, makam_adi, sunulacak_makam_secimi, sunulacak_kurum_adi, makam_adi_custom FROM TANIM_Kurum LIMIT 1",
          [],
        );
        if (kRes?.[0]) {
          kurumRow = kRes[0];
        }

        const secim = kurumRow?.sunulacak_makam_secimi || "makam";
        const activeKurumMakam = secim === "kurum"
          ? (kurumRow?.sunulacak_kurum_adi || kurumRow?.makam_adi || kurumRow?.kurum_adi || "")
          : (kurumRow?.makam_adi_custom || kurumRow?.makam_adi || (kurumRow?.kurum_adi ? `${kurumRow.kurum_adi} MAKAMINA` : ""));

        let dosyaMakam = rawValue ? String(rawValue).trim() : "";
        if (!dosyaMakam && activeDosyaId) {
          const dRes = await queryExecutor(
            "SELECT sunulacak_makam FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1",
            [activeDosyaId],
          );
          if (
            dRes?.[0]?.sunulacak_makam &&
            String(dRes[0].sunulacak_makam).trim()
          ) {
            dosyaMakam = String(dRes[0].sunulacak_makam).trim();
          }
        }

        // Eğer dosyadaki değer çıplak kurum adıysa (veya boşsa) ve kullanıcı "Makam Adı"nı (örn: GÜNEYYURT BELEDİYE BAŞKANLIK MAKAMINA) seçtiyse aktif makam adını uygula!
        const isBareKurum = Boolean(
          dosyaMakam && (
            dosyaMakam === kurumRow?.kurum_adi ||
            dosyaMakam === kurumRow?.sunulacak_kurum_adi ||
            (kurumRow?.kurum_adi && dosyaMakam.toLowerCase().includes(String(kurumRow.kurum_adi).toLowerCase())) ||
            (kurumRow?.sunulacak_kurum_adi && dosyaMakam.toLowerCase().includes(String(kurumRow.sunulacak_kurum_adi).toLowerCase())) ||
            !dosyaMakam.toUpperCase().includes('MAKAM')
          ),
        );

        if (!dosyaMakam || (secim === "makam" && isBareKurum && activeKurumMakam)) {
          rawValue = activeKurumMakam || dosyaMakam;
        } else {
          rawValue = dosyaMakam;
        }
      } catch (e) {}
    }

    // Smart normalization for alimTuru
    if (
      sablonDegiskeni === "alimTuru" ||
      (effectiveRule.tablo === "DATA_TeminDosyasi" &&
        effectiveRule.sutun === "tur")
    ) {
      const raw = String(rawValue || "").trim().toLowerCase();
      if (raw === "mal" || raw === "malzeme") {
        rawValue = "mal alımı";
      } else if (raw === "hizmet") {
        rawValue = "hizmet alımı";
      } else if (raw === "yapim" || raw === "yapım" || raw === "yapim_isi") {
        rawValue = "yapım işi";
      } else if (raw === "danismanlik" || raw === "danışmanlık") {
        rawValue = "danışmanlık hizmet alımı";
      }
    }

    // Dynamic fallback for aciklama / isinAciklamasi if empty in DATA_TeminDosyasi
    if (
      (sablonDegiskeni === "aciklama" ||
        sablonDegiskeni === "isinAciklamasi") &&
      (!rawValue || String(rawValue).trim() === "")
    ) {
      try {
        const dosyaRes = await queryExecutor(
          "SELECT isin_aciklamasi, konu FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1",
          [activeDosyaId],
        );
        if (dosyaRes?.[0]) {
          rawValue = dosyaRes[0].isin_aciklamasi || dosyaRes[0].konu || "";
        }
      } catch (e) {}
    }

    // Dynamic fallback for ihtiyacYeri from TANIM_Birim or TANIM_Kurum
    if (
      sablonDegiskeni === "ihtiyacYeri" &&
      (!rawValue || String(rawValue).trim() === "" ||
        String(rawValue).trim() === "Müdürlüğümüzün")
    ) {
      try {
        let foundIhtiyacYeri = "";

        if (activeDosyaId) {
          const bRes = await queryExecutor(
            `SELECT d.ihtiyac_yeri, b.ihtiyac_yeri_eki, b.birim_adi 
             FROM DATA_TeminDosyasi d 
             LEFT JOIN TANIM_Birim b ON d.birim_id = b.id 
             WHERE d.id = ? LIMIT 1`,
            [activeDosyaId],
          );
          if (bRes?.[0]) {
            const bRow = bRes[0];
            if (bRow.ihtiyac_yeri && String(bRow.ihtiyac_yeri).trim()) {
              foundIhtiyacYeri = String(bRow.ihtiyac_yeri).trim();
            } else if (
              bRow.ihtiyac_yeri_eki && String(bRow.ihtiyac_yeri_eki).trim()
            ) {
              let parsed = String(bRow.ihtiyac_yeri_eki).trim();
              if (parsed.startsWith("[") && parsed.endsWith("]")) {
                try {
                  const arr = JSON.parse(parsed);
                  if (Array.isArray(arr) && arr.length > 0 && arr[0]) {
                    parsed = arr[0];
                  }
                } catch (e) {}
              }
              if (parsed && parsed !== "[]") {
                foundIhtiyacYeri = parsed;
              }
            }
          }
        }

        if (!foundIhtiyacYeri) {
          const kRes = await queryExecutor(
            "SELECT alt_kurum_bizim, alt_kurum_bulunma, alt_kurum_tipi, kurum_tipi, kurum_adi FROM TANIM_Kurum LIMIT 1",
            [],
          );
          if (kRes?.[0]) {
            const kRow = kRes[0];
            if (
              kRow.alt_kurum_bulunma && String(kRow.alt_kurum_bulunma).trim()
            ) {
              foundIhtiyacYeri = kRow.alt_kurum_bulunma.trim();
            } else if (
              kRow.alt_kurum_bizim && String(kRow.alt_kurum_bizim).trim()
            ) {
              foundIhtiyacYeri = toLocativeSuffix(kRow.alt_kurum_bizim.trim());
            } else if (kRow.alt_kurum_tipi) {
              const map: Record<string, string> = {
                belediye: "Belediyemizde",
                mudurluk: "Müdürlüğümüzde",
                bakanlik: "Bakanlığımızda",
                valilik: "Valiliğimizde",
                kaymakamlik: "Kaymakamlığımızda",
                universite: "Üniversitemizde",
                il_ozel: "İl Özel İdaremizde",
                koy: "Muhtarlığımızda",
                sgk: "Müdürlüğümüzde",
                kurul: "Kurulumuzda",
                diger: "İdaremizde",
              };
              foundIhtiyacYeri = map[kRow.alt_kurum_tipi] || "İdaremizde";
            } else if (kRow.kurum_tipi === "belediye") {
              foundIhtiyacYeri = "Belediyemizde";
            } else if (kRow.kurum_tipi === "ozel_butce") {
              foundIhtiyacYeri = "Üniversitemizde";
            } else if (kRow.kurum_tipi === "duzenleyici") {
              foundIhtiyacYeri = "Kurulumuzda";
            } else if (kRow.kurum_tipi === "genel_butce") {
              foundIhtiyacYeri = "Müdürlüğümüzde";
            } else {
              foundIhtiyacYeri = "İdaremizde";
            }
          }
        }

        if (foundIhtiyacYeri && foundIhtiyacYeri !== "[]") {
          rawValue = foundIhtiyacYeri;
        }
      } catch (e) {}
    }

    // Sanitize empty JSON array string
    if (
      typeof rawValue === "string" &&
      (rawValue.trim() === "[]" || rawValue.trim() === '[""]')
    ) {
      rawValue = "";
    }

    // Handle stringified JSON arrays
    if (
      typeof rawValue === "string" &&
      (rawValue.trim().startsWith("[") || rawValue.trim().startsWith("{"))
    ) {
      try {
        const parsedJson = JSON.parse(rawValue);
        if (Array.isArray(parsedJson) && parsedJson.length === 0) {
          resolvedPayload[sablonDegiskeni] = rule.varsayilan ?? "";
        } else {
          resolvedPayload[sablonDegiskeni] = parsedJson;
        }
      } catch (e) {
        resolvedPayload[sablonDegiskeni] = rawValue;
      }
    } else {
      resolvedPayload[sablonDegiskeni] =
        rawValue !== undefined && rawValue !== null &&
          String(rawValue).trim() !== ""
          ? rawValue
          : (rule.varsayilan ?? "");
    }
  } catch (err) {
    resolvedPayload[sablonDegiskeni] = rule.varsayilan ?? "";
  }
}
