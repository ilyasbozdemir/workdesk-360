import { DocumentLayout } from "../../document/DocumentLayout";
import { ColumnDef, DocumentTable } from "../../document/DocumentTable";
import {
  ApprovalSignature,
  EditableOlurPlaceholder,
  MetadataBlock,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { EditableField } from "../../document/EditableField";
import { useIhtiyacListesi } from "./IhtiyacListesi.hook";

export interface BaseIhtiyacListesiProps {
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

export function BaseIhtiyacListesi(props: BaseIhtiyacListesiProps) {
  const {
    data = {},
    pageSize = "A4",
    orientation = "portrait",
    itemDescriptionText = "mal/hizmet",
    defaultColumns,
  } = props;

  const hookResult = useIhtiyacListesi({
    ...props,
    columns: props.columns || defaultColumns,
  });

  const {
    tableColumns,
    pages,
    tarih,
    dosyaKonusu,
    sunulacakMakam,
    onayTarihi,
    fLimit,
    KANUN_DAYANAGI,
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
                <MetadataBlock
                  evrakSayisi={data.evrakSayisi}
                  tarih={tarih}
                  dosyaKonusu={dosyaKonusu}
                  showBorder={false}
                />

                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "12pt",
                    textTransform: "uppercase",
                    marginBottom: "20px",
                    pageBreakInside: "avoid",
                  }}
                >
                  <EditableField
                    name="sunulacakMakamAdi"
                    value={sunulacakMakam}
                    placeholder="SUNULACAK MAKAM ADI"
                  />
                </div>

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
                    value={data.ihtiyacYeri}
                    placeholder="İhtiyaç Yeri"
                  />{" "}
                  ihtiyacı olan aşağıda yazılı {itemDescriptionText} kalemlerinin temin
                  edilmesi gerekmektedir;
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
                  Söz konusu ihtiyacın 4734 sayılı Kamu İhale Kanununun{" "}
                  <EditableField
                    name="maddeNo"
                    value={KANUN_DAYANAGI}
                    placeholder="ilgili"
                  />{" "}
                  maddesine göre temini için gereğini olurlarınıza arz ederim.
                </div>

                <PersonelCard
                  nameField="hazirlayanPersonelAdi"
                  unvanField="hazirlayanPersonelUnvan"
                  role="Hazırlayan"
                  adSoyad={data.hazirlayanPersonelAdi}
                  unvan={data.hazirlayanPersonelUnvan}
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
              currentSplitIndex={fLimit ? Number(fLimit) : null}
            />

            {isLastPage && (
              data.olurYazisi !== false
                ? (
                  <div style={{ marginTop: "auto" }}>
                    <ApprovalSignature
                      title={data.olurBaslik || "OLUR"}
                      date={onayTarihi}
                      adSoyad={data.onaylayanPersonelAdi}
                      unvan={data.onaylayanPersonelUnvan}
                      showSpace={true}
                      marginTop={40}
                    />
                  </div>
                )
                : <EditableOlurPlaceholder />
            )}
          </DocumentLayout>
        );
      })}
    </>
  );
}
