import React, { useMemo } from "react";
import { BaseTemplate } from "../base.schema";
import { GLOBAL_THEME } from "../theme.config";
import { InstitutionalHeaderProvider } from "@worksuite-360/document-engine";

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
        .map((s) =>
          InstitutionalHeaderProvider.sanitizeBirimAntetSatiri(
            String(s ?? "").trim(),
            data?.kurumAdi,
          )
        )
        .filter(Boolean);
    } else {
      lines = [
        "T.C.",
        data?.kurumUst,
        data?.kurumAdi,
      ]
        .map((s) =>
          InstitutionalHeaderProvider.sanitizeBirimAntetSatiri(
            String(s ?? "").trim(),
            data?.kurumAdi,
          )
        )
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

    const birimLine = InstitutionalHeaderProvider.sanitizeBirimAntetSatiri(
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

    return lines.length > 0 ? lines : ["T.C."];
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
