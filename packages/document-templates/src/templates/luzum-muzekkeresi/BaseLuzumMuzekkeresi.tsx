import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { ColumnDef, DocumentTable } from "../../document/DocumentTable";
import {
  ApprovalSignature,
  DateEditableField,
  EditableOlurPlaceholder,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { EditableField } from "../../document/EditableField";
import { toPossessiveSuffix } from "../../resolver/mappingResolver";
import { useLuzumMuzekkeresi } from "./LuzumMuzekkeresi.hook";

export interface BaseLuzumMuzekkeresiProps {
  data?: Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  itemDescriptionText?: string;
  defaultColumns?: ColumnDef[];
}

export function BaseLuzumMuzekkeresi(props: BaseLuzumMuzekkeresiProps) {
  const {
    data = {},
    pageSize = "A4",
    orientation = "portrait",
    itemDescriptionText = "mal/hizmet",
    defaultColumns,
  } = props;

  const hookResult = useLuzumMuzekkeresi({
    ...props,
    columns: props.columns || defaultColumns,
  });

  const {
    tableColumns,
    pages,
    tarih,
    defaultToday,
    sunulacakMakam,
    onayTarihi,
    fLimit,
    getStartIndex,
  } = hookResult;

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
                    fontSize: "14pt",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "14px",
                    pageBreakInside: "avoid",
                  }}
                >
                  LÜZUM MÜZEKKERESİ
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    fontSize: "11pt",
                  }}
                >
                  <div>
                    {data.evrakSayisi
                      ? (
                        <span>
                          <strong>Sayı:</strong>{" "}
                          <EditableField
                            name="evrakSayisi"
                            value={data.evrakSayisi}
                          />
                        </span>
                      )
                      : (
                        <span style={{ color: "#94a3b8" }}>
                          <EditableField
                            name="evrakSayisi"
                            value={data.evrakSayisi}
                            placeholder="Evrak Sayısı"
                          />
                        </span>
                      )}
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    <strong>Tarih:</strong>{" "}
                    <DateEditableField
                      name="tarih"
                      value={tarih}
                      defaultDate={defaultToday}
                    />
                  </div>
                </div>

                {/* MUHATAP MAKAM */}
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "12pt",
                    textTransform: "uppercase",
                    marginBottom: "24px",
                    pageBreakInside: "avoid",
                  }}
                >
                  <EditableField
                    name="sunulacakMakamAdi"
                    value={sunulacakMakam}
                    placeholder="SUNULACAK MAKAM ADI (ÖRN: İL SAĞLIK MÜDÜRLÜĞÜ MAKAMINA)"
                  />
                </div>

                {/* TALEP PARAGRAFI */}
                <div
                  style={{
                    textAlign: "justify",
                    textIndent: "40px",
                    marginBottom: "12px",
                    fontSize: "12pt",
                    lineHeight: 1.5,
                  }}
                >
                  <EditableField
                    name="ihtiyacYeri"
                    value={data.ihtiyacYeri ||
                      (data as any).ihtiyac_yeri ||
                      (data as any).ihtiyac_yeri_eki ||
                      toPossessiveSuffix(
                        (data as any).altKurumBizim ||
                          (data as any).kurumumuz ||
                          (data as any).mudurluk ||
                          "",
                      )}
                    placeholder="İhtiyaç Yeri"
                  />{" "}
                  ihtiyacı olan aşağıda yazılı {itemDescriptionText}{" "}
                  kalemlerinin temin edilmesi gerekmektedir.
                </div>

                <div
                  style={{
                    textAlign: "justify",
                    textIndent: "40px",
                    marginBottom: "20px",
                    fontSize: "12pt",
                    lineHeight: 1.5,
                  }}
                >
                  Söz konusu ihtiyacın 4734 sayılı Kanunun{" "}
                  <EditableField
                    name="maddeNo"
                    value={data.maddeNo ?? "ilgili"}
                    placeholder="ilgili"
                  />{" "}
                  maddesine göre temini için gereğini olurlarınıza arz ederim.
                </div>

                {/* TALEP EDEN PERSONEL */}
                <PersonelCard
                  adSoyad={data.talepEdenPersonelAdi}
                  unvan={data.talepEdenPersonelUnvan}
                  nameField="talepEdenPersonelAdi"
                  unvanField="talepEdenPersonelUnvan"
                  placeholderName="Talep Eden Adı Soyadı"
                  placeholderUnvan="Talep Eden Unvanı"
                  align="right"
                  marginTop={20}
                  marginBottom={30}
                />
              </>
            )}

            <DocumentTable
              columns={tableColumns}
              data={pageItems}
              emptyMessage="Kalem bulunamadı"
              striped={false}
              startIndex={getStartIndex(pageIdx)}
              currentSplitIndex={fLimit}
            />

            {isLastPage && (
              <>
                {data.isinAciklamasi && (
                  <div
                    style={{
                      marginTop: "15px",
                      marginBottom: "15px",
                      textAlign: "justify",
                      fontSize: "11pt",
                      lineHeight: 1.5,
                      pageBreakInside: "avoid",
                    }}
                  >
                    <EditableField
                      name="isinAciklamasi"
                      value={data.isinAciklamasi}
                      placeholder="İşin Açıklaması..."
                      multiline
                    />
                  </div>
                )}

                {data.hasAciklamaMaddeleri &&
                  Array.isArray(data.aciklamaMaddeleri) && (
                  <div
                    style={{
                      marginTop: "15px",
                      marginBottom: "15px",
                      textAlign: "justify",
                      fontSize: "11pt",
                      lineHeight: 1.5,
                      pageBreakInside: "avoid",
                    }}
                  >
                    <ol style={{ margin: 0, paddingLeft: "20px" }}>
                      {data.aciklamaMaddeleri.map((madde: any, idx: number) => (
                        <li
                          key={idx}
                          style={{ marginBottom: "6px", paddingLeft: "5px" }}
                        >
                          {madde.maddeMetni ||
                            (typeof madde === "string" ? madde : "")}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* HAZIRLAYAN PERSONEL */}
                <PersonelCard
                  adSoyad={data.hazirlayanPersonelAdi}
                  unvan={data.hazirlayanPersonelUnvan}
                  nameField="hazirlayanPersonelAdi"
                  unvanField="hazirlayanPersonelUnvan"
                  placeholderName="Hazırlayan Adı Soyadı"
                  placeholderUnvan="Hazırlayan Unvanı"
                  align="right"
                  marginTop={20}
                  marginBottom={20}
                />

                {/* OLUR İMZA BLOĞU */}
                {data.olurYazisi !== false
                  ? (
                    <div style={{ marginTop: "auto" }}>
                      <ApprovalSignature
                        title={data.olurBaslik || "OLUR"}
                        date={onayTarihi}
                        adSoyad={data.onaylayanPersonelAdi}
                        unvan={data.onaylayanPersonelUnvan}
                        showSpace={true}
                      />
                    </div>
                  )
                  : <EditableOlurPlaceholder />}
              </>
            )}
          </DocumentLayout>
        );
      })}
    </>
  );
}
