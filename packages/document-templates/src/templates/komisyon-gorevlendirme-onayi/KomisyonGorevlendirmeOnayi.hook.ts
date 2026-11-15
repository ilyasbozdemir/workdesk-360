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
  params: UseKomisyonGorevlendirmeOnayiParams = {}
): UseKomisyonGorevlendirmeOnayiResult {
  const { data = {} } = params;

  return useMemo(() => {
    const rawFiyat =
      data.fiyatKomisyonu && data.fiyatKomisyonu.length > 0
        ? data.fiyatKomisyonu
        : data.gorevliler || [];
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

    const mainHeaderTitle =
      data.idareAdi ||
      data.sunulacakMakamAdi ||
      (data.antetSatirlari && data.antetSatirlari[1]) ||
      data.kurumAdi ||
      "KURUM BAŞKANLIĞINA";

    const fallbackKurum = data.altKurumBizim || data.kurumBizim || "İdaremiz";
    const kurumumuzMetni =
      data.kurumumuz &&
      data.kurumumuz !== "Belediyemiz / İdaremiz" &&
      data.kurumumuz !== "Belediyemiz"
        ? data.kurumumuz
        : fallbackKurum;

    const isAdiMetni = data.isAdi ?? data.isinAdi ?? "Alımı yapılacak iş";

    const evrakNo =
      data.evrakSayisi &&
      String(data.evrakSayisi).startsWith("E-") &&
      !String(data.evrakSayisi).includes("/")
        ? data.evrakSayisi
        : formatOfficialEvrakSayisi({
            evrakSayisi: data.evrakSayisi,
            detsisNo: data.detsisNo,
            tur: (data as any)?.tur,
            sayisi: (data as any)?.sayisi,
            teminNo:
              (data as any)?.teminNo ||
              (data as any)?.dosyaNo ||
              (data as any)?.dosyaSayisi,
          });

    const tarih =
      data.tarih ||
      data.onayaSunulanTarih ||
      data.dosyaTarihi ||
      new Date().toLocaleDateString("tr-TR");

    const konu = data.konu || "Görevlendirme";

    const kapanisMetni =
      data.kapanisMetni ||
      (data.olurYazisi === true
        ? "Gereğini olurlarınıza arz ederim."
        : "Gereğini rica ederim.");

    const onaylayanAdi = String(
      data.baskanAdi ||
        data.onaylayanPersonelAdi ||
        data.harcamaYetkilisiAdi ||
        ""
    ).trim();

    const onaylayanUnvan = String(
      data.baskanUnvan ||
        data.onaylayanPersonelUnvan ||
        data.harcamaYetkilisiUnvani ||
        "Harcama Yetkilisi"
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
