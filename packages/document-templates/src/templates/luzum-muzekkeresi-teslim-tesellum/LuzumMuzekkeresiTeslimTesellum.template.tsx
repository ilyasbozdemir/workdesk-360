import React from "react";
import { ColumnDef } from "../../document/DocumentTable";
import { LuzumMuzekkeresiTeslimTesellumType } from "./LuzumMuzekkeresiTeslimTesellum.schema";
import {
  BaseLuzumMuzekkeresiTeslimTesellum,
  BaseLuzumTeslimTesellumProps,
} from "./BaseLuzumMuzekkeresiTeslimTesellum";
import {
  MAL_ALIMI_TESLIM_COLUMNS,
  MalAlimiLuzumMuzekkeresiTeslimTesellum,
} from "./MalAlimi/MalAlimiLuzumMuzekkeresiTeslimTesellum";

export { MAL_ALIMI_TESLIM_COLUMNS, MalAlimiLuzumMuzekkeresiTeslimTesellum };

export interface LuzumMuzekkeresiTeslimTesellumProps
  extends BaseLuzumTeslimTesellumProps {
  data?: Partial<LuzumMuzekkeresiTeslimTesellumType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  alimTuru?: string;
  title?: string;
}

/**
 * Lüzum Müzekkeresi Teslim Tesellüm Ana Şablonu
 * Kamu İhale Mevzuatı ve Taşınır Mal Yönetmeliği uyarınca Teslim Tesellüm Tutanağı
 * fiziki malzeme teslimi içeren Mal Alımı süreçlerinde düzenlenir.
 * (Hizmet ve Yapım işlerinde mevzuat gereği Kabul Tutanakları ve Puantaj düzenlenir.)
 */
export function LuzumMuzekkeresiTeslimTesellum(
  props: LuzumMuzekkeresiTeslimTesellumProps,
) {
  return (
    <BaseLuzumMuzekkeresiTeslimTesellum
      {...props}
      columns={props.columns || MAL_ALIMI_TESLIM_COLUMNS}
      title={props.title || "TESLİM TESELLÜM BELGESİ"}
    />
  );
}
