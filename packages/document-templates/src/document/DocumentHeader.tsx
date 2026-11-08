import React, { useMemo } from "react";
import { BaseTemplate } from "../base.schema";
import { GLOBAL_THEME } from "../theme.config";
import {
  InstitutionalHeaderProvider,
  sanitizeBirimAntetSatiri,
} from "@worksuite-360/document-engine";

/**
 * Antet ek satırını güvenli biçimde temizler. DETSİS veya eski aktarımlardan
 * kalma "Kurum > Birim" hiyerarşisini ve kurum adını ayıklar.
 */
function safeSanitizeBirimSatiri(
  text?: string | null,
  kurumAdi?: string | null,
): string {
  if (typeof sanitizeBirimAntetSatiri === "function") {
    return sanitizeBirimAntetSatiri(text, kurumAdi);
  }
  if (
    typeof InstitutionalHeaderProvider !== "undefined" &&
    typeof InstitutionalHeaderProvider?.sanitizeBirimAntetSatiri === "function"
  ) {
    return InstitutionalHeaderProvider.sanitizeBirimAntetSatiri(text, kurumAdi);
  }
  if (!text) return "";
  let cleaned = String(text).trim();
  if (cleaned.includes(">")) {
    const parts = cleaned.split(">").map((p) => p.trim()).filter(Boolean);
    cleaned = parts[parts.length - 1] || cleaned;
  }
  if (kurumAdi && String(kurumAdi).trim()) {
    const kUpper = String(kurumAdi).trim().toLocaleUpperCase("tr-TR");
    const cUpper = cleaned.toLocaleUpperCase("tr-TR");
    if (cUpper.startsWith(kUpper) && cUpper.length > kUpper.length) {
      cleaned = cleaned.slice(String(kurumAdi).trim().length).replace(/^[>\s:/-]+/, "").trim();
    }
  }
  if (cleaned.includes(">")) {
    const parts = cleaned.split(">").map((p) => p.trim()).filter(Boolean);
    cleaned = parts[parts.length - 1] || cleaned;
  }
  return cleaned.trim();
}

