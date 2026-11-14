import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { DocumentTable } from "../../document/DocumentTable";
import {
  DateEditableField,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { EditableField } from "../../document/EditableField";
import {
  UseLuzumMuzekkeresiOnayEkiParams,
  useLuzumMuzekkeresiOnayEki,
} from "./LuzumMuzekkeresiOnayEki.hook";

export interface BaseLuzumMuzekkeresiOnayEkiProps
  extends UseLuzumMuzekkeresiOnayEkiParams {
  title?: string;
  talepMetniSuffix?: string;
}

export function BaseLuzumMuzekkeresiOnayEki(
  props: BaseLuzumMuzekkeresiOnayEkiProps,
) {
  const {
    data = {},
    pageSize = "A4",
    orientation = "portrait",
    title = "LÜZUM MÜZEKKERESİ",
    talepMetniSuffix = "için aşağıda müfredatı ve evsafı yazılı malzemelere ihtiyaç görüldüğünden satın alınması arz olunur.",
  } = props;

  const {
    tableColumns,
    limits,
    pages,
    dosyaTarihiVal,
    kurumMetni,
    ekNo,
    talepEdenAd,
    talepEdenUnvan,
    getStartIndex,
  } = useLuzumMuzekkeresiOnayEki(props);

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
                  {title}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontSize: "10pt",
                    fontWeight: "bold",
                  }}
                >
                  <div>
                    EK:{" "}
                    <EditableField
                      name="ekNo"
                      value={ekNo}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "justify",
                    textIndent: "40px",
                    marginBottom: "20px",
                    fontSize: "11pt",
                    lineHeight: 1.5,
                  }}
                >
                  <EditableField
                    name="kurumMetni"
                    value={kurumMetni}
                    placeholder="İdaremiz"
                  />{" "}
                  {talepMetniSuffix}
                </div>
              </>
            )}

            <DocumentTable
              columns={tableColumns}
              data={pageItems}
              emptyMessage="Kalem bulunamadı"
              striped={false}
              startIndex={getStartIndex(pageIdx)}
              currentSplitIndex={limits.firstPage ? Number(limits.firstPage) : null}
            />

            {isLastPage && (
              <div
                style={{
                  marginLeft: "auto",
                  width: "220px",
                  textAlign: "center",
                  marginTop: "30px",
                  marginBottom: "20px",
                  fontSize: "11pt",
                  pageBreakInside: "avoid",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <DateEditableField
                    name="dosyaTarihi"
                    value={data.dosyaTarihi || data.tarih}
                    defaultDate={dosyaTarihiVal}
                  />
                </div>

                <PersonelCard
                  adSoyad={talepEdenAd}
                  unvan={talepEdenUnvan}
                  nameField="talepEdenPersonelAdi"
                  unvanField="talepEdenPersonelUnvan"
                  align="center"
                  marginTop={0}
                  marginBottom={0}
                />
              </div>
            )}
          </DocumentLayout>
        );
      })}
    </>
  );
}
