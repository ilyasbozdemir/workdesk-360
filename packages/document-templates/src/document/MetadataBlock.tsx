import React from "react";
import type { CommonDocumentFields } from "@worksuite-360/document-engine";
import { EditableField } from "./EditableField";
import { DateEditableField } from "./DocumentInlineControls";
import { toTrDate } from "../utils/textHelpers";

export interface MetadataBlockProps {
  evrakSayisi?: string;
  tarih?: string;
  onayaSunulanTarih?: string;
  dosyaKonusu?: string;
  showBorder?: boolean;
}

export const MetadataBlock: React.FC<MetadataBlockProps> = ({
  evrakSayisi,
  tarih,
  onayaSunulanTarih,
  dosyaKonusu,
  showBorder = false,
}) => {
  const displayTarih = toTrDate(tarih || onayaSunulanTarih);

  // Sanitize dosyaKonusu if it contains accidental JSON string keys or quotes
  let cleanKonu = dosyaKonusu;
  if (typeof cleanKonu === "string") {
    const jsonMatch = cleanKonu.match(/"?[a-zA-Z0-9_]+"?\s*:\s*"([^"]+)"/);
    if (jsonMatch) {
      cleanKonu = jsonMatch[1];
    }
    cleanKonu = cleanKonu.replace(/^["']|["',]+$/g, "").trim();
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "16px",
        paddingBottom: showBorder ? "8px" : 0,
        borderBottom: showBorder ? `1px solid #ccc` : "none",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <div style={{ maxWidth: "65%", flex: "1 1 auto" }}>
        <table
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            fontSize: "11pt",
            borderSpacing: 0,
            width: "100%",
          }}
        >
          <tbody>
            {evrakSayisi !== undefined && (
              <tr>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 0",
                    width: "45px",
                  }}
                >
                  <strong>Sayı</strong>
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 5px 1px 0",
                    width: "10px",
                  }}
                >
                  <strong>:</strong>
                </td>
                <td style={{ verticalAlign: "top", padding: "1px 0" }}>
                  <EditableField name="evrakSayisi" value={evrakSayisi} />
                </td>
              </tr>
            )}
            {dosyaKonusu !== undefined && (
              <tr>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 0",
                    width: "45px",
                  }}
                >
                  <strong>Konu</strong>
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 5px 1px 0",
                    width: "10px",
                  }}
                >
                  <strong>:</strong>
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    padding: "1px 0",
                    textAlign: "justify",
                  }}
                >
                  <EditableField
                    name="dosyaKonusu"
                    value={cleanKonu}
                    style={{ width: "100%" }}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Boolean(displayTarih) && (
        <div
          style={{
            fontSize: "11pt",
            textAlign: "right",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingLeft: "16px",
            paddingTop: "1px",
          }}
        >
          <strong>Tarih:</strong>{" "}
          <DateEditableField name="onayaSunulanTarih" value={displayTarih} />
        </div>
      )}
    </div>
  );
};

export interface DocumentMetadataProps {
  data: Partial<CommonDocumentFields> & Record<string, any>;
  showBorder?: boolean;
}

/**
 * Merkezi Ortak Belge Üst Bilgi Bileşeni (DocumentMetadata)
 * MetadataBlock üzerine kurulu, CommonDocumentFields modelini doğrudan tüketen yardımcı bileşen.
 */
export const DocumentMetadata: React.FC<DocumentMetadataProps> = ({
  data,
  showBorder = false,
}) => {
  return (
    <MetadataBlock
      evrakSayisi={data?.evrakSayisi}
      tarih={data?.dosyaTarihi || data?.tarih}
      onayaSunulanTarih={data?.onayaSunulanTarih}
      dosyaKonusu={data?.dosyaKonusu || (data as any)?.konu}
      showBorder={showBorder}
    />
  );
};

