import { useMemo } from "react";
import { MuayeneKabulKomisyonuData } from "./MuayeneKabulKomisyonu.schema";
import { formatOfficialEvrakSayisi } from "../../resolver/helpers/resolveEvrakSayisi";
import { cleanKanunMaddesi } from "../../utils/textHelpers";

export interface MuayeneOfficerInfo {
  adSoyad: string;
  unvan: string;
}

export interface UseMuayeneKabulKomisyonuParams {
  data?: Partial<MuayeneKabulKomisyonuData> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
}

export interface UseMuayeneKabulKomisyonuResult {
  evrakNo: string;
  konuMetni: string;
  isinAdiMetni: string;
  kanunMaddesiMetni: string;
  onayBelgesiTarihi: string;
  onayBelgesiSayisi: string;
  gorevlendirilenler: MuayeneOfficerInfo[];
  dagitimListesi: MuayeneOfficerInfo[];
  kapanisMetni: string;
  onaylayanAdi: string;
  onaylayanUnvan: string;
}

export function isExcludedMuayeneOfficer(
  item: any,
  onaylayanAdi?: string,
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

  return false;
}

export function useMuayeneKabulKomisyonu(
  params: UseMuayeneKabulKomisyonuParams = {},
): UseMuayeneKabulKomisyonuResult {
  const { data = {} } = params;

  return useMemo(() => {
    const onaylayanAdi = String(
      data.onaylayanPersonelAdi || data.harcamaYetkilisiAdi || data.baskanAdi ||
        "",
    ).trim();

    const rawList: any[] = (() => {
      if (
        Array.isArray(data.muayeneKomisyonu) && data.muayeneKomisyonu.length > 0
      ) {
        return data.muayeneKomisyonu;
      }
      if (
        Array.isArray(data.gorevlendirilenler) &&
        data.gorevlendirilenler.length > 0
      ) {
        return data.gorevlendirilenler;
      }
      if (
        Array.isArray(data.komisyonUyeleri) && data.komisyonUyeleri.length > 0
      ) {
        return data.komisyonUyeleri;
      }
      if (Array.isArray(data.komisyon) && data.komisyon.length > 0) {
        return data.komisyon;
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

    const findTitleFromPersonelList = (name: string, pid?: any): string => {
      if (!name) return "";
      const pList: any[] = Array.isArray((data as any).personelListesi)
        ? (data as any).personelListesi
        : Array.isArray((data as any).personeller)
        ? (data as any).personeller
        : [];
      if (pList.length === 0) return "";
      if (pid) {
        const byId = pList.find((p) => String(p.id) === String(pid));
        if (byId?.unvan && String(byId.unvan).trim()) return String(byId.unvan).trim();
      }
      const cleanTarget = name.trim().toLowerCase();
      const byName = pList.find(
        (p) => String(p.adSoyad || p.ad_soyad || "").trim().toLowerCase() === cleanTarget,
      );
      return byName?.unvan && String(byName.unvan).trim() ? String(byName.unvan).trim() : "";
    };

    const extractOfficerTitle = (item: any): string => {
      if (!item) return "";
      if (typeof item === "string") return findTitleFromPersonelList(item);

      const adSoyad = (item.adSoyad || item.ad_soyad || item.ad || item.adi || "").trim();
      const pid = item.personel_id || item.personelId || item.id;

      let unvan = String(
        item.unvan ||
        item.unvani ||
        item.vekalet_unvani ||
        item.vekaletUnvani ||
        item.personel_unvan ||
        item.title ||
        item.u ||
        ""
      ).trim();

      // "Üye", "Başkan", "Yedek Üye" birer komisyon görevidir; kadro unvanı değildir.
      const isRoleOnly =
        !unvan ||
        unvan.toLowerCase() === "üye" ||
        unvan.toLowerCase() === "uye" ||
        unvan.toLowerCase() === "başkan" ||
        unvan.toLowerCase() === "baskan" ||
        unvan.toLowerCase() === "yedek üye" ||
        unvan.toLowerCase() === "yedek uye" ||
        unvan.toLowerCase() === "komisyon üyesi" ||
        unvan.toLowerCase() === "komisyon uyesi";

      if (isRoleOnly) {
        const fromPool = findTitleFromPersonelList(adSoyad, pid);
        if (fromPool) {
          return fromPool;
        }
        // Eğer personelde de kadro unvanı yoksa ve eldeki değer görev değilse kullan
        return isRoleOnly ? "" : unvan;
      }

      return unvan;
    };

    const gorevlendirilenler: MuayeneOfficerInfo[] = (() => {
      const list = rawList
        .filter((g) => !isExcludedMuayeneOfficer(g, onaylayanAdi))
        .map((g: any) => {
          if (typeof g === "string") {
            const name = g.trim();
            return { adSoyad: name, unvan: extractOfficerTitle(name) };
          }
          const adSoyad = (g.adSoyad || g.ad_soyad || g.ad || g.adi || "").trim();
          return {
            adSoyad,
            unvan: extractOfficerTitle(g),
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

    const dagitimListesi: MuayeneOfficerInfo[] = (() => {
      if (
        Array.isArray(data.dagitimListesi) && data.dagitimListesi.length > 0
      ) {
        const filtered = data.dagitimListesi
          .map((d: any) => {
            if (typeof d === "string") {
              const name = d.trim();
              return { adSoyad: name, unvan: extractOfficerTitle(name) };
            }
            const adSoyad = (d.adSoyad || d.ad || d.ad_soyad || d.adi || "").trim();
            return {
              adSoyad,
              unvan: extractOfficerTitle(d),
            };
          })
          .filter((d: any) =>
            !isExcludedMuayeneOfficer(d, onaylayanAdi) && d.adSoyad.length > 0
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

    const konuMetni = "Muayene ve Kabul Komisyonu";
    const isinAdiMetni = data.isinAdi ?? (data as any)?.konu ??
      "Alımı yapılacak";

    const rawKanunMaddesi = data.kanunMaddesi ||
      data.ihaleSekli ||
      data.teminSekli ||
      data.ihale_sekli ||
      (data as any)?.temin_sekli;
    const kanunMaddesiMetni = cleanKanunMaddesi(rawKanunMaddesi);

    const onayBelgesiTarihi = String(
      data.onayBelgesiTarihi || data.dosyaTarihi || data.tarih || "........",
    );

    const onayBelgesiSayisi = String(
      data.onayBelgesiSayisi ||
        (data.onayBelgesiNo && !String(data.onayBelgesiNo).includes("/")
          ? data.onayBelgesiNo
          : evrakNo),
    );

    const kapanisMetni = data.kapanisMetni ||
      (data.olurYazisi === true
        ? "Gereğini olurlarınıza arz ederim."
        : "Gereğini rica ederim.");

    const onaylayanUnvan = data.onaylayanPersonelUnvan ||
      data.harcamaYetkilisiUnvani || "Harcama Yetkilisi";

    return {
      evrakNo,
      konuMetni,
      isinAdiMetni,
      kanunMaddesiMetni,
      onayBelgesiTarihi,
      onayBelgesiSayisi,
      gorevlendirilenler,
      dagitimListesi,
      kapanisMetni,
      onaylayanAdi,
      onaylayanUnvan,
    };
  }, [data]);
}
