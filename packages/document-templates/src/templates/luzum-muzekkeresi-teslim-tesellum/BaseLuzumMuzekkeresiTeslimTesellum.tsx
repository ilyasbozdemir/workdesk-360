import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { DocumentTable } from "../../document/DocumentTable";
import {
  DateEditableField,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { EditableField } from "../../document/EditableField";
import {
  useLuzumMuzekkeresiTeslimTesellum,
  UseLuzumTeslimTesellumParams,
} from "./LuzumMuzekkeresiTeslimTesellum.hook";

export interface BaseLuzumTeslimTesellumProps
  extends UseLuzumTeslimTesellumParams {
  title?: string;
}

export function BaseLuzumMuzekkeresiTeslimTesellum(
  props: BaseLuzumTeslimTesellumProps,
) {
  const {
    data = {},
    pageSize = "A4",
    orientation = "portrait",
    title = "TESLİM TESELLÜM BELGESİ",
  } = props;

  const {
    tableColumns,
    limits,
    pages,
    tarih,
    defaultToday,
    fallbackKurum,
    kurumumuzMetni,
    isinAdiMetni,
    teslimEdenlerList,
    teslimAlanlarList,
    getStartIndex,
  } = useLuzumMuzekkeresiTeslimTesellum(props);

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
                    textAlign: "right",
                    fontSize: "10pt",
                    marginBottom: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Tarih:{" "}
                  <DateEditableField
                    name="tarih"
                    value={tarih}
                    defaultDate={defaultToday}
                  />
                </div>

                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "13pt",
                    textDecoration: "underline",
                    marginBottom: "20px",
                    letterSpacing: "0.5px",
                  }}
                >
                  <EditableField
                    name="dosyaKonusu"
                    value={title}
                    placeholder={title}
                  />
                </div>

                <table
                  style={{
                    width: "100%",
                    marginBottom: "15px",
                    fontSize: "10pt",
                    borderCollapse: "collapse",
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          fontWeight: "bold",
                          width: "120px",
                          padding: "4px 0",
                          verticalAlign: "top",
                        }}
                      >
                        İşin Adı:
                      </td>
                      <td
                        colSpan={3}
                        style={{ padding: "4px 0", verticalAlign: "top" }}
                      >
                        <EditableField
                          name="isinAdi"
                          value={data.isinAdi}
                          placeholder="İşin Adı"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          fontWeight: "bold",
                          width: "120px",
                          padding: "4px 0",
                          verticalAlign: "top",
                        }}
                      >
                        Sayı:
                      </td>
                      <td
                        colSpan={3}
                        style={{ padding: "4px 0", verticalAlign: "top" }}
                      >
                        <EditableField
                          name="evrakSayisi"
                          value={(data as any).evrakSayisi ||
                            data.dosyaNumarasi}
                          placeholder="E-0000000000-934.01-0001"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

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
                    name="kurumumuz"
                    value={kurumumuzMetni}
                    placeholder={fallbackKurum}
                  />{" "}
                  bünyesinde gerçekleştirilen{" "}
                  <strong>
                    <EditableField
                      name="isinAdi"
                      value={isinAdiMetni}
                      placeholder="Doğrudan Temin"
                    />
                  </strong>{" "}
                  dosyası kapsamında alınan, aşağıda listede cinsi ve miktarı
                  belirtilen malzemeler, teslim eden firma yetkilisi/personeli
                  tarafından getirilerek ilgili komisyon/yetkililerce tam,
                  sağlam ve çalışır vaziyette teslim alınmıştır. İşbu belge 2
                  (iki) nüsha olarak düzenlenmiştir.
                </div>
              </>
            )}

            <DocumentTable
              columns={tableColumns}
              data={pageItems}
              emptyMessage="Kalem bulunamadı"
              striped={false}
              startIndex={getStartIndex(pageIdx)}
              currentSplitIndex={limits.firstPage
                ? Number(limits.firstPage)
                : null}
            />

            {isLastPage && (
              <div
                style={{
                  marginTop: "40px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "40px",
                  pageBreakInside: "avoid",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "11pt",
                      borderBottom: "1px solid #ccc",
                      paddingBottom: "4px",
                      marginBottom: "12px",
                      textAlign: "center",
                    }}
                  >
                    TESLİM EDENLER
                  </div>
                  {teslimEdenlerList.map((person: any, idx: number) => (
                    <PersonelCard
                      key={idx}
                      isFirmaSelect={true}
                      adSoyad={person.adSoyad}
                      unvan={person.unvan}
                      nameField={`teslimEden_${idx}_adSoyad`}
                      unvanField={`teslimEden_${idx}_unvan`}
                      placeholderName="Firma Adı / Kaşe"
                      placeholderUnvan="Unvanı"
                      align="center"
                      marginBottom={16}
                    />
                  ))}
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "11pt",
                      borderBottom: "1px solid #ccc",
                      paddingBottom: "4px",
                      marginBottom: "12px",
                      textAlign: "center",
                    }}
                  >
                    TESLİM ALANLAR
                  </div>
                  {teslimAlanlarList.map((person: any, idx: number) => (
                    <PersonelCard
                      key={idx}
                      adSoyad={person.adSoyad}
                      unvan={person.unvan}
                      nameField={`teslimAlan_${idx}_adSoyad`}
                      unvanField={`teslimAlan_${idx}_unvan`}
                      placeholderName="Teslim Alan Personel"
                      placeholderUnvan="Unvanı"
                      align="center"
                      marginBottom={16}
                    />
                  ))}
                </div>
              </div>
            )}
          </DocumentLayout>
        );
      })}
    </>
  );
}
