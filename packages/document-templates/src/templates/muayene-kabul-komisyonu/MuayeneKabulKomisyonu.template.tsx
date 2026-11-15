import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { EditableField } from "../../document/EditableField";
import {
  ApprovalSignature,
  DateEditableField,
  EditableOlurPlaceholder,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { MuayeneKabulKomisyonuData } from "./MuayeneKabulKomisyonu.schema";
import { formatUnvan } from "../../utils/textHelpers";
import { formatOfficialEvrakSayisi } from "../../resolver/helpers/resolveEvrakSayisi";

interface Props {
  data?: Partial<MuayeneKabulKomisyonuData> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export const MuayeneKabulKomisyonu: React.FC<Props> = ({
  data = {},
  pageSize = "A4",
  orientation = "portrait",
  hideHeader = false,
  hideFooter = false,
}) => {
  // Görevlendirilen muayene kabul komisyonu üyeleri (Mükerrer isimleri tekleştir)
  const gorevlendirilenler: Array<{ adSoyad: string; unvan: string }> = (() => {
    let raw: Array<{ adSoyad: string; unvan: string }> = [];
    if (
      data.muayeneKomisyonu && Array.isArray(data.muayeneKomisyonu) &&
      data.muayeneKomisyonu.length > 0
    ) {
      raw = data.muayeneKomisyonu.map((g: any) => ({
        adSoyad: g.adSoyad || g.ad_soyad || g.ad || "",
        unvan: g.unvan || g.gorev || "",
      }));
    } else if (
      data.gorevlendirilenler && Array.isArray(data.gorevlendirilenler) &&
      data.gorevlendirilenler.length > 0
    ) {
      raw = data.gorevlendirilenler.map((g: any) => ({
        adSoyad: g.adSoyad || g.ad || g.adi || "",
        unvan: g.unvan || g.unvani || g.gorev || "",
      }));
    } else if (
      data.komisyonUyeleri && Array.isArray(data.komisyonUyeleri) &&
      data.komisyonUyeleri.length > 0
    ) {
      raw = data.komisyonUyeleri.map((g: any) => ({
        adSoyad: g.adSoyad || g.ad_soyad || g.ad || "",
        unvan: g.unvan || g.gorev || "",
      }));
    } else if (
      data.gorevliler && Array.isArray(data.gorevliler) &&
      data.gorevliler.length > 0
    ) {
      raw = data.gorevliler.map((g: any) => ({
        adSoyad: g.ad || g.adSoyad || "",
        unvan: g.unvan || g.unvani || g.gorev || "",
      }));
    }

    const seen = new Set<string>();
    return raw.filter((item) => {
      const key = (item.adSoyad || "").trim().toLowerCase();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  // Dağıtım listesi (Mükerrer isimleri tekleştir)
  const dagitimListesi: Array<{ adSoyad: string; unvan: string }> = (() => {
    if (
      data.dagitimListesi && Array.isArray(data.dagitimListesi) &&
      data.dagitimListesi.length > 0
    ) {
      const mapped = data.dagitimListesi.map((d: any) => {
        if (typeof d === "string") return { adSoyad: d, unvan: "" };
        return {
          adSoyad: d.adSoyad || d.ad || d.adi || "",
          unvan: d.unvan || d.unvani || d.gorev || "",
        };
      });
      const seen = new Set<string>();
      return mapped.filter((item) => {
        const key = (item.adSoyad || "").trim().toLowerCase();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return [];
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

  const konuMetni = "Muayene ve Kabul Komisyonu";

  const isinAdiMetni = data.isinAdi ?? "Alımı yapılacak";

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
        {/* Meta Satırı (Sayı, Konu, Tarih) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0px",
          }}
        >
          <div>
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      padding: "2px 10px 2px 0",
                      verticalAlign: "top",
                    }}
                  >
                    Sayı
                  </td>
                  <td
                    style={{ padding: "2px 10px 2px 0", verticalAlign: "top" }}
                  >
                    : <EditableField name="evrakSayisi" value={evrakNo} />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      padding: "2px 10px 2px 0",
                      verticalAlign: "top",
                    }}
                  >
                    Konu
                  </td>
                  <td
                    style={{ padding: "2px 10px 2px 0", verticalAlign: "top" }}
                  >
                    : <EditableField name="dosyaKonusu" value={konuMetni} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <strong>Tarih:</strong>{" "}
            <DateEditableField
              name="dosyaTarihi"
              value={data.dosyaTarihi || data.tarih || ""}
            />
          </div>
        </div>

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
            name="onayBelgesiTarihi"
            value={String(
              data.onayBelgesiTarihi || data.dosyaTarihi || data.tarih ||
                "........",
            )}
          />
          {" tarih ve "}
          <EditableField
            name="onayBelgesiSayisi"
            value={String(
              data.onayBelgesiSayisi ||
                (data.onayBelgesiNo && !String(data.onayBelgesiNo).includes("/")
                  ? data.onayBelgesiNo
                  : evrakNo),
            )}
          />
          {" sayılı Onay Belgesine istinaden 4734 Sayılı Kanunun "}
          <EditableField
            name="kanunMaddesi"
            value={String(
              data.kanunMaddesi || data.ihaleSekli || data.ihale_sekli ||
                "22/d",
            )}
          />

          {" maddesine göre alımı gerçekleştirilen "}
          <EditableField
            name="isinAdi"
            value={isinAdiMetni}
          />{" "}
          işine ait muayene ve kabulü yapmak üzere{" "}
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
          Muayene ve Kabul Komisyonunda görevlendirilmiş olup,
        </div>

        <div
          style={{
            textIndent: "40px",
            textAlign: "justify",
            marginTop: "0px",
            marginBottom: "20px",
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
              : <li>- İlgili Personel</li>}
          </ul>
        </div>
      </div>
    </DocumentLayout>
  );
};
