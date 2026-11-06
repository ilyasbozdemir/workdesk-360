import React from "react";
import type { CommonDocumentFields } from "@worksuite-360/document-engine";
import { EditableField, FIELD_SOURCE_INFO } from "./EditableField";
import { useTemplateEdit } from "./TemplateEditContext";
import { cleanPersonelName, toIsoDate, toTrDate } from "../utils/textHelpers";

export { cleanPersonelName, toIsoDate, toTrDate };

export interface DateEditableFieldProps {
  name: string;
  value?: string;
  placeholder?: string;
  defaultDate?: string;
}

export function DateEditableField({
  name,
  value,
  placeholder = "GG.AA.YYYY",
  defaultDate,
}: DateEditableFieldProps) {
  const { isEditing, onFieldChange } = useTemplateEdit();
  const rawVal = value || defaultDate;
  const displayVal = rawVal ? toTrDate(rawVal) : toTrDate(new Date());
  const isoVal = toIsoDate(displayVal);

  if (!isEditing || !onFieldChange) {
    return <span>{displayVal}</span>;
  }

  const tooltipText = FIELD_SOURCE_INFO[name] ||
    "ℹ️ Tarih seçmek veya değiştirmek için takvime tıklayın.";

  return (
    <input
      type="date"
      value={isoVal}
      onChange={(e) => {
        const val = e.target.value;
        if (val) {
          onFieldChange(name, toTrDate(val));
        }
      }}
      style={{
        fontSize: "inherit",
        fontFamily: "inherit",
        fontWeight: "inherit",
        color: "inherit",
        padding: "0 2px",
        borderRadius: "0",
        border: "none",
        borderBottom: "1px dashed #94a3b8",
        backgroundColor: "transparent",
        cursor: "pointer",
        display: "inline-block",
        outline: "none",
        verticalAlign: "baseline",
      }}
      title={tooltipText}
    />
  );
}

export interface PersonelInlineSelectProps {
  nameField: string;
  unvanField?: string;
  value?: string | null;
  placeholder?: string;
  onlyAdSoyad?: boolean;
}

export const PersonelInlineSelect: React.FC<PersonelInlineSelectProps> = ({
  nameField,
  unvanField,
  value,
  placeholder = "Personel Seçiniz...",
}) => {
  const { isEditing, onFieldChange, personelListesi } = useTemplateEdit();
  const personelList =
    (personelListesi && personelListesi.length > 0
      ? personelListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activePersonelListesi
      : []) || [];
  const cleanVal = cleanPersonelName(value);
  const matched = personelList.find(
    (p: any) =>
      p.ad_soyad &&
      String(p.ad_soyad).trim().toLowerCase() === cleanVal.toLowerCase(),
  );
  const selectedValue = matched ? String(matched.id) : "";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <EditableField
        name={nameField}
        value={cleanVal}
        placeholder={placeholder}
      />
      {isEditing && personelList.length > 0 && (
        <select
          value={selectedValue}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            const p = personelList.find((item: any) => item.id === selectedId);
            if (p && onFieldChange) {
              const cleanName = (p.ad_soyad || "").split("(")[0].trim();
              onFieldChange(nameField, cleanName);
              if (unvanField) {
                onFieldChange(unvanField, p.unvan || "");
              }
            } else if (onFieldChange && e.target.value === "") {
              onFieldChange(nameField, "");
              if (unvanField) {
                onFieldChange(unvanField, "");
              }
            }
          }}
          style={{
            fontSize: "7.5pt",
            padding: "1px 4px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#f8fafc",
            maxWidth: "140px",
            cursor: "pointer",
          }}
          title="Kayıtlı personellerden seç"
        >
          <option value="">👤 Seç...</option>
          {personelList.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ""}
            </option>
          ))}
        </select>
      )}
    </span>
  );
};

