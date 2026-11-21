import { useMemo } from "react";
import { MuayeneKabulKomisyonuData } from "./MuayeneKabulKomisyonu.schema";
import { formatOfficialEvrakSayisi } from "../../resolver/helpers/resolveEvrakSayisi";
import { cleanKanunMaddesi } from "../../utils/textHelpers";
import { useTemplateEdit } from "../../document/TemplateEditContext";
import {
  buildMergedPersonelList,
  cleanPersonelName,
} from "../../document/ApprovalSignature";

export interface MuayeneOfficerInfo {
  adSoyad: string;
  unvan: string;
  personel_id?: number | string;
  personelId?: number | string;
}

export interface UseMuayeneKabulKomisyonuParams {
  data?: Partial<MuayeneKabulKomisyonuData> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  personelListesi?: any[];
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

export function isRoleTitleString(title?: string): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  return (
    t === "" ||
    t === "üye" ||
    t === "uye" ||
    t === "başkan" ||
    t === "baskan" ||
    t === "komisyon başkanı" ||
    t === "komisyon baskani" ||
    t === "yedek üye" ||
    t === "yedek uye" ||
    t === "komisyon üyesi" ||
    t === "komisyon uyesi" ||
    t === "asil üye" ||
    t === "asil uye" ||
    t === "fiyat araştırma görevlisi" ||
    t === "fiyat arastirma gorevlisi" ||
    t === "muayene kabul başkanı" ||
    t === "muayene kabul baskani" ||
    t === "muayene ve kabul komisyon başkanı" ||
    t === "muayene ve kabul komisyon baskani" ||
    t === "muayene komisyon başkanı" ||
    t === "muayene komisyon baskani"
  );
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
  const editContext = useTemplateEdit();
  const { data = {}, personelListesi: paramPersonelListesi } = params;

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

    const activePersonelList =
      paramPersonelListesi ||
      (Array.isArray((data as any).personelListesi) && (data as any).personelListesi.length > 0
        ? (data as any).personelListesi
        : editContext?.personelListesi);

    const mergedPersonelList = buildMergedPersonelList(
      activePersonelList,
      data as any,
    );

    const findTitleFromPersonelList = (name: string, pid?: any): string => {
      if (!name && !pid) return "";

      const cleanName = cleanPersonelName(name).trim().toLowerCase();

      // 1. ID eşleşmesi
      if (pid) {
        const byId = mergedPersonelList.find(
          (p: any) =>
            String(p.id || p.personel_id || p.personelId) === String(pid),
        );
        if (byId?.unvan && !isRoleTitleString(byId.unvan)) {
          return String(byId.unvan).trim();
        }
      }

      // 2. İsim eşleşmesi (merged list)
      if (cleanName) {
        const byName = mergedPersonelList.find((p: any) => {
          const pName = cleanPersonelName(
            p.adSoyad || p.ad_soyad || p.adiSoyadi || p.label || "",
          )
            .trim()
            .toLowerCase();
          return pName === cleanName;
        });
        if (byName?.unvan && !isRoleTitleString(byName.unvan)) {
          return String(byName.unvan).trim();
        }
      }

      // 3. Fallback: data.personelListesi, data.personeller veya window.__activePersonelListesi
      const pools: any[] = [
        ...(Array.isArray((data as any).personelListesi) ? (data as any).personelListesi : []),
        ...(Array.isArray((data as any).personeller) ? (data as any).personeller : []),
        ...(Array.isArray((data as any).personel) ? (data as any).personel : []),
        ...(typeof window !== "undefined" && Array.isArray((window as any)?.__activePersonelListesi)
          ? (window as any).__activePersonelListesi
          : []),
      ];

      for (const p of pools) {
        if (!p) continue;
        const pId = p.id || p.personel_id || p.personelId;
        if (pid && String(pId) === String(pid) && p.unvan && !isRoleTitleString(p.unvan)) {
          return String(p.unvan).trim();
        }
        const pName = cleanPersonelName(p.adSoyad || p.ad_soyad || p.adiSoyadi || "")
          .trim()
          .toLowerCase();
        if (cleanName && pName === cleanName && p.unvan && !isRoleTitleString(p.unvan)) {
          return String(p.unvan).trim();
        }
      }

      return "";
    };

    const extractOfficerTitle = (item: any): string => {
      if (!item) return "";
      if (typeof item === "string") return findTitleFromPersonelList(item);

      const adSoyad = (item.adSoyad || item.ad_soyad || item.ad || item.adi || "").trim();
      const pid = item.personel_id || item.personelId || item.id;

      // 1. Kadro unvanı doğrudan kolon olarak mevcutsa (kadro_unvani, personel_unvan, vekalet_unvani)
      const explicitKadroUnvan = String(
        item.kadro_unvani ||
        item.kadroUnvani ||
        item.personel_unvan ||
        item.personelUnvan ||
        item.vekalet_unvani ||
        item.vekaletUnvani ||
        ""
      ).trim();

      if (explicitKadroUnvan && !isRoleTitleString(explicitKadroUnvan)) {
        return explicitKadroUnvan;
      }

      // 2. item.unvan alanını kontrol et
      const rawUnvan = String(
        item.unvan ||
        item.unvani ||
        item.title ||
        item.u ||
        ""
      ).trim();

      // "Komisyon Başkanı", "Üye" gibi görev adları unvan değildir; sadece gerçek kadro unvanları kabul edilir
      if (rawUnvan && !isRoleTitleString(rawUnvan)) {
        return rawUnvan;
      }

      // 3. Görev adıysa veya boşsa havuzdan (TANIM_Personel / personelListesi) personelin gerçek unvanını bul
      const fromPool = findTitleFromPersonelList(adSoyad, pid);
      if (fromPool) {
        return fromPool;
      }

      return "";
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
          const pid = g.personel_id || g.personelId || g.id;
          return {
            adSoyad,
            unvan: extractOfficerTitle(g),
            personel_id: pid,
            personelId: pid,
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
            const pid = d.personel_id || d.personelId || d.id;
            return {
              adSoyad,
              unvan: extractOfficerTitle(d),
              personel_id: pid,
              personelId: pid,
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
  }, [data, paramPersonelListesi, editContext?.personelListesi]);
}
