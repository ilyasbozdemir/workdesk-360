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
                  <strong>{g.adSoyad}</strong>
                  {g.unvan ? ` ${formatUnvan(g.unvan)}` : ""}
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

        {/* Hazırlayan (Sağ) - Eğer OLUR varsa teklif eden hazirlayan personel imza atar */}
        {data.olurYazisi === true && (
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

        {/* Görevlendirmeyi Yapan Yetkili / Harcama Yetkilisi İmzası (Sağ) */}
        {data.olurYazisi !== true && (
          <PersonelCard
            adSoyad={onaylayanAdi}
            unvan={onaylayanUnvan}
            align="right"
            marginTop={20}
            marginBottom={30}
            nameField="onaylayanPersonelAdi"
            unvanField="onaylayanPersonelUnvan"
          />
        )}

        {/* OLUR Onay Bloğu (Orta) */}
        {data.olurYazisi === true && (
          <ApprovalSignature
            title={(data as any).olurBaslik || "OLUR"}
            date={data.dosyaTarihi || data.tarih || ""}
            adSoyad={onaylayanAdi}
            unvan={onaylayanUnvan}
            showSpace={true}
            marginTop={25}
            nameField="onaylayanPersonelAdi"
            unvanField="onaylayanPersonelUnvan"
            dateField="dosyaTarihi"
          />
        )}

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
            <div style={{ fontWeight: "bold" }}>DAĞITIM:</div>
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
                  - {d.adSoyad}{d.unvan ? ` ${formatUnvan(d.unvan)}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DocumentLayout>
  );
};
