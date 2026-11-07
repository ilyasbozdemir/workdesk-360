import React from "react";
import { EditableField } from "./EditableField";
import { useTemplateEdit } from "./TemplateEditContext";
import { cleanPersonelName, toIsoDate, toTrDate } from "../utils/textHelpers";
import {
  buildMergedPersonelList,
  doesPersonelBelongToBirim,
  filterPersonelByBirim,
  findBirimInList,
  isPersonelActive,
  validateBirimAndPersonelAssignments,
  type BirimPersonelFilterOptions,
  type BirimPersonelFilterResult,
  type BirimPersonelValidationWarning,
  type MergedPersonelItem,
} from "./personelPoolHelpers";
import {
  BirimInlineSelect,
  DateEditableField,
  EditableOlurPlaceholder,
  PersonelInlineSelect,
  type BirimInlineSelectProps,
  type DateEditableFieldProps,
  type PersonelInlineSelectProps,
} from "./DocumentInlineControls";
import {
  DocumentMetadata,
  MetadataBlock,
  type DocumentMetadataProps,
  type MetadataBlockProps,
} from "./MetadataBlock";
import {
  RotaKoordinasyonBlock,
  type KoordinasyonItem,
  type RotaItem,
  type RotaKoordinasyonBlockProps,
} from "./RotaKoordinasyonBlock";

export {
  cleanPersonelName,
  toIsoDate,
  toTrDate,
  isPersonelActive,
  findBirimInList,
  doesPersonelBelongToBirim,
  filterPersonelByBirim,
  validateBirimAndPersonelAssignments,
  buildMergedPersonelList,
  DateEditableField,
  PersonelInlineSelect,
  BirimInlineSelect,
  EditableOlurPlaceholder,
  MetadataBlock,
  DocumentMetadata,
  RotaKoordinasyonBlock,
  type MergedPersonelItem,
  type BirimPersonelFilterOptions,
  type BirimPersonelFilterResult,
  type BirimPersonelValidationWarning,
  type DateEditableFieldProps,
  type PersonelInlineSelectProps,
  type BirimInlineSelectProps,
  type MetadataBlockProps,
  type DocumentMetadataProps,
  type RotaItem,
  type KoordinasyonItem,
  type RotaKoordinasyonBlockProps,
};

interface PersonelCardProps {
  adSoyad?: string | null;
  unvan?: string | null;
  telefon?: string | null;
  eposta?: string | null;
  align?: "left" | "center" | "right";
  marginTop?: number;
  marginBottom?: number;
  showContactInfo?: boolean;
  nameField?: string;
  unvanField?: string;
  placeholderName?: string;
  placeholderUnvan?: string;
  isFirmaSelect?: boolean;
  role?: string;
}

