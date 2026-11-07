import React from "react";
import { EditableField } from "../../../document/EditableField";
import { useTemplateEdit } from "../../../document/TemplateEditContext";
import {
  buildMergedPersonelList,
  cleanPersonelName,
} from "../../../document/ApprovalSignature";

interface PiyasaFiyatGorevlilerProps {
  displayKomisyon: any[];
}

export const PiyasaFiyatGorevliler: React.FC<PiyasaFiyatGorevlilerProps> = ({
  displayKomisyon,
}) => {
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const personelList = buildMergedPersonelList(personelListesi, data);

  const handleSelectMember = (idx: number, val: string) => {
    if (!onFieldChange) return;
    const p = personelList.find(
      (item: any) => String(item.id || item.ad_soyad) === val,
    );
    const updated = displayKomisyon.map((u: any, i: number) => {
      if (i !== idx) return u;
      if (!p) return { ...u, adSoyad: "", ad_soyad: "", unvan: "" };
      const cName = cleanPersonelName(p.ad_soyad);
      return {
        ...u,
        id: p.id,
        adSoyad: cName,
        ad_soyad: cName,
        unvan: p.unvan || u.unvan || "",
      };
    });
    onFieldChange("fiyatArastirmaGorevlileri", updated);
    onFieldChange("komisyon", updated);
  };

  return (
    <div
      style={{
        marginTop: "15px",
        textAlign: "center",
        pageBreakInside: "avoid",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: "9.5pt",
          marginBottom: "15px",
        }}
      >
        Piyasa Fiyat Araştırması Görevlisi / Görevlileri
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          textAlign: "center",
        }}
      >
        {displayKomisyon.map((uye: any, idx: number) => {
          const memberName = uye.adSoyad || uye.ad_soyad || "";
          const matched = personelList.find(
            (p: any) =>
              p.ad_soyad &&
              cleanPersonelName(p.ad_soyad).toLowerCase() ===
                cleanPersonelName(memberName).toLowerCase(),
          );
          const selectedValue = matched
            ? String(matched.id || matched.ad_soyad)
            : "";

          return (
            <div
              key={idx}
              style={{
                width: "22%",
                minWidth: "120px",
                padding: "5px",
                fontSize: "9pt",
                lineHeight: 1.35,
              }}
            >
              {isEditing && personelList.length > 0 && (
                <div style={{ marginBottom: "3px" }}>
                  <select
                    value={selectedValue}
                    onChange={(e) => handleSelectMember(idx, e.target.value)}
                    style={{
                      fontSize: "7pt",
                      padding: "1px 4px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      maxWidth: "150px",
                      cursor: "pointer",
                    }}
                    title="Kayıtlı personellerden görevli seçin"
                  >
                    <option value="">👤 Görevli Seç...</option>
                    {personelList.map((p: any, pIdx: number) => (
                      <option
                        key={p.id || pIdx}
                        value={String(p.id || p.ad_soyad)}
                      >
                        {p.label ||
                          `${p.ad_soyad}${p.unvan ? ` (${p.unvan})` : ""}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <span
                style={{ fontWeight: "bold", textTransform: "uppercase" }}
              >
                <EditableField
                  name={`komisyon.${idx}.adSoyad`}
                  value={memberName}
                  placeholder="Adı Soyadı"
                />
              </span>
              <br />
              <span>
                <EditableField
                  name={`komisyon.${idx}.unvan`}
                  value={uye.unvan || ""}
                  placeholder="Unvanı"
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
