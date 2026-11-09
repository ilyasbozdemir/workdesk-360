import React from "react";
import { useTemplateEdit } from "./TemplateEditContext";
import { cleanPersonelName, toTrDate } from "../utils/textHelpers";
import { buildMergedPersonelList } from "./personelPoolHelpers";

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
  const { isEditing, onFieldChange, personelListesi, data } = useTemplateEdit();
  const personelList = buildMergedPersonelList(personelListesi, data);

  const defaultHarcamaAdi =
    (data && data.harcamaYetkilisiAdi ? data.harcamaYetkilisiAdi : "") ||
    (data && data.onaylayanPersonelAdi ? data.onaylayanPersonelAdi : "") ||
    "";
  const defaultHarcamaUnvan =
    (data && data.harcamaYetkilisiUnvan ? data.harcamaYetkilisiUnvan : "") ||
    "Harcama Yetkilisi";

  const olurPool = (Array.isArray(personelListesi) ? personelListesi : []).filter((p: any) => {
    const rawHarcama = cleanPersonelName(defaultHarcamaAdi);
    const pName = cleanPersonelName(p.ad_soyad);
    if (rawHarcama && pName.toLowerCase() === rawHarcama.toLowerCase()) return true;
    const isExecutive = !p.birim_id && (!p.birim || String(p.birim).trim() === "");
    if (isExecutive) return true;
    const uStr = `${p.unvan || ""} ${p.gorev || ""}`.toLowerCase();
    return (
      uStr.includes("harcama yetkili") ||
      uStr.includes("başkan") ||
      uStr.includes("kaymakam") ||
      uStr.includes("rektör") ||
      uStr.includes("genel müdür")
    );
  });

  const effectiveMode = data?.belgeModu || belgeModu || "standart";

  // Birleştirilmiş rota / koordinasyon listesi
  const activeRota: RotaItem[] =
    data?.rota && Array.isArray(data.rota)
      ? data.rota
      : Array.isArray(rota)
      ? rota
      : Array.isArray(koordinasyon)
      ? koordinasyon.map((k) => ({
          t: k.rol || "Koordinasyon",
          a: k.adSoyad || "",
          u: k.unvan || "",
          tarih: k.tarih || toTrDate(new Date()),
        }))
      : [];

  const items: Array<{
    tur: string;
    adSoyad: string;
    unvan: string;
    tarih: string;
  }> = activeRota.map((r) => ({
    tur: r.t || "Paraf",
    adSoyad: cleanPersonelName(r.a) || "",
    unvan: r.u || "",
    tarih: r.tarih || toTrDate(new Date()),
  }));

  const handleUpdateStep = (idx: number, field: keyof RotaItem, val: string) => {
    if (!onFieldChange) return;
    const updated = [...activeRota];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === "t" && val === "Olur" && defaultHarcamaAdi && !updated[idx].a) {
      updated[idx].a = cleanPersonelName(defaultHarcamaAdi);
      if (defaultHarcamaUnvan) {
        updated[idx].u = defaultHarcamaUnvan;
      }
    }
    onFieldChange("rota", updated);
  };

  const handleSelectRotaPersonel = (idx: number, personelId: string) => {
    if (!onFieldChange) return;
    const isOlur = activeRota[idx]?.t === "Olur";
    const pool = isOlur && olurPool.length > 0 ? olurPool : personelList;
    const p = pool.find(
      (item: any) => String(item.id || item.ad_soyad) === personelId,
    );
    if (!p) return;
    const cleanName = cleanPersonelName(p.ad_soyad);
    const updated = [...activeRota];
    updated[idx] = {
      ...updated[idx],
      a: cleanName,
      u: p.unvan || updated[idx]?.u || "",
    };
    onFieldChange("rota", updated);
  };

  const handleAddStep = () => {
    if (!onFieldChange) return;
    const today = toTrDate(new Date());
    const updated = [
      ...activeRota,
      {
        t: activeRota.length === 0 ? "Hazırlayan" : "Paraf",
        a: "",
        u: "",
        tarih: today,
      },
    ];
    onFieldChange("rota", updated);
  };

  const handleDeleteStep = (idx: number) => {
    if (!onFieldChange) return;
    const updated = activeRota.filter((_, i) => i !== idx);
    onFieldChange("rota", updated);
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    if (!onFieldChange) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === activeRota.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...activeRota];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    onFieldChange("rota", updated);
  };

  const handleInitializeDefaultRota = () => {
    if (!onFieldChange) return;
    const today = toTrDate(new Date());
    const initialRota: RotaItem[] = [];
    const hName =
      data?.hazirlayanPersonelAdi ||
      (personelList[0]?.ad_soyad
        ? cleanPersonelName(personelList[0].ad_soyad)
        : "");
    const hUnvan =
      data?.hazirlayanPersonelUnvan ||
      personelList[0]?.unvan ||
      "Görevli Personel";
    initialRota.push({ t: "Hazırlayan", a: hName, u: hUnvan, tarih: today });

    if (personelList.length > 1) {
      initialRota.push({
        t: "Paraf",
        a: cleanPersonelName(personelList[1].ad_soyad),
        u: personelList[1].unvan || "Birim Yetkilisi",
        tarih: today,
      });
    } else {
      initialRota.push({ t: "Paraf", a: "", u: "Birim Yetkilisi", tarih: today });
    }

    if (data?.onaylayanPersonelAdi) {
      initialRota.push({
        t: "İmza",
        a: data.onaylayanPersonelAdi,
        u: data.onaylayanPersonelUnvan || "Harcama Yetkilisi",
        tarih: today,
      });
    }
    onFieldChange("belgeModu", "koordinasyonlu");
    onFieldChange("rota", initialRota);
  };

  // Eğer koordinasyonlu mod aktif değilse ve liste boşsa
  if (items.length === 0 && effectiveMode !== "koordinasyonlu") {
    if (isEditing) {
      return (
        <div
          style={{
            marginTop: `${marginTop}px`,
            textAlign: "center",
            padding: "4px",
            pageBreakInside: "avoid",
          }}
        >
          <button
            type="button"
            onClick={handleInitializeDefaultRota}
            style={{
              fontSize: "7.5pt",
              color: "#2563eb",
              backgroundColor: "#f8fafc",
              border: "1px dashed #93c5fd",
              borderRadius: "4px",
              padding: "3px 10px",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Belgeye alt paraf / koordinasyon tablosu ekle"
          >
            ⚡ + Paraf &amp; Koordinasyon Akışı Ekle
          </button>
        </div>
      );
    }
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
      {items.length === 0 ? (
        <div
          style={{
            fontSize: "8pt",
            color: "#64748b",
            backgroundColor: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "6px",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            Koordinasyonlu mod aktif ancak henüz adım eklenmedi.
          </div>
          {isEditing && (
            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleInitializeDefaultRota}
                style={{
                  fontSize: "7.5pt",
                  padding: "3px 8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ⚡ Otomatik Rota Oluştur
              </button>
              <button
                type="button"
                onClick={handleAddStep}
                style={{
                  fontSize: "7.5pt",
                  padding: "3px 8px",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
              >
                + Boş Adım Ekle
              </button>
            </div>
          )}
        </div>
      ) : isEditing ? (
        /* ================= CANLI DÜZENLEME MODU ================= */
        <div style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "8pt",
                fontWeight: 700,
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              🔀 Belge Koordinasyon / Paraf Akışı ({items.length} Adım)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={handleAddStep}
                style={{
                  fontSize: "7pt",
                  padding: "2px 6px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                + Adım Ekle
              </button>
              <button
                type="button"
                onClick={() => onFieldChange && onFieldChange("belgeModu", "standart")}
                style={{
                  fontSize: "7pt",
                  padding: "2px 6px",
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
                title="Standart moda dön ve tabloyu gizle"
              >
                ✕ Standart Moda Dön
              </button>
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "7.5pt",
              lineHeight: 1.35,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#475569" }}>
                <th style={{ textAlign: "left", padding: "2px 4px", width: "75px" }}>Tarih</th>
                <th style={{ textAlign: "left", padding: "2px 4px", width: "95px" }}>İşlem / Rol</th>
                <th style={{ textAlign: "left", padding: "2px 4px" }}>Adı Soyadı &amp; Personel</th>
                <th style={{ textAlign: "left", padding: "2px 4px" }}>Unvanı</th>
                <th style={{ textAlign: "center", padding: "2px 4px", width: "60px" }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {activeRota.map((r, idx) => {
                const matchedPersonel = personelList.find(
                  (p: any) =>
                    p.ad_soyad &&
                    String(p.ad_soyad).trim().toLowerCase() ===
                      String(r.a || "").trim().toLowerCase(),
                );
                return (
                  <tr key={idx} style={{ borderBottom: "1px dotted #e2e8f0" }}>
                    <td style={{ padding: "2px 4px" }}>
                      <input
                        type="text"
                        value={r.tarih || ""}
                        onChange={(e) => handleUpdateStep(idx, "tarih", e.target.value)}
                        style={{
                          width: "70px",
                          fontSize: "7pt",
                          padding: "1px 3px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "3px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      <select
                        value={r.t || "Paraf"}
                        onChange={(e) => handleUpdateStep(idx, "t", e.target.value)}
                        style={{
                          fontSize: "7pt",
                          padding: "1px 3px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "3px",
                          width: "90px",
                          fontWeight: 600,
                        }}
                      >
                        <option value="Hazırlayan">Hazırlayan</option>
                        <option value="Paraf">Paraf</option>
                        <option value="Koordinasyon">Koordinasyon</option>
                        <option value="Kontrol">Kontrol</option>
                        <option value="İmza">İmza</option>
                        <option value="Olur">Olur</option>
                      </select>
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <select
                          value={matchedPersonel ? String(matchedPersonel.id) : ""}
                          onChange={(e) => handleSelectRotaPersonel(idx, e.target.value)}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "3px",
                            backgroundColor: "#f8fafc",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">👤 Personel Seç...</option>
                          {((r.t === "Olur" && olurPool.length > 0)
                            ? olurPool
                            : personelList
                          ).map((p: any) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.ad_soyad} {p.unvan ? `(${p.unvan})` : ""}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={r.a || ""}
                          onChange={(e) => handleUpdateStep(idx, "a", e.target.value)}
                          placeholder="Adı Soyadı"
                          style={{
                            fontSize: "7pt",
                            padding: "1px 3px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "3px",
                            fontWeight: 600,
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "2px 4px" }}>
                      <input
                        type="text"
                        value={r.u || ""}
                        onChange={(e) => handleUpdateStep(idx, "u", e.target.value)}
                        placeholder="Unvanı"
                        style={{
                          width: "100%",
                          fontSize: "7pt",
                          padding: "1px 3px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "3px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "2px 4px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "up")}
                          disabled={idx === 0}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "2px",
                            backgroundColor: idx === 0 ? "#f1f5f9" : "#fff",
                            cursor: idx === 0 ? "default" : "pointer",
                          }}
                          title="Yukarı Taşı"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "down")}
                          disabled={idx === activeRota.length - 1}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "2px",
                            backgroundColor: idx === activeRota.length - 1 ? "#f1f5f9" : "#fff",
                            cursor: idx === activeRota.length - 1 ? "default" : "pointer",
                          }}
                          title="Aşağı Taşı"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStep(idx)}
                          style={{
                            fontSize: "6.5pt",
                            padding: "1px 3px",
                            border: "1px solid #fca5a5",
                            borderRadius: "2px",
                            backgroundColor: "#fef2f2",
                            color: "#b91c1c",
                            cursor: "pointer",
                          }}
                          title="Adımı Sil"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= RESMÎ / BASKI / ÖNİZLEME MODU ================= */
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "7.5pt",
            lineHeight: 1.35,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
              <th style={{ textAlign: "left", padding: "2px 4px", width: "80px" }}>Tarih</th>
              <th style={{ textAlign: "left", padding: "2px 4px", width: "90px" }}>İşlem / Rol</th>
              <th style={{ textAlign: "left", padding: "2px 4px" }}>Unvanı</th>
              <th style={{ textAlign: "left", padding: "2px 4px" }}>Adı Soyadı</th>
              <th style={{ textAlign: "center", padding: "2px 4px", width: "70px" }}>Paraf / İmza</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: "1px dotted #f1f5f9" }}>
                <td style={{ padding: "2px 4px", color: "#334155" }}>{it.tarih}</td>
                <td style={{ padding: "2px 4px", fontWeight: "600", color: "#1e293b" }}>{it.tur}</td>
                <td style={{ padding: "2px 4px", color: "#475569" }}>{it.unvan || "-"}</td>
                <td style={{ padding: "2px 4px", fontWeight: "500", color: "#0f172a" }}>{it.adSoyad || "-"}</td>
                <td style={{ padding: "2px 4px", textAlign: "center", color: "#94a3b8", fontSize: "7pt" }}>
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

