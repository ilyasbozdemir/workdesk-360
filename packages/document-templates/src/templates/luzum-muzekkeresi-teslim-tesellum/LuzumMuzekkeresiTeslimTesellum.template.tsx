import React from "react";
import { ColumnDef } from "../../document/DocumentTable";
import { LuzumMuzekkeresiTeslimTesellumType } from "./LuzumMuzekkeresiTeslimTesellum.schema";
import { MalAlimiLuzumMuzekkeresiTeslimTesellum } from "./MalAlimi/MalAlimiLuzumMuzekkeresiTeslimTesellum";
import { HizmetAlimiLuzumMuzekkeresiTeslimTesellum } from "./HizmetAlimi/HizmetAlimiLuzumMuzekkeresiTeslimTesellum";
import { DanismanlikLuzumMuzekkeresiTeslimTesellum } from "./DanismanlikHizmetAlimi/DanismanlikLuzumMuzekkeresiTeslimTesellum";
import { YapimIsleriLuzumMuzekkeresiTeslimTesellum } from "./YapimIsleri/YapimIsleriLuzumMuzekkeresiTeslimTesellum";
import {
  AlimTuru,
  detectAlimTuru,
} from "../ihtiyac-listesi/IhtiyacListesi.template";

export interface LuzumMuzekkeresiTeslimTesellumProps {
  data?: Partial<LuzumMuzekkeresiTeslimTesellumType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
  alimTuru?: AlimTuru;
  title?: string;
}

/**
 * Lüzum Müzekkeresi Teslim Tesellüm Ana Şablonu
 * Alım türüne (Mal, Hizmet, Danışmanlık, Yapım İşleri) göre ilgili alt şablonu otomatik olarak yönlendirir ve çizer.
 */
export function LuzumMuzekkeresiTeslimTesellum(
  props: LuzumMuzekkeresiTeslimTesellumProps,
) {
  const tur = props.alimTuru || detectAlimTuru(props.data);

  switch (tur) {
    case "yapim":
      return <YapimIsleriLuzumMuzekkeresiTeslimTesellum {...props} />;
    case "hizmet":
      return <HizmetAlimiLuzumMuzekkeresiTeslimTesellum {...props} />;
    case "danismanlik":
      return <DanismanlikLuzumMuzekkeresiTeslimTesellum {...props} />;
    case "mal":
    default:
      return <MalAlimiLuzumMuzekkeresiTeslimTesellum {...props} />;
  }
}