interface DocumentHeaderProps {
  data?: Partial<BaseTemplate> & Record<string, any>;
  hideLogos?: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = (
  { data, hideLogos = false },
) => {
  const effectiveAntetLines = useMemo(() => {
    const rawVal = (data as any)?.antetSatirlari;
    let rawAntetList: string[] = [];
    if (Array.isArray(rawVal)) {
      rawAntetList = rawVal;
    } else if (typeof rawVal === "string" && rawVal.trim()) {
      try {
        const parsed = JSON.parse(rawVal);
        if (Array.isArray(parsed)) rawAntetList = parsed;
      } catch {
        rawAntetList = rawVal.split("\n");
      }
    }

    let lines: string[] = [];
    if (rawAntetList.length > 0) {
      lines = rawAntetList
        .map((s) => safeSanitizeBirimSatiri(String(s ?? "").trim(), data?.kurumAdi))
        .filter(Boolean);
    } else {
      lines = [
        "T.C.",
        data?.kurumUst,
        data?.kurumAdi,
      ]
        .map((s) => safeSanitizeBirimSatiri(String(s ?? "").trim(), data?.kurumAdi))
        .filter(Boolean);
    }

    const rawBirimLine = (
      data?.antetEkSatir ||
      (data as any)?.antet_ek_satir ||
      data?.mudurluk ||
      (data as any)?.birim ||
      (data as any)?.birimAdi ||
      (data as any)?.birim_adi ||
      (data as any)?.harcamaBirimi ||
      (data as any)?.harcama_birimi ||
      (data as any)?.talepEdenBirim ||
      ""
    ).trim();

    const birimLine = safeSanitizeBirimSatiri(
      rawBirimLine,
      data?.kurumAdi,
    );

    // Sadece kullanıcı açıkça antetBirimGosterilsin: false derse antetten çıkarır
    const hideBirim = data?.antetBirimGosterilsin === false ||
      (data as any)?.birimAntetteGosterilsin === false ||
      (data as any)?.antetteBirimGoster === false;

    if (hideBirim) {
      if (birimLine) {
        lines = lines.filter(
          (l) =>
            l.trim().toLocaleUpperCase("tr-TR") !==
              birimLine.toLocaleUpperCase("tr-TR"),
        );
      }
      if (lines.length > 2) {
        lines = lines.slice(0, 2);
      }
    } else if (birimLine) {
      const alreadyHas = lines.some(
        (l) =>
          l.trim().toLocaleUpperCase("tr-TR") ===
            birimLine.toLocaleUpperCase("tr-TR"),
      );
      if (!alreadyHas) {
        if (lines.length > 2) {
          // Eski birim satırının yerine yenisini koy
          lines[lines.length - 1] = birimLine;
        } else {
          lines.push(birimLine);
        }
      }
    }

    // Antet satırlarında olası ">" veya mükerrer kurum satırlarını son kontrol olarak temizle
    const uniqueLines: string[] = [];
    for (const l of lines) {
      const cleanLine = safeSanitizeBirimSatiri(l, data?.kurumAdi);
      if (cleanLine && !uniqueLines.some((u) => u.toLocaleUpperCase("tr-TR") === cleanLine.toLocaleUpperCase("tr-TR"))) {
        uniqueLines.push(cleanLine);
      }
    }

    return uniqueLines.length > 0 ? uniqueLines : ["T.C."];
  }, [data]);

  return (
    <div
      style={{
        display: "table",
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "20px",
        minHeight: GLOBAL_THEME.spacing.headerHeight,
      }}
    >
      {/* SOL - LOGO */}
      <div
        style={{
          display: "table-cell",
          width: "90px",
          textAlign: "left",
          verticalAlign: "top",
          paddingTop: 0,
        }}
      >
        {!hideLogos && data?.solLogo && (
          <img
            src={data.solLogo}
            alt="Sol Logo"
            referrerPolicy="no-referrer"
            style={{
              maxWidth: "80px",
              maxHeight: "80px",
              objectFit: "contain",
            }}
          />
        )}
      </div>

      {/* MERKEZ - KURUM ADI VE ANTETI */}
      <div
        style={{
          display: "table-cell",
          textAlign: "center",
          verticalAlign: "top",
          paddingTop: 0,
          lineHeight: 1.3,
        }}
      >
        {!hideLogos && (data?.ortaLogo || (data as any)?.ortaLogo) && (
          <div style={{ marginBottom: "6px" }}>
            <img
              src={data?.ortaLogo || (data as any)?.ortaLogo}
              alt="Orta Logo"
              referrerPolicy="no-referrer"
              style={{
                maxWidth: "80px",
                maxHeight: "80px",
                objectFit: "contain",
                display: "inline-block",
              }}
            />
          </div>
        )}
        {effectiveAntetLines.map((satir, idx) => (
          <div
            key={idx}
            style={{
              fontWeight: "bold",
              fontSize: "12pt",
              marginBottom: idx < effectiveAntetLines.length - 1 ? "4px" : "0",
            }}
          >
            {satir}
          </div>
        ))}
      </div>

      {/* SAĞ - LOGO */}
      <div
        style={{
          display: "table-cell",
          width: "90px",
          textAlign: "right",
          verticalAlign: "top",
          paddingTop: 0,
        }}
      >
        {!hideLogos && data?.sagLogo && (
          <img
            src={data.sagLogo}
            alt="Sağ Logo"
            referrerPolicy="no-referrer"
            style={{
              maxWidth: "80px",
              maxHeight: "80px",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    </div>
  );
};

export const DocumentHeaderCompact: React.FC<DocumentHeaderProps> = (
  { data },
) => {
  return (
    <div
      style={{ textAlign: "center", marginBottom: "15px", fontSize: "11pt" }}
    >
      {data?.kurumAdi && (
        <div style={{ fontWeight: "bold" }}>{data.kurumAdi}</div>
      )}
      {data?.mudurluk && (
        <div style={{ fontWeight: "bold" }}>{data.mudurluk}</div>
      )}
    </div>
  );
};
