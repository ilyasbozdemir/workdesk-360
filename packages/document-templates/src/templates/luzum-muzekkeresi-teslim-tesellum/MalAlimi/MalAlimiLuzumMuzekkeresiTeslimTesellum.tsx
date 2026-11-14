import React from "react";
import { ColumnDef } from "../../../document/DocumentTable";
import {
  BaseLuzumMuzekkeresiTeslimTesellum,
  BaseLuzumTeslimTesellumProps,
} from "../BaseLuzumMuzekkeresiTeslimTesellum";

export const MAL_ALIMI_TESLIM_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Taşınır Kodu", width: "14%", align: "left" },
  { key: "malzemeAdi", label: "Malzeme Adı", width: "32%", align: "left" },
  { key: "ozelligi", label: "Özelliği", width: "20%", align: "left" },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV Oranı (%)", width: "8%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "center" },
];

export function MalAlimiLuzumMuzekkeresiTeslimTesellum(
  props: BaseLuzumTeslimTesellumProps,
) {
  return (
    <BaseLuzumMuzekkeresiTeslimTesellum
      {...props}
      columns={props.columns || MAL_ALIMI_TESLIM_COLUMNS}
      title={props.title || "TESLİM TESELLÜM BELGESİ"}
    />
  );
}
