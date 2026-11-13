import React from "react";
import { GLOBAL_THEME } from "../theme.config";
import { TableRowSplitDivider } from "./TableRowSplitDivider";
import {
  ColumnDef,
  getTemplateTableColumns,
  resolveRowCellValue,
  TEMPLATE_TABLE_COLUMNS,
} from "../constants/tableColumns.constants";

export type { ColumnDef };
export { getTemplateTableColumns, resolveRowCellValue, TEMPLATE_TABLE_COLUMNS };
export const DEFAULT_IHTIYAC_COLUMNS = TEMPLATE_TABLE_COLUMNS.default;

export interface DocumentTableProps<T = any> {
  templateId?: string;
  columns?: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  striped?: boolean;
  startIndex?: number;
  currentSplitIndex?: number | null;
  footer?: React.ReactNode;
}

export const DocumentTable = React.forwardRef<
  HTMLTableElement,
  DocumentTableProps<any>
>(
  (
    {
      templateId,
      columns,
      data,
      emptyMessage = "Veri bulunamadı",
      striped = false,
      startIndex = 0,
      currentSplitIndex,
      footer,
    },
    ref,
  ) => {
    const borderColor = GLOBAL_THEME.colors.border;
    const headerBg = GLOBAL_THEME.colors.headerBg;
    const activeColumns = columns && columns.length > 0
      ? columns
      : getTemplateTableColumns(templateId);

    return (
      <table
        ref={ref}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          marginBottom: "30px",
          fontSize: GLOBAL_THEME.table.fontSize,
          pageBreakInside: "avoid",
        }}
      >
        {/* HEADER */}
        <thead>
          <tr style={{ pageBreakInside: "avoid" }}>
            {activeColumns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  border: `1px solid ${borderColor}`,
                  backgroundColor: headerBg,
                  padding: GLOBAL_THEME.table.cellPadding,
                  fontWeight: "bold",
                  textAlign: col.align || "center",
                  width: col.width,
                  pageBreakInside: "avoid",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.length === 0
            ? (
              <tr>
                <td
                  colSpan={activeColumns.length}
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    border: `1px solid ${borderColor}`,
                    color: "#999",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )
            : (
              data.map((row, rowIdx) => {
                const rowNum = (startIndex ?? 0) + rowIdx + 1;
                return (
                  <React.Fragment key={rowIdx}>
                    <tr
                      style={{
                        backgroundColor: striped && rowIdx % 2 === 0
                          ? "#f9f9f9"
                          : "transparent",
                        pageBreakInside: "avoid",
                      }}
                    >
                      {activeColumns.map((col) => {
                        const colKey = String(col.key);
                        const value = resolveRowCellValue(row, colKey, rowNum);

                        const rendered = col.render
                          ? col.render(value, row, rowIdx)
                          : value !== undefined && value !== null &&
                              String(value).trim() !== ""
                          ? String(value)
                          : "-";

                        return (
                          <td
                            key={String(col.key)}
                            style={{
                              border: `1px solid ${borderColor}`,
                              padding: GLOBAL_THEME.table.cellPadding,
                              textAlign: col.align || "left",
                              pageBreakInside: "avoid",
                            }}
                          >
                            {rendered}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Satırdan Bölme Çizgisi */}
                    <TableRowSplitDivider
                      rowIndex={rowNum}
                      colSpan={activeColumns.length}
                      currentSplitIndex={currentSplitIndex}
                    />
                  </React.Fragment>
                );
              })
            )}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    );
  },
);

DocumentTable.displayName = "DocumentTable";

interface SummaryTableProps {
  rows: Array<{ label: string; value: string | number }>;
  isBold?: boolean;
}

export const SummaryTable: React.FC<SummaryTableProps> = (
  { rows, isBold = false },
) => {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "20px",
        marginBottom: "20px",
        fontSize: "11pt",
      }}
    >
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} style={{ pageBreakInside: "avoid" }}>
            <td
              style={{
                border: `1px solid ${GLOBAL_THEME.colors.border}`,
                padding: "6px",
                textAlign: "right",
                fontWeight: isBold ? "bold" : "normal",
                width: "70%",
              }}
            >
              {row.label}
            </td>
            <td
              style={{
                border: `1px solid ${GLOBAL_THEME.colors.border}`,
                padding: "6px",
                textAlign: "right",
                fontWeight: isBold ? "bold" : "normal",
                width: "30%",
              }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
