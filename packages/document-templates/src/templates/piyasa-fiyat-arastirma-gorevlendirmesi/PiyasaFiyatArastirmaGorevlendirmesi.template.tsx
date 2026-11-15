import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { EditableField } from "../../document/EditableField";
import { PersonelCard } from "../../document/ApprovalSignature";
import { MetadataBlock } from "../../document/MetadataBlock";
import { PiyasaFiyatArastirmaGorevlendirmesiData } from "./PiyasaFiyatArastirmaGorevlendirmesi.schema";
import { formatUnvan } from "../../utils/textHelpers";
import { usePiyasaFiyatArastirmaGorevlendirmesi } from "./PiyasaFiyatArastirmaGorevlendirmesi.hook";

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
  const {
    evrakNo,
    konuMetni,
    fallbackKurum,
    kurumumuzMetni,
    isinAdiMetni,
    gorevlendirilenler,
    dagitimListesi,
    kapanisMetni,
    onaylayanAdi,
    onaylayanUnvan,
  } = usePiyasaFiyatArastirmaGorevlendirmesi({ data, pageSize, orientation });

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