export interface BirimInlineSelectProps {
  nameField?: string;
  value?: string | null;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const BirimInlineSelect: React.FC<BirimInlineSelectProps> = ({
  nameField = "muhatapBirim",
  value,
  placeholder = "Muhatap Birim Seçiniz / Yazınız...",
  style,
}) => {
  const { isEditing, onFieldChange, birimListesi } = useTemplateEdit();
  const birimList = birimListesi || [];
  const cleanVal = typeof value === "string" ? value.trim() : "";
  const matched = birimList.find(
    (b: any) =>
      (b.sunum_makami &&
        String(b.sunum_makami).trim().toLowerCase() ===
          cleanVal.toLowerCase()) ||
      (b.birim_adi &&
        String(b.birim_adi).trim().toLowerCase() === cleanVal.toLowerCase()) ||
      (b.ad && String(b.ad).trim().toLowerCase() === cleanVal.toLowerCase()),
  );
  const selectedValue = matched ? String(matched.id) : "";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: "100%",
      }}
    >
      <EditableField
        name={nameField}
        value={cleanVal}
        placeholder={placeholder}
        style={style}
      />
      {isEditing && birimList.length > 0 && (
        <select
          value={selectedValue}
          onChange={(e) => {
            const selectedId = Number(e.target.value);
            const b = birimList.find((item: any) => item.id === selectedId);
            if (b && onFieldChange) {
              const sunum = (b.sunum_makami || b.birim_adi || b.ad || "").trim()
                .toUpperCase();
              onFieldChange(nameField, sunum);
            }
          }}
          style={{
            fontSize: "7.5pt",
            padding: "2px 4px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#f8fafc",
            maxWidth: "160px",
            cursor: "pointer",
            fontWeight: "normal",
            textTransform: "none",
          }}
          title="Tanımlı birimlerin muhatap/sunum makamından seç"
        >
          <option value="">🏢 Birim Seç...</option>
          {birimList.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.sunum_makami || b.birim_adi || b.ad}
            </option>
          ))}
        </select>
      )}
    </span>
  );
};

