import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { EditableField } from "../../document/EditableField";
import {
  ApprovalSignature,
  EditableOlurPlaceholder,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { MetadataBlock } from "../../document/MetadataBlock";
import { PiyasaFiyatArastirmaGorevlendirmesiData } from "./PiyasaFiyatArastirmaGorevlendirmesi.schema";
import { formatUnvan } from "../../utils/textHelpers";
import { formatOfficialEvrakSayisi } from "../../resolver/helpers/resolveEvrakSayisi";

interface Props {
  data?: Partial<PiyasaFiyatArastirmaGorevlendirmesiData> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export const PiyasaFiyatArastirmaGorevlendirmesi: React.FC<Props> = ({
  data = {},
  pageSize = "A4",
  orientation = "portrait",
  hideHeader = false,
  hideFooter = false,
}) => {
  // Hariç tutulacak geçersiz/placeholder isimleri filtreleme fonksiyonu
  const isExcludedOfficer = (item: any) => {
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

    // Harcama yetkilisi, gerçekleştirme görevlisi veya muhasebe görevlileri piyasa fiyat araştırma görevlisi olarak listelenmez
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

    // Kişinin adı doğrudan onaylayan personel ile aynı ise de hariç tut
    if (
      data.onaylayanPersonelAdi &&
      adSoyad.toLowerCase() === data.onaylayanPersonelAdi.trim().toLowerCase()
    ) {
      return true;
    }

    return false;
  };

  // Ham görevli listesini topla (gorevlendirilenler, fiyatKomisyonu, komisyon, komisyonUyeleri, gorevliler, dagitimListesi)
  const rawList: any[] = (() => {
    if (
      data.gorevlendirilenler && Array.isArray(data.gorevlendirilenler) &&
      data.gorevlendirilenler.length > 0
    ) {
      return data.gorevlendirilenler;
    }
    if (
      data.fiyatKomisyonu && Array.isArray(data.fiyatKomisyonu) &&
      data.fiyatKomisyonu.length > 0
    ) {
      return data.fiyatKomisyonu;
    }
    if (
      data.komisyon && Array.isArray(data.komisyon) &&
      data.komisyon.length > 0
    ) {
      return data.komisyon;
    }
    if (
      data.komisyonUyeleri && Array.isArray(data.komisyonUyeleri) &&
      data.komisyonUyeleri.length > 0
    ) {
      return data.komisyonUyeleri;
    }
    if (
      data.gorevliler && Array.isArray(data.gorevliler) &&
      data.gorevliler.length > 0
    ) {
      return data.gorevliler;
    }
    if (
      data.dagitimListesi && Array.isArray(data.dagitimListesi) &&
      data.dagitimListesi.length > 0
    ) {
      return data.dagitimListesi;
    }
    return [];
  })();

  // Piyasa Fiyat Araştırma Görevlilerini listele (Mükerrer isimleri tekleştir)
  const gorevlendirilenler: Array<{ adSoyad: string; unvan: string }> = (() => {
    const list = rawList
      .filter((g) => !isExcludedOfficer(g))
      .map((g: any) => {
        if (typeof g === "string") {
          return { adSoyad: g.trim(), unvan: "" };
        }
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

  // Dağıtım listesi (Mükerrer isimleri tekleştir, yoksa gorevlendirilenler listesine geri düş)
  const dagitimListesi: Array<{ adSoyad: string; unvan: string }> = (() => {
    if (
      data.dagitimListesi && Array.isArray(data.dagitimListesi) &&
      data.dagitimListesi.length > 0
    ) {
      const filtered = data.dagitimListesi
        .map((d: any) => {
          if (typeof d === "string") {
            return { adSoyad: d.trim(), unvan: "" };
          }
          return {
            adSoyad: (d.adSoyad || d.ad || d.adi || "").trim(),
            unvan: (d.unvan || d.unvani || d.gorev || "").trim(),
          };
        })
        .filter((d: any) => !isExcludedOfficer(d) && d.adSoyad.length > 0);

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

  // Evrak sayısı oluşturma (EBYS Standart Formatı: E-DETSİS-SDP-NO)
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

  const konuMetni = data.dosyaKonusu &&
      data.dosyaKonusu !== data.isinAdi &&
      data.dosyaKonusu !== (data as any)?.konu &&
      !data.dosyaKonusu.toLowerCase().includes("alımı") &&
      !data.dosyaKonusu.toLowerCase().includes("yapımı") &&
      !data.dosyaKonusu.toLowerCase().includes("hizmeti")
    ? data.dosyaKonusu
    : "Piyasa Fiyat Araştırma Görevlendirmesi";

  const fallbackKurum = data.altKurumBizim || data.kurumBizim || "İdaremiz";
  const kurumumuzMetni = data.kurumumuz &&
      data.kurumumuz !== "Belediyemiz / İdaremiz" &&
      data.kurumumuz !== "Belediyemiz"
    ? data.kurumumuz
    : fallbackKurum;

  const isinAdiMetni = data.isinAdi ?? (data as any)?.konu ??
    "Alımı yapılacak iş";

  return (
    <DocumentLayout
      data={data as any}
      hideHeader={hideHeader}
      hideFooter={hideFooter}
      pageSize={pageSize}
      orientation={orientation}
      pageNumber={1}
      totalPages={1}
    >
      <div
        style={{
          width: "100%",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12pt",
          color: "#000",
          lineHeight: 1.5,
        }}
      >
        {/* Standart Resmî Yazışma Meta Bloğu (Sayı, Konu, Tarih) */}
        <MetadataBlock
          evrakSayisi={evrakNo}
          tarih={data.dosyaTarihi || data.tarih}
          dosyaKonusu={konuMetni}
          showBorder={false}
        />

        {/* Görevlendirme Metni */}
        <div
          style={{
            textIndent: "40px",
            textAlign: "justify",
            marginTop: "30px",
            marginBottom: "0px",
            lineHeight: 1.6,
          }}
        >
          <EditableField
            name="kurumumuz"
            value={kurumumuzMetni}
            placeholder={fallbackKurum}
          />
          ,{" "}
          <EditableField
            name="isinAdi"
            value={isinAdiMetni}
          />{" "}
          işine ait fiyat araştırmasını yapmak üzere{" "}
          {gorevlendirilenler.length > 0
            ? (
              gorevlendirilenler.map((g, idx) => (
                <React.Fragment key={idx}>
                  <strong>{g.adSoyad}</strong>{" "}
                  {g.unvan ? formatUnvan(g.unvan) : ""}
                  {idx < gorevlendirilenler.length - 1 ? ", " : " "}
                </React.Fragment>
              ))
            )
            : <strong>İlgili personeller</strong>}{" "}
          Piyasa Fiyat Araştırması için görevlendirilmiş olup,
        </div>

        <div
          style={{
            textIndent: "40px",
            textAlign: "justify",
            marginTop: "0px",
            marginBottom: "30px",
            lineHeight: 1.6,
          }}
        >
          {data.olurYazisi !== false
            ? "Gereğini olurlarınıza arz ederim."
            : "Gereğini rica ederim."}
        </div>

        {/* Hazırlayan (Sağ) - Eğer OLUR varsa hazırlayan imza atar */}
        {data.olurYazisi !== false && (
          <PersonelCard
            adSoyad={data.hazirlayanPersonelAdi}
            unvan={data.hazirlayanPersonelUnvan}
            align="right"
            marginTop={20}
            marginBottom={30}
            nameField="hazirlayanPersonelAdi"
            unvanField="hazirlayanPersonelUnvan"
          />
        )}

        {/* Doğrudan Görevlendirme İmzası (OLUR yoksa yetkili tek başına imzalar) */}
        {data.olurYazisi === false && (
          <PersonelCard
            adSoyad={data.onaylayanPersonelAdi}
            unvan={data.onaylayanPersonelUnvan}
            align="right"
            marginTop={20}
            marginBottom={30}
            nameField="onaylayanPersonelAdi"
            unvanField="onaylayanPersonelUnvan"
          />
        )}

        {/* OLUR Onay Bloğu (Orta) */}
        {data.olurYazisi !== false
          ? (
            <ApprovalSignature
              title={(data as any).olurBaslik || "OLUR"}
              date={data.dosyaTarihi || data.tarih || ""}
              adSoyad={data.onaylayanPersonelAdi}
              unvan={data.onaylayanPersonelUnvan}
              showSpace={true}
              marginTop={25}
              nameField="onaylayanPersonelAdi"
              unvanField="onaylayanPersonelUnvan"
              dateField="dosyaTarihi"
            />
          )
          : <EditableOlurPlaceholder />}

        {/* DAĞITIM (Sol Alt) */}
        <div
          style={{
            marginTop: "40px",
            textAlign: "left",
            fontSize: "10pt",
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
        >
          <div style={{ fontSize: "10pt", fontWeight: "bold" }}>DAĞITIM:</div>
          <ul
            style={{
              listStyleType: "none",
              paddingLeft: 0,
              marginTop: "5px",
              lineHeight: 1.5,
            }}
          >
            {dagitimListesi.length > 0
              ? (
                dagitimListesi.map((d, idx) => (
                  <li key={idx}>
                    - {d.adSoyad} {d.unvan ? formatUnvan(d.unvan) : ""}
                  </li>
                ))
              )
              : <li>- Piyasa Fiyat Araştırma Görevlileri</li>}
          </ul>
        </div>
      </div>
    </DocumentLayout>
  );
};
