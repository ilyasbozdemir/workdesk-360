import React, { useState } from "react";
import { useTemplateEdit } from "./TemplateEditContext";

interface TableRowSplitDividerProps {
  rowIndex: number;
  colSpan?: number;
  currentSplitIndex?: number | null;
}

export const TableRowSplitDivider: React.FC<TableRowSplitDividerProps> = ({
  rowIndex,
  colSpan = 7,
  currentSplitIndex,
}) => {
  const { isEditing, onFieldChange, firstPageLimit: contextLimit } = useTemplateEdit();
  const [isHovered, setIsHovered] = useState(false);

  const activeSplitIndex =
    currentSplitIndex !== undefined
      ? currentSplitIndex
      : contextLimit !== undefined && contextLimit !== null
      ? Number(contextLimit)
      : null;

  // If not editing, NEVER show interactive split controls or markers in preview/print
  if (!isEditing) return null;

  const isCurrentSplit = activeSplitIndex === rowIndex;


  if (isCurrentSplit) {
    return (
      <tr className="no-print select-none" style={{ backgroundColor: "#eff6ff" }}>
        <td
          colSpan={colSpan}
          style={{
            padding: "4px 8px",
            border: "2px dashed #2563eb",
            backgroundColor: "#eff6ff",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "9pt",
              fontWeight: "bold",
              color: "#1d4ed8",
            }}
          >
            <span>✂️ 1. Sayfa Sonu ({rowIndex}. Satırdan Sonra 2. Sayfaya Geçiş)</span>
            <button
              type="button"
              onClick={() => onFieldChange?.("firstPageLimit", null)}
              style={{
                marginLeft: "8px",
                padding: "2px 8px",
                backgroundColor: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "8pt",
                fontWeight: "bold",
              }}
              title="Sayfa Bölmeyi Kaldır (Tek Sayfa Yap)"
            >
              ✕ Kaldır
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className="no-print select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        height: isHovered ? "24px" : "4px",
        transition: "height 0.15s ease",
      }}
    >
      <td
        colSpan={colSpan}
        style={{
          padding: 0,
          border: isHovered ? "1px dashed #3b82f6" : "none",
          backgroundColor: isHovered ? "#f0fdf4" : "transparent",
          textAlign: "center",
          verticalAlign: "middle",
        }}
      >
        {isHovered && (
          <button
            type="button"
            onClick={() => onFieldChange?.("firstPageLimit", rowIndex)}
            style={{
              padding: "2px 10px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "8pt",
              fontWeight: "bold",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title={`${rowIndex}. satırdan sonra tabloyu 2. sayfaya böl`}
          >
            <span>✂️ {rowIndex}. Satırdan Sayfayı Böl</span>
          </button>
        )}
      </td>
    </tr>
  );
};
