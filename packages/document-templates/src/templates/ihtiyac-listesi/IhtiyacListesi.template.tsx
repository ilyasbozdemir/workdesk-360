import { DocumentLayout } from "../../document/DocumentLayout";
import {
  ColumnDef,
  DocumentTable,
  getTemplateTableColumns,
} from "../../document/DocumentTable";
import {
  ApprovalSignature,
  EditableOlurPlaceholder,
  MetadataBlock,
  PersonelCard,
} from "../../document/ApprovalSignature";
import { EditableField } from "../../document/EditableField";
import {
  DEFAULT_LIMITS,
  LANDSCAPE_LIMITS,
  paginateData,
} from "../../document/DynamicPaginatedTable";
import { IhtiyacListesiType } from "./IhtiyacListesi.schema";

interface IhtiyacListesiProps {
  data?: Partial<IhtiyacListesiType>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function IhtiyacListesi({
  data = {},
  columns,
  pageSize = "A4",
  orientation = "portrait",
  firstPageLimit,
  middlePageLimit,
  lastPageLimit,
}: IhtiyacListesiProps) {
  const tableColumns = columns && columns.length > 0
    ? columns
    : getTemplateTableColumns("ihtiyac-listesi");

  const fLimit = firstPageLimit ?? (data as any).firstPageLimit;
  const mLimit = middlePageLimit ?? (data as any).middlePageLimit;
  const lLimit = lastPageLimit ?? (data as any).lastPageLimit;

  const limits = {
    firstPage: fLimit !== undefined && fLimit !== null
      ? Number(fLimit)
      : (orientation === "landscape"
        ? LANDSCAPE_LIMITS.firstPage
        : DEFAULT_LIMITS.firstPage),
    middle: mLimit !== undefined && mLimit !== null
      ? Number(mLimit)
      : (orientation === "landscape"
        ? LANDSCAPE_LIMITS.middle
        : DEFAULT_LIMITS.middle),
    lastPage: lLimit !== undefined && lLimit !== null
      ? Number(lLimit)
      : (orientation === "landscape"
        ? LANDSCAPE_LIMITS.lastPage
        : DEFAULT_LIMITS.lastPage),
  };
  const items = data.ihtiyacKalemleri || [];
  const pages = paginateData(items, limits);

  console.log("data", data);

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
                  tarih={data.tarih || (data as any).dosya_acilis_tarihi ||
                    data.dosyaAcilisTarihi || data.dosyaTarihi}
                  dosyaKonusu={(data as any).konu}
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
                    value={data.sunulacakMakamAdi ||
                      (data as any).sunulacakMakam}
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
                  ihtiyacı olan aşağıda yazılı mal/hizmet kalemlerinin temin
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
                    value={"ilgili"}
                    placeholder="ilgili"
                  />{" "}
                  maddesine göre temini için gereğini olurlarınıza arz ederim.
                </div>

                <PersonelCard
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
              startIndex={pageIdx === 0
                ? 0
                : limits.firstPage + (pageIdx - 1) * limits.middle}
              currentSplitIndex={fLimit ? Number(fLimit) : null}
            />

            {isLastPage && (
              data.olurYazisi !== false
                ? (
                  <div style={{ marginTop: "auto" }}>
                    <ApprovalSignature
                      title={(data as any).olurBaslik || "OLUR"}
                      date={data.onayTarihi || data.tarih ||
                        (data as any).dosya_acilis_tarihi ||
                        data.dosyaTarihi}
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