export const EditableOlurPlaceholder: React.FC = () => {
  const { isEditing, onFieldChange } = useTemplateEdit();
  if (!isEditing || !onFieldChange) return null;

  return (
    <div
      onClick={() => onFieldChange("olurYazisi", true)}
      style={{
        marginTop: "30px",
        padding: "8px 16px",
        border: "1.5px dashed #94a3b8",
        borderRadius: "8px",
        textAlign: "center",
        color: "#475569",
        fontSize: "10pt",
        fontWeight: "bold",
        cursor: "pointer",
        backgroundColor: "#f8fafc",
        userSelect: "none",
      }}
      title="OLUR bloğunu belgeye eklemek için tıklayın"
    >
      <span style={{ marginRight: "6px" }}>☑</span>
      OLUR Bloğu Gizli (Göster ve Düzenle)
    </div>
  );
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
  const { isEditing, onFieldChange, personelListesi, firmaListesi } =
    useTemplateEdit();
  const personelList =
    (personelListesi && personelListesi.length > 0
      ? personelListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activePersonelListesi
      : []) || [];
  const rawFirmaList =
    (firmaListesi && firmaListesi.length > 0
      ? firmaListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activeFirmaListesi
      : []) || [];

  const normalizedFirmaList = rawFirmaList.map((item: any) => {
    if (item && item.firm) {
      const u = item.firm.unvan || item.firm.firma_adi || item.unvan ||
        "İstekli Firma";
      return {
        ...item.firm,
        id: item.firm.id || item.id,
        unvan: u,
        total: item.total,
        isWinner: item.isWinner,
        label: item.label || item.firm.label ||
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
        String(p.ad_soyad).trim().toLowerCase() ===
          String(adSoyad || "").trim().toLowerCase(),
    );

  const selectedValue = matched ? String(matched.id || matched.unvan) : "";

  const namePlaceholder = placeholderName ||
    (isFirmaSelect
      ? "Firma Adı / Kaşe"
      : (isEditing && personelList.length > 0
        ? "Adı Soyadı"
        : "Adı Soyadı / Kaşe"));
  const unvanPlaceholder = placeholderUnvan || "Unvanı";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        justifyContent: align === "center"
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
        {isEditing && (
          <div style={{ marginBottom: "3px" }}>
            <select
              value={selectedValue}
              onChange={(e) => {
                const val = e.target.value;
                if (isFirmaSelect) {
                  const f = validFirmaList.find((item: any) =>
                    String(item.id || item.unvan) === val
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
                  const selectedId = Number(val);
                  const p = personelList.find((item: any) =>
                    item.id === selectedId
                  );
                  if (p && onFieldChange) {
                    onFieldChange(nameField, p.ad_soyad);
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
              title={isFirmaSelect
                ? "Kayıtlı/İstekli firmalardan seçim yapın"
                : "Kayıtlı personellerden seçim yapın"}
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
                : personelList.map((p: any) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ""}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div style={{ fontWeight: "bold", fontSize: "11pt" }}>
          <EditableField
            name={nameField}
            value={cleanPersonelName(adSoyad) || ""}
            placeholder={namePlaceholder}
          />
        </div>
        <div style={{ fontSize: "11pt" }}>
          <EditableField
            name={unvanField}
            value={unvan || ""}
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
  const { isEditing, onFieldChange, personelListesi } = useTemplateEdit();
  const personelList =
    (personelListesi && personelListesi.length > 0
      ? personelListesi
      : typeof window !== "undefined"
      ? (window as any)?.__activePersonelListesi
      : []) || [];
  const matched = personelList.find(
    (p: any) =>
      p.ad_soyad &&
      String(p.ad_soyad).trim().toLowerCase() ===
        String(adSoyad || "").trim().toLowerCase(),
  );
  const selectedValue = matched ? String(matched.id) : "";

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        justifyContent: align === "center"
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
                const selectedId = Number(e.target.value);
                const p = personelList.find((item: any) =>
                  item.id === selectedId
                );
                if (p && onFieldChange) {
                  onFieldChange(nameField, p.ad_soyad);
                  onFieldChange(unvanField, p.unvan || "");
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
              {personelList.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {showSpace && (
          <div
            style={{ minHeight: "24px", marginBottom: "4px" }}
          />
        )}

        <div
          style={{ fontSize: "11pt", fontWeight: "bold", marginTop: "4px" }}
        >
          <EditableField
            name={nameField}
            value={adSoyad || ""}
            placeholder={isEditing && personelList.length > 0
              ? "Adı Soyadı"
              : "Onaylayan Adı Soyadı"}
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

interface MetadataBlockProps {
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

export interface RotaItem {
  t?: string; // Tür: Hazırlayan, Paraf, Koordinasyon, İmza, Olur
  a?: string; // Ad Soyad
  u?: string; // Unvan
  sira?: number;
  tarih?: string;
}

export interface KoordinasyonItem {
  adSoyad?: string;
  unvan?: string;
  tarih?: string;
  rol?: string;
}

export interface RotaKoordinasyonBlockProps {
  rota?: RotaItem[];
  koordinasyon?: KoordinasyonItem[];
  belgeModu?: "standart" | "koordinasyonlu" | "hizli_onay";
  marginTop?: number;
}

export const RotaKoordinasyonBlock: React.FC<RotaKoordinasyonBlockProps> = ({
  rota,
  koordinasyon,
  belgeModu,
  marginTop = 24,
}) => {
  // Birleştirilmiş paraf/koordinasyon listesi
  const items: Array<{
    tur: string;
    adSoyad: string;
    unvan: string;
    tarih: string;
  }> = [];

  if (Array.isArray(rota) && rota.length > 0) {
    rota.forEach((r) => {
      items.push({
        tur: r.t || "Paraf",
        adSoyad: cleanPersonelName(r.a) || "",
        unvan: r.u || "",
        tarih: r.tarih || toTrDate(new Date()),
      });
    });
  }

  if (Array.isArray(koordinasyon) && koordinasyon.length > 0) {
    koordinasyon.forEach((k) => {
      items.push({
        tur: k.rol || "Koordinasyon",
        adSoyad: cleanPersonelName(k.adSoyad) || "",
        unvan: k.unvan || "",
        tarih: k.tarih || toTrDate(new Date()),
      });
    });
  }

  // Eğer koordinasyonlu mod aktif değilse ve liste boşsa render etme
  if (items.length === 0 && belgeModu !== "koordinasyonlu") {
    return null;
  }

  return (
    <div
      style={{
        marginTop: `${marginTop}px`,
        pageBreakInside: "avoid",
        breakInside: "avoid",
        width: "100%",
        borderTop: "1px dashed #cbd5e1",
        paddingTop: "8px",
      }}
    >
      <div
        style={{
          fontSize: "8pt",
          fontWeight: "bold",
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>Resmî Paraf &amp; Koordinasyon Akışı</span>
      </div>

      {items.length === 0
        ? (
          <div
            style={{
              fontSize: "8pt",
              color: "#94a3b8",
              fontStyle: "italic",
              padding: "4px 0",
            }}
          >
            Sol menüdeki "Belge Modu &amp; Rota Akışı" alanından
            paraf/koordinasyon adımları ekleyebilirsiniz.
          </div>
        )
        : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "7.5pt",
              lineHeight: 1.35,
            }}
          >
            <thead>
              <tr
                style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 4px",
                    width: "80px",
                  }}
                >
                  Tarih
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "2px 4px",
                    width: "90px",
                  }}
                >
                  İşlem / Rol
                </th>
                <th style={{ textAlign: "left", padding: "2px 4px" }}>
                  Unvanı
                </th>
                <th style={{ textAlign: "left", padding: "2px 4px" }}>
                  Adı Soyadı
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "2px 4px",
                    width: "70px",
                  }}
                >
                  Paraf / İmza
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: "1px dotted #f1f5f9" }}>
                  <td style={{ padding: "2px 4px", color: "#334155" }}>
                    {it.tarih}
                  </td>
                  <td
                    style={{
                      padding: "2px 4px",
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    {it.tur}
                  </td>
                  <td style={{ padding: "2px 4px", color: "#475569" }}>
                    {it.unvan || "-"}
                  </td>
                  <td
                    style={{
                      padding: "2px 4px",
                      fontWeight: "500",
                      color: "#0f172a",
                    }}
                  >
                    {it.adSoyad || "-"}
                  </td>
                  <td
                    style={{
                      padding: "2px 4px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "7pt",
                    }}
                  >
                    (Paraf)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
};
