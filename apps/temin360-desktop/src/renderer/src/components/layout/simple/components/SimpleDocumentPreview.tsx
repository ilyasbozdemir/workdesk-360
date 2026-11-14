import React, { useState } from "react";
import { OfferRecord, SimpleFile } from "../types";
import { SABLON_KATEGORILERI } from "../../../../constants/sablonKategorileri";
import { TEMPLATE_NAMES } from "../../../../../../shared/constants/templateConstants";
import {
  ExcelStylePrintModal,
  PrintSettings,
} from "../../../../components/ui/ExcelStylePrintModal";

export interface SimpleDocumentPreviewProps {
  selectedFile: SimpleFile;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  institutionName?: string;
  adminName?: string;
  offers: OfferRecord[];
  onBackToDetail: () => void;
  onOpenDocumentEngineModal: (templateId: string) => void;
}

export const SimpleDocumentPreview: React.FC<SimpleDocumentPreviewProps> = ({
  selectedFile,
  selectedTemplateId,
  setSelectedTemplateId,
  institutionName,
  adminName,
  offers,
  onBackToDetail,
  onOpenDocumentEngineModal,
}) => {
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const money = (n: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n);

  const handleExecutePrint = async (settings: PrintSettings): Promise<void> => {
    setIsPrinting(true);
    try {
      const paperEl = document.querySelector(".a4-paper");
      const innerHtml = paperEl ? paperEl.outerHTML : "";
      const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${TEMPLATE_NAMES[selectedTemplateId] || "Belge"}</title>
          <style>
            @page { size: A4 ${settings.orientation}; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 0; }
            .a4-paper { width: 100%; box-shadow: none !important; border: none !important; padding: 0 !important; }
            .letterhead { text-align: center; margin-bottom: 24px; }
            h2 { text-align: center; font-size: 16px; margin: 20px 0; }
            p { font-size: 12px; line-height: 1.6; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
            th, td { padding: 6px 8px; }
          </style>
        </head>
        <body>${innerHtml}</body>
        </html>
      `;
      await window.electron.ipcRenderer.invoke("app:print-html", {
        html: printHtml,
        deviceName: settings.printerName,
        copies: settings.copies,
        silent: settings.silent,
        landscape: settings.orientation === "landscape",
        color: settings.color,
      });
      setPrintModalOpen(false);
    } catch (err: any) {
      console.error("Yazdırma hatası:", err);
      alert("Yazdırma başarısız: " + (err.message || err));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="workspace">
      <div
        className="toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          className="simple-btn"
          onClick={onBackToDetail}
        >
          ← Dosya detayına dön
        </button>

        {/* GELİŞMİŞ ŞABLON SEÇİCİ */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Şablon:</span>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            {SABLON_KATEGORILERI.flatMap((k) =>
              k.sablonlar.map((s) => (
                <option key={s} value={s}>
                  {k.kategori.slice(0, 18)} · {TEMPLATE_NAMES[s] || s}
                </option>
              ))
            )}
          </select>
        </div>

        <button
          className="simple-btn"
          style={{
            background: "var(--primary-soft)",
            color: "var(--primary)",
            borderColor: "var(--primary)",
          }}
          onClick={() => onOpenDocumentEngineModal(selectedTemplateId)}
          title="Gelişmiş Belge Motoru & Snapshot Modalı ile Aç"
        >
          ⊞ Tam Sayfa Düzenle (Document Engine) ↗
        </button>

        <button
          className="simple-btn primary"
          onClick={() => setPrintModalOpen(true)}
          title="Excel tarzı yazıcı seçimi ve yazdırma paneli"
        >
          🖨️ Yazdır (Yazıcı Seç)
        </button>
        <span className="pill">A4 belge önizleme</span>
      </div>

      <section className="simple-panel">
        <div className="a4-paper">
          <div className="letterhead">
            <b>
              T.C.
              <br />
              {institutionName
                ? institutionName.toUpperCase()
                : "GÜNEYDERE BELEDİYE BAŞKANLIĞI"}
            </b>
            <br />
            Satın Alma Birimi
          </div>
          <h2>
            {TEMPLATE_NAMES[selectedTemplateId] ||
              "PİYASA FİYAT ARAŞTIRMA TUTANAĞI"}
          </h2>
          <p>
            <b>Dosya No:</b> {selectedFile.id}
          </p>
          <p>
            <b>Alımın konusu:</b> {selectedFile.name}
          </p>
          <p>
            <b>Alım usulü:</b> {selectedFile.type}
          </p>
          <p>
            İlgili alıma ilişkin piyasa fiyat araştırması teklif bilgileri
            aşağıda listelenmiştir:
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #444" }}>
                <th style={{ textAlign: "left", padding: "6px" }}>Firma</th>
                <th style={{ textAlign: "right", padding: "6px" }}>
                  Teklif Tutarı
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "6px" }}>{o.company}</td>
                  <td style={{ textAlign: "right", padding: "6px" }}>
                    {money(o.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "65px",
              textAlign: "center",
            }}
          >
            <div>
              Hazırlayan
              <br />
              <br />
              {adminName || "Satın Alma Personeli"}
            </div>
            <div>
              Onaylayan
              <br />
              <br />
              Harcama Yetkilisi
            </div>
          </div>
        </div>
      </section>

      <ExcelStylePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onPrint={handleExecutePrint}
        documentTitle={TEMPLATE_NAMES[selectedTemplateId] ||
          "Piyasa Fiyat Araştırma Tutanağı"}
        dosyaNo={String(selectedFile.id)}
        defaultOrientation="portrait"
        isPrinting={isPrinting}
      />
    </div>
  );
};
