import React from "react";
import { EditableField, FIELD_SOURCE_INFO } from "./EditableField";
import { useTemplateEdit } from "./TemplateEditContext";
import { cleanPersonelName, toIsoDate, toTrDate } from "../utils/textHelpers";
import { buildMergedPersonelList } from "./personelPoolHelpers";

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

  const tooltipText =
    FIELD_SOURCE_INFO[name] ||
    "ℹ️ Tarih seçmek veya değiştirmek için takvime tıklayın.";

  return (
    <input
      type="date"
      value={isoVal}
      placeholder={placeholder}
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
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const cleanVal = cleanPersonelName(value);
  const personelList = buildMergedPersonelList(
    personelListesi,
    data,
    cleanVal,
    unvanField && data ? data[unvanField] : undefined,
  );
  const matched = personelList.find(
    (p: any) =>
      p.ad_soyad &&
      cleanPersonelName(p.ad_soyad).toLowerCase() === cleanVal.toLowerCase(),
  );
  const selectedValue = matched ? String(matched.id || matched.ad_soyad) : "";

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
            const val = e.target.value;
            const p = personelList.find(
              (item: any) => String(item.id || item.ad_soyad) === val,
            );
            if (p && onFieldChange) {
              const cleanName = cleanPersonelName(p.ad_soyad);
              onFieldChange(nameField, cleanName);
              if (unvanField) {
                onFieldChange(unvanField, p.unvan || "");
              }
            } else if (onFieldChange && val === "") {
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
          {personelList.map((p: any, idx: number) => (
            <option key={p.id || idx} value={String(p.id || p.ad_soyad)}>
              {p.label || `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
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
              const sunum = (b.sunum_makami || b.birim_adi || b.ad || "")
                .trim()
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

