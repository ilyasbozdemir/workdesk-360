import { useMemo } from "react";
import { PiyasaFiyatArastirmaGorevlendirmesiData } from "./PiyasaFiyatArastirmaGorevlendirmesi.schema";
import { formatOfficialEvrakSayisi } from "../../resolver/helpers/resolveEvrakSayisi";

export interface PiyasaOfficerInfo {
  adSoyad: string;
  unvan: string;
}

export interface UsePiyasaFiyatArastirmaGorevlendirmesiParams {
  data?: Partial<PiyasaFiyatArastirmaGorevlendirmesiData> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
}

export interface UsePiyasaFiyatArastirmaGorevlendirmesiResult {
  evrakNo: string;
  konuMetni: string;
  fallbackKurum: string;
  kurumumuzMetni: string;
  isinAdiMetni: string;
  gorevlendirilenler: PiyasaOfficerInfo[];
  dagitimListesi: PiyasaOfficerInfo[];
  kapanisMetni: string;
  onaylayanAdi: string;
  onaylayanUnvan: string;
}

export function isExcludedGorevlendirmeOfficer(
  item: any,
  onaylayanAdi?: string,
  hazirlayanAdi?: string,
): boolean {
  if (!item) return true;
  const adSoyad = (
    typeof item === "string"
      ? item
      : item.adSoyad || item.ad_soyad || item.ad || item.adi || ""
  ).trim();

  if (!adSoyad) return true;

  const lower = adSoyad.toLowerCase();
  if (
    lower.includes("talep eden") ||
    lower.includes("hazırlayan personel") ||
    lower.includes("onaylayan yetkili") ||
    lower.includes("onaylayan personel") ||
    lower.includes("dosyayı hazırlayan")
  ) {
    return true;
  }

  const duty = (
    typeof item === "object"
      ? `${item.gorev || ""} ${item.gorevi || ""} ${
        item.komisyonGorevi || ""
      } ${item.unvan || ""}`
      : ""
  ).toLowerCase();

  if (
    duty.includes("harcama yetkili") ||
    duty.includes("gerçekleştirme") ||
    duty.includes("gerceklestirme") ||
    duty.includes("onaylayan") ||
    duty.includes("muhasebe")
  ) {
    return true;
  }

  if (
    onaylayanAdi && adSoyad.toLowerCase() === onaylayanAdi.trim().toLowerCase()
  ) {
    return true;
  }

  if (
    hazirlayanAdi && adSoyad.toLowerCase() === hazirlayanAdi.trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

export function usePiyasaFiyatArastirmaGorevlendirmesi(
  params: UsePiyasaFiyatArastirmaGorevlendirmesiParams = {},
): UsePiyasaFiyatArastirmaGorevlendirmesiResult {
  const { data = {} } = params;

  return useMemo(() => {
    const rawList: any[] = (() => {
      if (
        Array.isArray(data.gorevlendirilenler) &&
        data.gorevlendirilenler.length > 0
      ) {
        return data.gorevlendirilenler;
      }
      if (
        Array.isArray(data.fiyatKomisyonu) && data.fiyatKomisyonu.length > 0
      ) {
        return data.fiyatKomisyonu;
      }
      if (Array.isArray(data.komisyon) && data.komisyon.length > 0) {
        return data.komisyon;
      }
      if (
        Array.isArray(data.komisyonUyeleri) && data.komisyonUyeleri.length > 0
      ) {
        return data.komisyonUyeleri;
      }
      if (Array.isArray(data.gorevliler) && data.gorevliler.length > 0) {
        return data.gorevliler;
      }
      if (
        Array.isArray(data.dagitimListesi) && data.dagitimListesi.length > 0
      ) {
        return data.dagitimListesi;
      }
      return [];
    })();

    const onaylayanAdi = String(
      data.onaylayanPersonelAdi || data.harcamaYetkilisiAdi || data.baskanAdi ||
        "",
    ).trim();

    const hazirlayanAdi = String(
      data.hazirlayanPersonelAdi || data.hazirlayan || data.gerceklestirmeGorevlisiAdi ||
        "",
    ).trim();

    const effectiveHazirlayanForFilter = data.olurYazisi === true ? hazirlayanAdi : undefined;

    const gorevlendirilenler: PiyasaOfficerInfo[] = (() => {
      const list = rawList
        .filter((g) => !isExcludedGorevlendirmeOfficer(g, onaylayanAdi, effectiveHazirlayanForFilter))
        .map((g: any) => {
          if (typeof g === "string") return { adSoyad: g.trim(), unvan: "" };
          return {
            adSoyad: (g.adSoyad || g.ad_soyad || g.ad || g.adi || "").trim(),
            unvan: (g.unvan || g.unvani || g.gorev || "").trim(),
          };
        })
        .filter((g) => g.adSoyad.length > 0);

      const seen = new Set<string>();
      return list.filter((item) => {
        const key = item.adSoyad.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })();

    const dagitimListesi: PiyasaOfficerInfo[] = (() => {
      if (
        Array.isArray(data.dagitimListesi) && data.dagitimListesi.length > 0
      ) {
        const filtered = data.dagitimListesi
          .map((d: any) => {
            if (typeof d === "string") return { adSoyad: d.trim(), unvan: "" };
            return {
              adSoyad: (d.adSoyad || d.ad || d.adi || "").trim(),
              unvan: (d.unvan || d.unvani || d.gorev || "").trim(),
            };
          })
          .filter((d: any) =>
            !isExcludedGorevlendirmeOfficer(d, onaylayanAdi, effectiveHazirlayanForFilter) &&
            d.adSoyad.length > 0
          );

        if (filtered.length > 0) {
          const seen = new Set<string>();
          return filtered.filter((item) => {
            const key = item.adSoyad.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }
      return gorevlendirilenler;
    })();

    const evrakNo =
      data.evrakSayisi && String(data.evrakSayisi).startsWith("E-") &&
        !String(data.evrakSayisi).includes("/")
        ? data.evrakSayisi
        : formatOfficialEvrakSayisi({
          evrakSayisi: data.evrakSayisi,
          detsisNo: data.detsisNo,
          tur: (data as any)?.tur,
          sayisi: (data as any)?.sayisi,
          teminNo: (data as any)?.teminNo || (data as any)?.dosyaNo ||
            (data as any)?.dosyaSayisi,
        });

    const fallbackKurum = data.altKurumBizim || data.kurumBizim || "İdaremiz";
    const kurumumuzMetni =
      data.kurumumuz && data.kurumumuz !== "Belediyemiz / İdaremiz" &&
        data.kurumumuz !== "Belediyemiz"
        ? data.kurumumuz
        : fallbackKurum;

    const isinAdiMetni = data.isinAdi ?? (data as any)?.konu ??
      "Alımı yapılacak iş";

    const kapanisMetni = data.kapanisMetni ||
      (data.olurYazisi === true
        ? "Gereğini olurlarınıza arz ederim."
        : "Gereğini rica ederim.");

    const onaylayanUnvan = data.onaylayanPersonelUnvan ||
      data.harcamaYetkilisiUnvani || "Harcama Yetkilisi";

    return {
      evrakNo,
      konuMetni: "Piyasa Fiyat Araştırma Görevlendirmesi",
      fallbackKurum,
      kurumumuzMetni,
      isinAdiMetni,
      gorevlendirilenler,
      dagitimListesi,
      kapanisMetni,
      onaylayanAdi,
      onaylayanUnvan,
    };
  }, [data]);
}
