import React from "react";
import { EditableField } from "../../../document/EditableField";
import { TableRowSplitDivider } from "../../../document/TableRowSplitDivider";

interface PiyasaFiyatTeklifleriTableProps {
  displayFirmalar: any[];
  processedKalemler: any[];
  displayFirmaToplamlari: any[];
  formatMoney: (val: any) => string;
  data?: Record<string, any>;
  startIndex?: number;
  showTotals?: boolean;
}

export const PiyasaFiyatTeklifleriTable: React.FC<PiyasaFiyatTeklifleriTableProps> = ({
  displayFirmalar,
  processedKalemler,
  displayFirmaToplamlari,
  formatMoney,
  data = {},
  startIndex = 0,
  showTotals = true,
}) => {
  const firmCount = Math.max(1, displayFirmalar.length);
  // Base non-firm columns total percentage:
  const baseTotalPct = firmCount === 1 ? 50 : firmCount === 2 ? 42 : firmCount === 3 ? 36 : 32;
  const firmTotalPct = 100 - baseTotalPct;
  const perFirmPct = firmTotalPct / firmCount;
  const perPricePct = perFirmPct / 2;

  const siraPct = 3.5;
  const birimPct = 4.5;
  const miktarPct = 4.5;
  const remainingBase = baseTotalPct - (siraPct + birimPct + miktarPct);
  const malzemePct = remainingBase * 0.54;
  const ozellikPct = remainingBase * 0.46;

  return (
    <>
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          margin: "10px 0 5px 0",
          fontSize: "9.5pt",
          textTransform: "uppercase",
          backgroundColor: "#f2f2f2",
          border: "1px solid #000",
          padding: "3px 0",
        }}
      >
        GERÇEK / TÜZEL KİŞİLERİN FİYAT TEKLİFLERİ
      </div>

      <table
        style={{
          width: "100%",
          maxWidth: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          marginBottom: "8px",
          fontSize: data?.tableFontSize || (firmCount >= 4 ? "7.5pt" : firmCount === 3 ? "8pt" : "8.5pt"),
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          boxSizing: "border-box",
        }}
      >
        <colgroup>
          <col style={{ width: `${siraPct}%` }} />
          <col style={{ width: `${malzemePct}%` }} />
          <col style={{ width: `${ozellikPct}%` }} />
          <col style={{ width: `${birimPct}%` }} />
          <col style={{ width: `${miktarPct}%` }} />
          {displayFirmalar.map((_: any, idx: number) => (
            <React.Fragment key={idx}>
              <col style={{ width: `${perPricePct}%` }} />
              <col style={{ width: `${perPricePct}%` }} />
            </React.Fragment>
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              rowSpan={2}
              style={{
                border: "1px solid #000",
                padding: "4px 2px",
                textAlign: "center",
                backgroundColor: "#f2f2f2",
                fontWeight: "bold",
              }}
            >
              Sıra No
            </th>
            <th
              rowSpan={2}
              style={{
                border: "1px solid #000",
                padding: "4px 2px",
                textAlign: "center",
                backgroundColor: "#f2f2f2",
                fontWeight: "bold",
              }}
            >
              Mal / Hizmet / Yapım İşi
            </th>
            <th
              rowSpan={2}
              style={{
                border: "1px solid #000",
                padding: "4px 2px",
                textAlign: "center",
                backgroundColor: "#f2f2f2",
                fontWeight: "bold",
              }}
            >
              Özelliği
            </th>
            <th
              rowSpan={2}
              style={{
                border: "1px solid #000",
                padding: "4px 2px",
                textAlign: "center",
                backgroundColor: "#f2f2f2",
                fontWeight: "bold",
              }}
            >
              Birim
            </th>
            <th
              rowSpan={2}
              style={{
                border: "1px solid #000",
                padding: "4px 2px",
                textAlign: "center",
                backgroundColor: "#f2f2f2",
                fontWeight: "bold",
              }}
            >
              Miktar
            </th>
            {displayFirmalar.map((f: any, idx: number) => (
              <th
                key={idx}
                colSpan={2}
                style={{
                  border: "1px solid #000",
                  padding: "3px 2px",
                  textAlign: "center",
                  backgroundColor: "#f2f2f2",
                  fontWeight: "bold",
                  fontSize: firmCount >= 4 ? "7pt" : firmCount === 3 ? "7.5pt" : "8.5pt",
                  lineHeight: 1.15,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <EditableField
                  name={`firmalar.${idx}.unvan`}
                  value={f.unvan || `Firma ${idx + 1}`}
                  placeholder={`Firma ${idx + 1}`}
                />
              </th>
            ))}
          </tr>
          <tr>
            {displayFirmalar.map((_: any, idx: number) => (
              <React.Fragment key={idx}>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "3px 2px",
                    textAlign: "center",
                    backgroundColor: "#f2f2f2",
                    fontWeight: "bold",
                    fontSize: firmCount >= 4 ? "7pt" : "8pt",
                  }}
                >
                  B.Fiyat
                </th>
                <th
                  style={{
                    border: "1px solid #000",
                    padding: "3px 2px",
                    textAlign: "center",
                    backgroundColor: "#f2f2f2",
                    fontWeight: "bold",
                    fontSize: firmCount >= 4 ? "7pt" : "8pt",
                  }}
                >
                  Tutar
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {processedKalemler.map((kalem, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px 2px",
                    textAlign: "center",
                  }}
                >
                  {kalem.siraNo ?? startIndex + idx + 1}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px 3px",
                    textAlign: "left",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {kalem.malzemeAdi}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px 3px",
                    textAlign: "left",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {kalem.ozelligi}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px 2px",
                    textAlign: "center",
                  }}
                >
                  {kalem.birimi}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px 2px",
                    textAlign: "center",
                  }}
                >
                  {kalem.miktar}
                </td>
                {displayFirmalar.map((_: any, fIdx: number) => {
                  const tf =
                    (kalem.firmaTeklifleriDetay &&
                      kalem.firmaTeklifleriDetay[fIdx]) ||
                    (kalem.firmaTeklifleri &&
                      kalem.firmaTeklifleri[fIdx]) ||
                    {};
                  const birimFiyatStr =
                    tf.birimFiyat !== undefined &&
                    tf.birimFiyat !== null &&
                    tf.birimFiyat !== "-" &&
                    tf.birimFiyat !== ""
                      ? formatMoney(tf.birimFiyat)
                      : "-";
                  const tutarStr =
                    tf.tutar !== undefined &&
                    tf.tutar !== null &&
                    tf.tutar !== "-" &&
                    tf.tutar !== ""
                      ? formatMoney(tf.tutar)
                      : birimFiyatStr !== "-"
                      ? formatMoney(
                          (parseFloat(
                            String(birimFiyatStr)
                              .replace(/\./g, "")
                              .replace(",", ".")
                          ) || 0) *
                            (typeof kalem.miktar === "number"
                              ? kalem.miktar
                              : parseFloat(
                                  String(kalem.miktar || 1)
                                    .replace(/\./g, "")
                                    .replace(",", ".")
                                ) || 1)
                        )
                      : "-";

                  return (
                    <React.Fragment key={fIdx}>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "4px 2px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontSize: firmCount >= 4 ? "7pt" : firmCount === 3 ? "7.5pt" : "8.5pt",
                        }}
                      >
                        <EditableField
                          name={`ihtiyacKalemleri.${idx}.firmaTeklifleriDetay.${fIdx}.birimFiyat`}
                          value={birimFiyatStr}
                          placeholder="0,00"
                        />
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "4px 2px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          fontSize: firmCount >= 4 ? "7pt" : firmCount === 3 ? "7.5pt" : "8.5pt",
                        }}
                      >
                        <EditableField
                          name={`ihtiyacKalemleri.${idx}.firmaTeklifleriDetay.${fIdx}.tutar`}
                          value={tutarStr}
                          placeholder="0,00"
                        />
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
              <TableRowSplitDivider
                rowIndex={startIndex + idx + 1}
                colSpan={5 + displayFirmalar.length * 2}
                currentSplitIndex={
                  data?.firstPageLimit
                    ? Number(data.firstPageLimit)
                    : null
                }
              />
            </React.Fragment>
          ))}

          {showTotals !== false && processedKalemler.length > 0 && (
            <tr style={{ fontWeight: "bold", backgroundColor: "#fafafa" }}>
              <td
                colSpan={5}
                style={{
                  border: "1px solid #000",
                  padding: "4px",
                  textAlign: "right",
                }}
              >
                Toplam Tutar :
              </td>
              {displayFirmalar.map((_: any, fIdx: number) => {
                const ft = displayFirmaToplamlari[fIdx] || {};
                return (
                  <React.Fragment key={fIdx}>
                    <td style={{ border: "1px solid #000", padding: "4px 2px" }}></td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px 2px",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontSize: firmCount >= 4 ? "7pt" : firmCount === 3 ? "7.5pt" : "8.5pt",
                      }}
                    >
                      <EditableField
                        name={`firmaToplamlariDetay.${fIdx}.toplam`}
                        value={ft.toplam || "-"}
                        placeholder="0,00"
                      />
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};
