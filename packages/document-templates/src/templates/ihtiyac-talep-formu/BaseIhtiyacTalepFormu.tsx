import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { ColumnDef, DocumentTable } from "../../document/DocumentTable";
import {
  DateEditableField,
  MetadataBlock,
} from "../../document/ApprovalSignature";
import { EditableField } from "../../document/EditableField";
import { useTemplateEdit } from "../../document/TemplateEditContext";
import { useIhtiyacTalepFormu } from "./IhtiyacTalepFormu.hook";

export interface BaseIhtiyacTalepFormuProps {
  data?: Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  defaultColumns?: ColumnDef[];
  itemDescriptionText?: string;
}

export function BaseIhtiyacTalepFormu(props: BaseIhtiyacTalepFormuProps) {
  const {
    data = {},
    pageSize = "A4",
    orientation = "portrait",
    defaultColumns,
  } = props;

  const { isEditing, onFieldChange } = useTemplateEdit();

  const hookResult = useIhtiyacTalepFormu({
    ...props,
    columns: props.columns || defaultColumns,
  });

  const {
    tableColumns,
    limits,
    pages,
    personelList,
    talepEdenAd,
    talepEdenUnvan,
    talepEdenSelectedId,
    onaylayanAd,
    onaylayanUnvan,
    onaylayanSelectedId,
    tarihVal,
    dosyaTarihiVal,
    talepEdenBirim,
    altNotlar,
    ekler,
    fLimit,
    getStartIndex,
  } = hookResult;

  const cellStyle: React.CSSProperties = {
    border: "1px solid #000",
    padding: "6px",
    fontSize: "9.5pt",
  };

  return (
    <>
      {pages.map((pageItems, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === pages.length - 1;

        return (
          <DocumentLayout
            key={pageIdx}
            data={data}
            hideFooter={false}
            pageSize={pageSize}
            orientation={orientation}
            pageNumber={pageIdx + 1}
            totalPages={pages.length}
            hideHeader={!isFirstPage}
          >
            {isFirstPage && (
              <>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "13pt",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                    pageBreakInside: "avoid",
                  }}
                >
                  İHTİYAÇ TALEP FORMU
                </div>

                <div
                  style={{
                    marginBottom: "12px",
                    fontWeight: "bold",
                    fontSize: "10pt",
                    border: "1px solid #000",
                    padding: "6px 10px",
                  }}
                >
                  TALEP EDEN BİRİM:{" "}
                  <EditableField
                    name="ihtiyacYeri"
                    value={talepEdenBirim}
                    placeholder="Talep Eden Birim / Müdürlük"
                  />
                </div>
              </>
            )}

            <DocumentTable
              columns={tableColumns}
              data={pageItems}
              emptyMessage="Kalem bulunamadı"
              striped={false}
              startIndex={getStartIndex(pageIdx)}
              currentSplitIndex={fLimit ? Number(fLimit) : null}
            />

            {isLastPage && (
              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    fontSize: "9.5pt",
                    textAlign: "justify",
                    lineHeight: 1.4,
                    marginBottom: "16px",
                    textIndent: "40px",
                  }}
                >
                  Yukarıda istemi yapılan taleplerimizin önceki sarf edilen
                  miktarlarla uyumlu ve ihtiyaçların fazla talep edilmediği,
                  fazla talep edilmesinden kaynaklanan yasal sorumlulukların
                  tarafımıza ait olduğunu hazırlamış olduğumuz talebe ait ekteki
                  teknik şartnamelerin yürürlükteki kanunlara, yönetmeliklere
                  uygun olduğunu ve rekabete engel teşkil etmediğini taahhüt
                  ederiz.
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #000",
                    marginTop: "12px",
                    fontSize: "9.5pt",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: "bold",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        BİRİMİN TALEP GEREKÇESİ
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "50%",
                        }}
                      >
                        TALEBİ YAPAN
                      </td>
                      <td
                        colSpan={2}
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "50%",
                        }}
                      >
                        ONAYLAYAN
                      </td>
                    </tr>
                    <tr style={{ height: "90px", verticalAlign: "top" }}>
                      <td style={{ ...cellStyle, textAlign: "center" }}>
                        <div>
                          <DateEditableField
                            name="tarih"
                            value={data.tarih || data.onayaSunulanTarih}
                            defaultDate={tarihVal}
                          />
                        </div>
                        {isEditing && personelList.length > 0 && (
                          <div
                            style={{ marginTop: "4px", marginBottom: "4px" }}
                          >
                            <select
                              value={talepEdenSelectedId}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const p = personelList.find(
                                  (item: any) => item.id === selectedId
                                );
                                if (p && onFieldChange) {
                                  onFieldChange(
                                    "talepEdenPersonelAdi",
                                    p.ad_soyad
                                  );
                                  onFieldChange(
                                    "talepEdenPersonelUnvan",
                                    p.unvan || ""
                                  );
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
                              }}
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
                        <div style={{ fontWeight: "bold", marginTop: "4px" }}>
                          <EditableField
                            name="talepEdenPersonelAdi"
                            value={talepEdenAd}
                            placeholder="Talep Eden Ad Soyad"
                          />
                        </div>
                        <div>
                          <EditableField
                            name="talepEdenPersonelUnvan"
                            value={talepEdenUnvan}
                            placeholder="Unvan"
                          />
                        </div>
                      </td>
                      <td
                        colSpan={2}
                        style={{ ...cellStyle, textAlign: "center" }}
                      >
                        <div>
                          <DateEditableField
                            name="dosyaTarihi"
                            value={data.dosyaTarihi || data.onayTarihi}
                            defaultDate={dosyaTarihiVal}
                          />
                        </div>
                        {isEditing && personelList.length > 0 && (
                          <div
                            style={{ marginTop: "4px", marginBottom: "4px" }}
                          >
                            <select
                              value={onaylayanSelectedId}
                              onChange={(e) => {
                                const selectedId = Number(e.target.value);
                                const p = personelList.find(
                                  (item: any) => item.id === selectedId
                                );
                                if (p && onFieldChange) {
                                  onFieldChange(
                                    "onaylayanPersonelAdi",
                                    p.ad_soyad
                                  );
                                  onFieldChange(
                                    "onaylayanPersonelUnvan",
                                    p.unvan || ""
                                  );
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
                              }}
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
                        <div style={{ fontWeight: "bold", marginTop: "4px" }}>
                          <EditableField
                            name="onaylayanPersonelAdi"
                            value={onaylayanAd}
                            placeholder="Onaylayan Ad Soyad"
                          />
                        </div>
                        <div>
                          <EditableField
                            name="onaylayanPersonelUnvan"
                            value={onaylayanUnvan}
                            placeholder="Unvan"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        style={{ ...cellStyle, fontWeight: "bold" }}
                      >
                        GEREKÇE: (Gerekçe yazılmayan talepler kabul
                        edilmeyecektir.)
                      </td>
                    </tr>
                    <tr style={{ height: "50px", verticalAlign: "top" }}>
                      <td colSpan={3} style={{ ...cellStyle, padding: "8px" }}>
                        <EditableField
                          name="gerekce"
                          value={data.gerekce}
                          placeholder="Gerekçe yazınız..."
                          multiline
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        TAŞINIR KAYIT YETKİLİSİNİN GÖRÜŞÜ
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        TAŞINIR KODU
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        <DateEditableField
                          name="tasinirTarihi"
                          value={data.tasinirTarihi}
                          placeholder="……/……/202.."
                          defaultDate={dosyaTarihiVal}
                        />
                      </td>
                    </tr>
                    <tr style={{ height: "90px", verticalAlign: "top" }}>
                      <td style={cellStyle}></td>
                      <td style={cellStyle}></td>
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                      >
                        Taşınır Kayıt Yetkilisinin
                        <br />
                        İmza ve Kaşesi
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  style={{
                    marginTop: "16px",
                    fontSize: "9pt",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <EditableField
                    name="altNotlar"
                    value={altNotlar}
                    multiline
                    placeholder="Alt Notlar"
                  />
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "9.5pt",
                    fontWeight: "bold",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <EditableField
                    name="ekler"
                    value={ekler}
                    placeholder="EKİ: Talebe ait teknik şartnameler"
                    multiline
                  />
                </div>
              </div>
            )}
          </DocumentLayout>
        );
      })}
    </>
  );
}