export const PersonelCard: React.FC<PersonelCardProps> = ({
  adSoyad,
  unvan,
  telefon,
  eposta,
  align = "center",
  marginTop = 20,
  marginBottom = 20,
  showContactInfo = false,
  nameField = "hazirlayanPersonelAdi",
  unvanField = "hazirlayanPersonelUnvan",
  placeholderName,
  placeholderUnvan,
  isFirmaSelect = false,
}) => {
  const { isEditing, onFieldChange, personelListesi, firmaListesi, data } =
    useTemplateEdit();
  const personelList = buildMergedPersonelList(
    personelListesi,
    data,
    isFirmaSelect ? null : adSoyad,
    isFirmaSelect ? null : unvan,
  );
  const rawFirmaList =
    (firmaListesi && firmaListesi.length > 0
      ? firmaListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activeFirmaListesi
      : []) || [];

  const normalizedFirmaList = rawFirmaList.map((item: any) => {
    if (item && item.firm) {
      const u =
        item.firm.unvan ||
        item.firm.firma_adi ||
        item.unvan ||
        "İstekli Firma";
      return {
        ...item.firm,
        id: item.firm.id || item.id,
        unvan: u,
        total: item.total,
        isWinner: item.isWinner,
        label:
          item.label ||
          item.firm.label ||
          (item.total > 0 ? `${u} (${item.total} TL)` : u),
      };
    }
    const u = item?.unvan || item?.firma_adi || item?.name || "";
    return {
      ...item,
      unvan: u,
      label: item?.label || u,
    };
  });

  const firmaList = [...normalizedFirmaList];
  if (
    adSoyad &&
    isFirmaSelect &&
    !firmaList.some(
      (f: any) =>
        (f.unvan || f.label) &&
        String(f.unvan || f.label).trim().toLowerCase() ===
          String(adSoyad).trim().toLowerCase(),
    )
  ) {
    firmaList.unshift({
      id: `custom_${adSoyad}`,
      unvan: adSoyad,
      label: adSoyad,
    });
  }

  const validFirmaList = firmaList.filter(
    (f: any) =>
      f && (f.unvan || f.label) && String(f.unvan || f.label).trim() !== "",
  );

  const matched = isFirmaSelect
    ? validFirmaList.find(
        (f: any) =>
          f.unvan &&
          String(f.unvan).trim().toLowerCase() ===
            cleanPersonelName(adSoyad).toLowerCase(),
      )
    : personelList.find(
        (p: any) =>
          p.ad_soyad &&
          cleanPersonelName(p.ad_soyad).toLowerCase() ===
            cleanPersonelName(adSoyad).toLowerCase(),
      );

  const selectedValue = matched
    ? String(matched.id || (matched as any).unvan || (matched as any).ad_soyad)
    : "";

  const namePlaceholder =
    placeholderName ||
    (isFirmaSelect
      ? "Firma Adı / Kaşe"
      : isEditing && personelList.length > 0
      ? "Adı Soyadı"
      : "Adı Soyadı / Kaşe");
  const unvanPlaceholder = placeholderUnvan || "Unvanı";

  const effectiveAdSoyad =
    adSoyad || (data && nameField ? data[nameField] : "") || "";
  const effectiveUnvan =
    unvan || (data && unvanField ? data[unvanField] : "") || "";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
            ? "flex-end"
            : "flex-start",
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
      }}
    >
      <div
        style={{
          textAlign: "center",
          minWidth: "180px",
          maxWidth: "100%",
          lineHeight: 1.45,
        }}
      >
        {isEditing &&
          (isFirmaSelect
            ? validFirmaList.length > 0
            : personelList.length > 0) && (
            <div style={{ marginBottom: "3px" }}>
              <select
                value={selectedValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isFirmaSelect) {
                    const f = validFirmaList.find(
                      (item: any) => String(item.id || item.unvan) === val,
                    );
                    if (f && onFieldChange) {
                      onFieldChange(nameField, f.unvan);
                      onFieldChange(
                        unvanField,
                        f.yetkili_ad_soyad
                          ? `Yetkili: ${f.yetkili_ad_soyad}`
                          : "Yüklenici Firma / Yetkilisi",
                      );
                    } else if (onFieldChange && val === "") {
                      onFieldChange(nameField, "");
                      onFieldChange(unvanField, "");
                    }
                  } else {
                    const p = personelList.find(
                      (item: any) => String(item.id || item.ad_soyad) === val,
                    );
                    if (p && onFieldChange) {
                      const cleanName = cleanPersonelName(p.ad_soyad);
                      onFieldChange(nameField, cleanName);
                      onFieldChange(unvanField, p.unvan || "");
                    } else if (onFieldChange && val === "") {
                      onFieldChange(nameField, "");
                      onFieldChange(unvanField, "");
                    }
                  }
                }}
                style={{
                  fontSize: "7.5pt",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  maxWidth: "180px",
                  cursor: "pointer",
                  margin: "0 auto",
                }}
                title={
                  isFirmaSelect
                    ? "Kayıtlı/İstekli firmalardan seçim yapın"
                    : "Kayıtlı personellerden seçim yapın"
                }
              >
                <option value="">
                  {isFirmaSelect
                    ? "🏢 Firma Seç... (Seçim Yok / Null)"
                    : "👤 Personel Seç..."}
                </option>
                {isFirmaSelect
                  ? validFirmaList.map((f: any, idx: number) => (
                      <option key={f.id || idx} value={String(f.id || f.unvan)}>
                        {f.label || f.unvan}
                      </option>
                    ))
                  : personelList.map((p: any, idx: number) => (
                      <option
                        key={p.id || idx}
                        value={String(p.id || p.ad_soyad)}
                      >
                        {p.label ||
                          `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
                      </option>
                    ))}
              </select>
            </div>
          )}

        <div style={{ fontWeight: "bold", fontSize: "11pt" }}>
          <EditableField
            name={nameField}
            value={cleanPersonelName(effectiveAdSoyad) || ""}
            placeholder={namePlaceholder}
          />
        </div>
        <div style={{ fontSize: "11pt" }}>
          <EditableField
            name={unvanField}
            value={effectiveUnvan || ""}
            placeholder={unvanPlaceholder}
          />
        </div>
        {showContactInfo && (
          <>
            {telefon && (
              <div style={{ fontSize: "10pt", color: "#666" }}>
                Tel: {telefon}
              </div>
            )}
            {eposta && (
              <div style={{ fontSize: "10pt", color: "#666" }}>
                E-posta: {eposta}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface ApprovalSignatureProps {
  title?: string;
  date?: string | null;
  adSoyad?: string | null;
  unvan?: string | null;
  showSpace?: boolean;
  marginTop?: number;
  align?: "left" | "center" | "right";
  nameField?: string;
  unvanField?: string;
  dateField?: string;
}

export const ApprovalSignature: React.FC<ApprovalSignatureProps> = ({
  title = "OLUR",
  date,
  adSoyad,
  unvan,
  showSpace = true,
  marginTop = 40,
  align = "center",
  nameField = "onaylayanPersonelAdi",
  unvanField = "onaylayanPersonelUnvan",
  dateField = "onayTarihi",
}) => {
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const personelList = buildMergedPersonelList(
    personelListesi,
    data,
    adSoyad,
    unvan,
  );
  const matched = personelList.find(
    (p: any) =>
      p.ad_soyad &&
      cleanPersonelName(p.ad_soyad).toLowerCase() ===
        cleanPersonelName(adSoyad).toLowerCase(),
  );
  const selectedValue = matched ? String(matched.id || matched.ad_soyad) : "";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
            ? "flex-end"
            : "flex-start",
        marginTop: `${marginTop}px`,
      }}
    >
      <div
        style={{
          textAlign: "center",
          minWidth: "220px",
          lineHeight: 1.5,
          position: "relative",
        }}
      >
        <div
          style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "4px" }}
        >
          <EditableField name="olurBaslik" value={title} placeholder="OLUR" />
        </div>

        <div style={{ fontSize: "11pt", marginBottom: "8px" }}>
          <DateEditableField
            name={dateField}
            value={date || ""}
            placeholder="GG.AA.YYYY"
          />
        </div>

        {isEditing && personelList.length > 0 && (
          <div style={{ marginTop: "4px", marginBottom: "6px" }}>
            <select
              value={selectedValue}
              onChange={(e) => {
                const val = e.target.value;
                const p = personelList.find(
                  (item: any) => String(item.id || item.ad_soyad) === val,
                );
                if (p && onFieldChange) {
                  const cleanName = cleanPersonelName(p.ad_soyad);
                  onFieldChange(nameField, cleanName);
                  onFieldChange(unvanField, p.unvan || "");
                  // Otomatik rota senkronizasyonu
                  if (data && Array.isArray(data.rota) && data.rota.length > 0) {
                    const updatedRota = data.rota.map((r: any) => {
                      if (
                        r.t === "İmza" ||
                        r.t === "Olur" ||
                        (r as any).rol === "İmza" ||
                        (r as any).rol === "Olur"
                      ) {
                        return { ...r, a: cleanName, u: p.unvan || r.u };
                      }
                      return r;
                    });
                    onFieldChange("rota", updatedRota);
                  }
                } else if (onFieldChange && val === "") {
                  onFieldChange(nameField, "");
                  onFieldChange(unvanField, "");
                }
              }}
              style={{
                fontSize: "7.5pt",
                padding: "2px 4px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                maxWidth: "180px",
                cursor: "pointer",
                margin: "0 auto",
              }}
              title="Kayıtlı personellerden seçim yapın"
            >
              <option value="">👤 Personel Seç...</option>
              {personelList.map((p: any, idx: number) => (
                <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
                  {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {showSpace && (
          <div style={{ minHeight: "24px", marginBottom: "4px" }} />
        )}

        <div
          style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "4px" }}
        >
          <EditableField
            name={nameField}
            value={adSoyad || ""}
            placeholder={
              isEditing && personelList.length > 0
                ? "Adı Soyadı"
                : "Onaylayan Adı Soyadı"
            }
          />
        </div>

        <div style={{ fontSize: "11pt" }}>
          <EditableField
            name={unvanField}
            value={unvan || ""}
            placeholder="Unvanı"
          />
        </div>
      </div>
    </div>
  );
};

interface CommissionMember {
  adSoyad: string;
  unvan: string;
  gorevi?: string;
}

interface CommissionListProps {
  members: CommissionMember[];
  title?: string;
  marginTop?: number;
}

export const CommissionList: React.FC<CommissionListProps> = ({
  members,
  title = "Komisyon Üyeleri",
  marginTop = 30,
}) => {
  if (!members || members.length === 0) return null;

  return (
    <div
      style={{
        marginTop: `${marginTop}px`,
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <div
        style={{ fontWeight: "bold", fontSize: "12pt", marginBottom: "15px" }}
      >
        {title}
      </div>

      {members.map((member, idx) => (
        <div key={idx} style={{ marginBottom: "12px", lineHeight: 1.6 }}>
          <div style={{ fontSize: "11pt" }}>
            <strong>{cleanPersonelName(member.adSoyad)}</strong>
          </div>
          <div style={{ fontSize: "10pt" }}>{member.unvan}</div>
          {member.gorevi && (
            <div style={{ fontSize: "10pt", color: "#666" }}>
              ({member.gorevi})
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
