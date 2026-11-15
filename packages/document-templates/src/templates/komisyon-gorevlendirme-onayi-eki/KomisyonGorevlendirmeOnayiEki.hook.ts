import { useMemo } from "react";
import { KomisyonGorevlendirmeOnayiEkiType } from "./KomisyonGorevlendirmeOnayiEki.schema";
import { KomisyonGorevlendirmeUye } from "../komisyon-gorevlendirme-onayi/KomisyonGorevlendirmeOnayi.hook";

export function formatAlimTuru(alimTuru?: string, tur?: string): string {
  const raw = (alimTuru || tur || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return "mal alımı";
  if (lower === "mal" || lower === "malzeme") return "mal alımı";
  if (lower === "hizmet") return "hizmet alımı";
  if (lower === "yapim" || lower === "yapım" || lower === "yapim_isi") {
    return "yapım işi";
  }
  if (lower === "danismanlik" || lower === "danışmanlık") {
    return "danışmanlık hizmet alımı";
  }

  if (
    lower.includes("alım") ||
    lower.includes("alim") ||
    lower.includes("işi") ||
    lower.includes("isi")
  ) {
    return raw;
  }

  return `${raw} alımı`;
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

export interface UseKomisyonGorevlendirmeOnayiEkiParams {
  data?: Partial<KomisyonGorevlendirmeOnayiEkiType> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
}

export interface UseKomisyonGorevlendirmeOnayiEkiResult {
  ekNo: string;
  kurumumuzMetni: string;
  alimTuruMetni: string;
  fiyatUyeleri: KomisyonGorevlendirmeUye[];
  muayeneUyeleri: KomisyonGorevlendirmeUye[];
}

export function useKomisyonGorevlendirmeOnayiEki(
  params: UseKomisyonGorevlendirmeOnayiEkiParams = {}
): UseKomisyonGorevlendirmeOnayiEkiResult {
  const { data = {} } = params;

  return useMemo(() => {
    const rawFiyat =
      data.fiyatKomisyonu && data.fiyatKomisyonu.length > 0
        ? data.fiyatKomisyonu
        : (data as any)?.gorevliler || [];
    const rawMuayene = data.muayeneKomisyonu || [];

    const fiyatUyeleri: KomisyonGorevlendirmeUye[] = (
      Array.isArray(rawFiyat) ? rawFiyat : []
    )
      .map(normalizeMember)
      .filter((m) => m.adSoyad.length > 0);

    const muayeneUyeleri: KomisyonGorevlendirmeUye[] = (
      Array.isArray(rawMuayene) ? rawMuayene : []
    )
      .map(normalizeMember)
      .filter((m) => m.adSoyad.length > 0);

    const ekNo = data.ekNo || "2";
    const kurumumuzMetni = data.kurumumuz ?? (data.kurumAdi || "Kurumumuz");
    const alimTuruMetni = formatAlimTuru(data.alimTuru, (data as any)?.tur);

    return {
      ekNo,
      kurumumuzMetni,
      alimTuruMetni,
      fiyatUyeleri,
      muayeneUyeleri,
    };
  }, [data]);
}

