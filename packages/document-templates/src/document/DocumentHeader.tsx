import React, { useMemo } from "react";
import { BaseTemplate } from "../base.schema";
import { GLOBAL_THEME } from "../theme.config";

interface DocumentHeaderProps {
  data?: Partial<BaseTemplate> & Record<string, any>;
  hideLogos?: boolean;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = (
  { data, hideLogos = false },
) => {
  const effectiveAntetLines = useMemo(() => {
    let lines: string[] = [];
    if (Array.isArray(data?.antetSatirlari) && data.antetSatirlari.length > 0) {
      lines = data.antetSatirlari
        .map((s) => String(s ?? "").trim())
        .filter(Boolean);
    } else {
      lines = [
        "T.C.",
        data?.kurumUst,
        data?.kurumAdi,
      ]
        .map((s) => String(s ?? "").trim())
        .filter(Boolean);
    }

    const birimLine = (
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

    // Sadece kullanıcı açıkça antetBirimGosterilsin: false derse antetten çıkarır
    const hideBirim =
      data?.antetBirimGosterilsin === false ||
      (data as any)?.birimAntetteGosterilsin === false ||
      (data as any)?.antetteBirimGoster === false;

    if (hideBirim && birimLine) {
      lines = lines.filter(
        (l) =>
          l.trim().toLocaleUpperCase("tr-TR") !==
          birimLine.toLocaleUpperCase("tr-TR"),
      );
    } else if (!hideBirim && birimLine) {
      const alreadyHas = lines.some(
        (l) =>
          l.trim().toLocaleUpperCase("tr-TR") ===
          birimLine.toLocaleUpperCase("tr-TR"),
      );
      if (!alreadyHas) {
        lines.push(birimLine);
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
              marginBottom: idx < effectiveAntetLines.length - 1
                ? "4px"
                : "0",
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
