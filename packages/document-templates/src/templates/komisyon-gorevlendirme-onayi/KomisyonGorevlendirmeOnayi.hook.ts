import { useMemo } from "react";
import { KomisyonGorevlendirmeOnayiType } from "./KomisyonGorevlendirmeOnayi.schema";
import { formatOfficialEvrakSayisi } from "../../resolver/helpers/resolveEvrakSayisi";

export interface KomisyonGorevlendirmeUye {
  adSoyad: string;
  unvan: string;
  gorevi: string;
  pozisyonu?: string;
}

export interface UseKomisyonGorevlendirmeOnayiParams {
  data?: Partial<KomisyonGorevlendirmeOnayiType> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
}

export interface UseKomisyonGorevlendirmeOnayiResult {
  fiyatUyeleri: KomisyonGorevlendirmeUye[];
  muayeneUyeleri: KomisyonGorevlendirmeUye[];
  mainHeaderTitle: string;
  fallbackKurum: string;
  kurumumuzMetni: string;
  isAdiMetni: string;
  evrakNo: string;
  tarih: string;
  konu: string;
  kapanisMetni: string;
  onaylayanAdi: string;
  onaylayanUnvan: string;
}

export function isExcludedFromCommissionTable(item: any, onaylayanAdi?: string): boolean {
  if (!item) return true;
  const adSoyad = (
    typeof item === "string"
      ? item
      : item.adSoyad || item.ad_soyad || item.adi || item.ad || ""
  ).trim();

  if (!adSoyad) return true;

  const lowerName = adSoyad.toLowerCase();
  if (
    lowerName.includes("talep eden") ||
    lowerName.includes("hazırlayan") ||
    lowerName.includes("onaylayan") ||
    lowerName.includes("harcama yetkili") ||
    lowerName.includes("gerçekleştirme") ||
    lowerName.includes("gerceklestirme")
  ) {
    return true;
  }

  const combinedRole = [
    typeof item === "object" ? item.gorev || item.gorevi || "" : "",
    typeof item === "object" ? item.unvan || item.unvani || "" : "",
    typeof item === "object" ? item.rol || "" : "",
    typeof item === "object" ? item.komisyon_turu || "" : "",
  ]
    .join(" ")
    .toLowerCase();

  if (
    combinedRole.includes("harcama yetkili") ||
    combinedRole.includes("ihale yetkili") ||
    combinedRole.includes("onaylayan") ||
    combinedRole.includes("gerçekleştirme") ||
    combinedRole.includes("gerceklestirme") ||
    combinedRole.includes("muhasebe yetkili") ||
    combinedRole.includes("mutemet")
  ) {
    return true;
  }

  const scope = typeof item === "object" ? (item.belgeKapsami || item.belge_kapsami || "") : "";
  if (scope === "gizli") return true;

  if (onaylayanAdi && onaylayanAdi.trim()) {
    const cleanOnay = onaylayanAdi.trim().toLowerCase();
    if (lowerName === cleanOnay || cleanOnay.includes(lowerName) || lowerName.includes(cleanOnay)) {
      return true;
    }
  }

  return false;
}

function normalizeMember(u: any): KomisyonGorevlendirmeUye {
  if (typeof u === "string") {
    return {
      adSoyad: u.trim(),
      unvan: "",
      gorevi: "Üye",
    };
  }
  return {
    adSoyad: (u.adSoyad || u.ad_soyad || u.adi || u.ad || "").trim(),
    unvan: (u.unvan || u.unvani || "").trim(),
    gorevi: (u.gorevi || u.gorev || "Üye").trim(),
    pozisyonu: (u.pozisyonu || u.unvan || u.unvani || "").trim(),
  };
}

export function useKomisyonGorevlendirmeOnayi(
  params: UseKomisyonGorevlendirmeOnayiParams = {},
): UseKomisyonGorevlendirmeOnayiResult {
  const { data = {} } = params;

  return useMemo(() => {
    const onaylayanAdi = String(
      data.baskanAdi ||
        data.onaylayanPersonelAdi ||
        data.harcamaYetkilisiAdi ||
        "",
    ).trim();

    const rawFiyat = data.fiyatKomisyonu && data.fiyatKomisyonu.length > 0
      ? data.fiyatKomisyonu
      : data.gorevliler || [];
    const rawMuayene = data.muayeneKomisyonu || [];

    const dedupe = (list: any[]) => {
      const seen = new Set<string>();
      return list.filter((item) => {
        const key = (item.adSoyad || item.ad_soyad || item.adi || item.ad || "").trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const fiyatUyeleri: KomisyonGorevlendirmeUye[] = dedupe(
      Array.isArray(rawFiyat) ? rawFiyat : [],
    )
      .filter((m) => !isExcludedFromCommissionTable(m, onaylayanAdi))
      .map(normalizeMember)
      .filter((m) => m.adSoyad.length > 0);

    const muayeneUyeleri: KomisyonGorevlendirmeUye[] = dedupe(
      Array.isArray(rawMuayene) ? rawMuayene : [],
    )
      .filter((m) => !isExcludedFromCommissionTable(m, onaylayanAdi))
      .map(normalizeMember)
      .filter((m) => m.adSoyad.length > 0);

    const mainHeaderTitle = data.idareAdi ||
      data.sunulacakMakamAdi ||
      (data.antetSatirlari && data.antetSatirlari[1]) ||
      data.kurumAdi ||
      "KURUM BAŞKANLIĞINA";

    const fallbackKurum = data.altKurumBizim || data.kurumBizim || "İdaremiz";
    const kurumumuzMetni = data.kurumumuz &&
        data.kurumumuz !== "Belediyemiz / İdaremiz" &&
        data.kurumumuz !== "Belediyemiz"
      ? data.kurumumuz
      : fallbackKurum;

    const isAdiMetni = data.isAdi ?? data.isinAdi ?? "Alımı yapılacak iş";

    const evrakNo = data.evrakSayisi &&
        String(data.evrakSayisi).startsWith("E-") &&
        !String(data.evrakSayisi).includes("/")
      ? data.evrakSayisi
      : formatOfficialEvrakSayisi({
        evrakSayisi: data.evrakSayisi,
        detsisNo: data.detsisNo,
        tur: (data as any)?.tur,
        sayisi: (data as any)?.sayisi,
        teminNo: (data as any)?.teminNo ||
          (data as any)?.dosyaNo ||
          (data as any)?.dosyaSayisi,
      });

    const tarih = data.tarih ||
      data.onayaSunulanTarih ||
      data.dosyaTarihi ||
      new Date().toLocaleDateString("tr-TR");

    const konu = data.konu || "Görevlendirme";

    const kapanisMetni = data.kapanisMetni ||
      (data.olurYazisi === true
        ? "Gereğini olurlarınıza arz ederim."
        : "Gereğini rica ederim.");

    const onaylayanUnvan = String(
      data.baskanUnvan ||
        data.onaylayanPersonelUnvan ||
        data.harcamaYetkilisiUnvani ||
        "Harcama Yetkilisi",
    ).trim();

    return {
      fiyatUyeleri,
      muayeneUyeleri,
      mainHeaderTitle,
      fallbackKurum,
      kurumumuzMetni,
      isAdiMetni,
      evrakNo,
      tarih,
      konu,
      kapanisMetni,
      onaylayanAdi,
      onaylayanUnvan,
    };
  }, [data]);
}
