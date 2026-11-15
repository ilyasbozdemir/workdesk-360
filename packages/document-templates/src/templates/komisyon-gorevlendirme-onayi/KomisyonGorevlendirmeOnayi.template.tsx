import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { EditableField } from "../../document/EditableField";
import {
  DateEditableField,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { KomisyonGorevlendirmeOnayiType } from "./KomisyonGorevlendirmeOnayi.schema";
import { useKomisyonGorevlendirmeOnayi } from "./KomisyonGorevlendirmeOnayi.hook";

interface KomisyonGorevlendirmeOnayiProps {
  data?: Partial<KomisyonGorevlendirmeOnayiType> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export function KomisyonGorevlendirmeOnayi({
  data = {},
  pageSize = "A4",
  orientation = "portrait",
  hideHeader = false,
  hideFooter = true,
}: KomisyonGorevlendirmeOnayiProps) {
  const {
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
  } = useKomisyonGorevlendirmeOnayi({ data, pageSize, orientation });

  const renderTopSection = () => (
    <>
      {/* Meta Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          fontSize: "10pt",
        }}
      >
        <div>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Sayı
                </td>
                <td>
                  :{" "}
                  <EditableField
                    name="evrakSayisi"
                    value={evrakNo}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    fontWeight: "bold",
                    paddingRight: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Konu
                </td>
                <td>
                  :{" "}
                  <EditableField
                    name="konu"
                    value={konu}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <strong>Tarih:</strong>{" "}
          <DateEditableField
            name="tarih"
            value={tarih}
          />
        </div>
      </div>

      {/* Boxed Institution Header */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <div
          style={{
            display: "inline-block",
            padding: "2px 10px",
            fontWeight: "bold",
            fontSize: "11pt",
            textTransform: "uppercase",
          }}
        >
          <EditableField
            name="sunulacakMakamAdi"
            value={mainHeaderTitle}
            placeholder="KURUM BAŞKANLIĞINA"
          />
        </div>
      </div>

      {/* Body Paragraph */}
      <div
        style={{
          textAlign: "justify",
          textIndent: "25px",
          marginBottom: "8px",
          lineHeight: 1.35,
        }}
      >
        <EditableField
          name="kurumumuz"
          value={kurumumuzMetni}
          placeholder={fallbackKurum}
        />{" "}
        bünyesindeki{" "}
        <strong>
          <EditableField
            name="isAdi"
            value={isAdiMetni}
            placeholder="İşin Adı"
          />
        </strong>{" "}
        işine ait fiyat araştırması ile muayene ve kabulü yapmak üzere aşağıdaki
        personeller görevlendirilmiş olup,
      </div>
      <div
        style={{
          textAlign: "justify",
          textIndent: "25px",
          marginBottom: "12px",
          lineHeight: 1.35,
        }}
      >
        {kapanisMetni}
      </div>
    </>
  );

  const renderTablesAndSigner = () => (
    <>
      {/* Table 1: PİYASA ARAŞTIRMA VE SATINALMA KOMİSYONU */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          backgroundColor: "#f2f2f2",
          border: "1px solid #000",
          padding: "3px 5px",
          fontSize: "9.5pt",
          textTransform: "uppercase",
          marginTop: "6px",
        }}
      >
        PİYASA ARAŞTIRMA VE SATINALMA KOMİSYONU
      </div>
      <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          marginBottom: "10px",
          fontSize: "9pt",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #000",
                padding: "3px 6px",
                fontWeight: "bold",
                backgroundColor: "#f9f9f9",
                width: "35%",
                textAlign: "left",
              }}
            >
              Komisyondaki Sıfatı/Ünvanı
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "3px 6px",
                fontWeight: "bold",
                backgroundColor: "#f9f9f9",
                width: "40%",
                textAlign: "left",
              }}
            >
              Adı, Soyadı
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "3px 6px",
                fontWeight: "bold",
                backgroundColor: "#f9f9f9",
                width: "25%",
                textAlign: "left",
              }}
            >
              Pozisyonu
            </th>
          </tr>
        </thead>
        <tbody>
          {fiyatUyeleri.length > 0
            ? (
              fiyatUyeleri.map((u: any, idx: number) => (
                <tr key={idx}>
                  <td
                    style={{ border: "1px solid #000", padding: "3px 6px" }}
                  >
                    {u.gorevi || "Üye"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "3px 6px",
                      fontWeight: "bold",
                    }}
                  >
                    {u.adSoyad || u.adi}
                  </td>
                  <td
                    style={{ border: "1px solid #000", padding: "3px 6px" }}
                  >
                    {u.unvan || u.unvani}
                  </td>
                </tr>
              ))
            )
            : (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    border: "1px solid #000",
                    padding: "4px 6px",
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  Komisyon üyesi bulunmamaktadır.
                </td>
              </tr>
            )}
        </tbody>
      </table>

      {/* Table 2: MUAYENE KABUL VE TESLİM ALMA KOMİSYONU (Yalnızca üye varsa gösterilir) */}
      {muayeneUyeleri.length > 0 && (
        <>
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              backgroundColor: "#f2f2f2",
              border: "1px solid #000",
              padding: "3px 5px",
              fontSize: "9.5pt",
              textTransform: "uppercase",
            }}
          >
            MUAYENE KABUL VE TESLİM ALMA KOMİSYONU
          </div>
          <table
            style={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "collapse",
              marginBottom: "10px",
              fontSize: "9pt",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "3px 6px",
                    fontWeight: "bold",
                    backgroundColor: "#f9f9f9",
                    width: "35%",
                    textAlign: "left",
                  }}
                >
                  Komisyondaki Sıfatı/Ünvanı
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "3px 6px",
                    fontWeight: "bold",
                    backgroundColor: "#f9f9f9",
                    width: "40%",
                    textAlign: "left",
                  }}
                >
                  Adı, Soyadı
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "3px 6px",
                    fontWeight: "bold",
                    backgroundColor: "#f9f9f9",
                    width: "25%",
                    textAlign: "left",
                  }}
                >
                  Pozisyonu
                </th>
              </tr>
            </thead>
            <tbody>
              {muayeneUyeleri.map((u: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #000", padding: "3px 6px" }}>
                    {u.gorevi || "Üye"}
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "3px 6px",
                      fontWeight: "bold",
                    }}
                  >
                    {u.adSoyad || u.adi}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px" }}>
                    {u.unvan || u.unvani}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Görevlendirmeyi Yapan Yetkili / Harcama Yetkilisi İmzası (Sağ) */}
      <PersonelCard
        adSoyad={onaylayanAdi}
        unvan={onaylayanUnvan}
        align="right"
        marginTop={20}
        marginBottom={20}
        nameField="baskanAdi"
        unvanField="baskanUnvan"
      />
    </>
  );

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
          fontSize: "10pt",
          color: "#000",
          fontFamily: "'Times New Roman', Times, serif",
          lineHeight: 1.35,
        }}
      >
        {renderTopSection()}
        {renderTablesAndSigner()}
      </div>
    </DocumentLayout>
  );
}
