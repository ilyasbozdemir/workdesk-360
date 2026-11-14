import React from "react";
import { ColumnDef } from "../../../document/DocumentTable";
import {
  BaseLuzumMuzekkeresiTeslimTesellum,
  BaseLuzumTeslimTesellumProps,
} from "../BaseLuzumMuzekkeresiTeslimTesellum";

export const HIZMET_ALIMI_TESLIM_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Hizmet Kodu", width: "14%", align: "left" },
  {
    key: "malzemeAdi",
    label: "Hizmet / İşin Adı",
    width: "32%",
    align: "left",
  },
  {
    key: "ozelligi",
    label: "İşin Tanımı ve Detayları",
    width: "20%",
    align: "left",
  },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV Oranı (%)", width: "8%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "center" },
];

export function HizmetAlimiLuzumMuzekkeresiTeslimTesellum(
  props: BaseLuzumTeslimTesellumProps,
) {
  return (
    <BaseLuzumMuzekkeresiTeslimTesellum
      {...props}
      columns={props.columns || HIZMET_ALIMI_TESLIM_COLUMNS}
      title={props.title || "TESLİM TESELLÜM BELGESİ (HİZMET ALIMI)"}
    />
  );
}
