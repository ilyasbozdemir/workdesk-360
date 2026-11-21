import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { EditableField } from "../../document/EditableField";
import { MetadataBlock, PersonelCard } from "../../document/ApprovalSignature";
import { MuayeneKabulKomisyonuData } from "./MuayeneKabulKomisyonu.schema";
import { formatUnvan } from "../../utils/textHelpers";
import { useMuayeneKabulKomisyonu } from "./MuayeneKabulKomisyonu.hook";
import { useTemplateEdit } from "../../document/TemplateEditContext";

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
  const { personelListesi: contextPersonelListesi } = useTemplateEdit();
  const {
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
  } = useMuayeneKabulKomisyonu({
    data,
    pageSize,
    orientation,
    personelListesi: (data as any)?.personelListesi || contextPersonelListesi,
  });

  const dagitimVar = dagitimListesi.length > 0;
  const hitapMetni = data.hitapMetni ||
    (dagitimVar ? "DAĞITIM YERLERİNE" : data.sunulacakMakamAdi || "");

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

        {/* HİTAP: tek muhatap ise adı, birden çoksa "DAĞITIM YERLERİNE" */}
        {hitapMetni && (
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "12pt",
              textTransform: "uppercase",
              marginTop: "24px",
              marginBottom: "16px",
              pageBreakInside: "avoid",
            }}
          >
            <EditableField
              name="hitapMetni"
              value={hitapMetni}
              placeholder="DAĞITIM YERLERİNE"
            />
          </div>
        )}

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
            value={onayBelgesiTarihi}
          />
          {" tarih ve "}
          <EditableField
            name="onayBelgesiSayisi"
            value={onayBelgesiSayisi}
          />
          {" sayılı Onay Belgesine istinaden 4734 Sayılı Kanunun "}
          <EditableField
            name="kanunMaddesi"
            value={kanunMaddesiMetni}
          />
          {" maddesine göre alımı gerçekleştirilen "}
          {data.kurumumuz || data.kurumAdi ? (
            <>
              <EditableField
                name="kurumumuz"
                value={String(data.kurumumuz || data.kurumAdi || "Kurumumuz")}
              />{" "}
            </>
          ) : null}
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
            marginBottom: "30px",
            lineHeight: 1.6,
          }}
        >
          {kapanisMetni}
        </div>

        {/* Görevlendirmeyi Yapan Yetkili / Harcama Yetkilisi İmzası (Sağ) */}
        <PersonelCard
          adSoyad={onaylayanAdi}
          unvan={onaylayanUnvan}
          align="right"
          marginTop={20}
          marginBottom={30}
          nameField="onaylayanPersonelAdi"
          unvanField="onaylayanPersonelUnvan"
        />

        {/* DAĞITIM (Sol Alt) */}
        {dagitimVar && (
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
              {dagitimListesi.map((d, idx) => (
                <li key={idx}>
                  - {d.adSoyad} {d.unvan ? formatUnvan(d.unvan) : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DocumentLayout>
  );
};
