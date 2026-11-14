import React from "react";
import { ColumnDef } from "../../../document/DocumentTable";
import {
  BaseLuzumMuzekkeresiOnayEki,
  BaseLuzumMuzekkeresiOnayEkiProps,
} from "../BaseLuzumMuzekkeresiOnayEki";

export const DANISMANLIK_ONAY_EKI_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Ref / Hizmet Kodu", width: "14%", align: "left" },
  {
    key: "malzemeAdi",
    label: "Danışmanlık Konusu",
    width: "34%",
    align: "left",
  },
  {
    key: "ozelligi",
    label: "Kapsam / Uzmanlık Niteliği",
    width: "26%",
    align: "left",
  },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar / Süre", width: "10%", align: "right" },
];

export function DanismanlikLuzumMuzekkeresiOnayEki(
  props: BaseLuzumMuzekkeresiOnayEkiProps,
) {
  return (
    <BaseLuzumMuzekkeresiOnayEki
      {...props}
      columns={props.columns || DANISMANLIK_ONAY_EKI_COLUMNS}
      title={props.title || "LÜZUM MÜZEKKERESİ (DANIŞMANLIK HİZMETİ)"}
      talepMetniSuffix={props.talepMetniSuffix ||
        "için aşağıda kapsamı ve uzmanlık nitelikleri belirtilen danışmanlık hizmetine ihtiyaç görüldüğünden temin edilmesi arz olunur."}
    />
  );
}
