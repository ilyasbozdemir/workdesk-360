import React from "react";
import { ColumnDef } from "../../../document/DocumentTable";
import {
  BaseLuzumMuzekkeresiOnayEki,
  BaseLuzumMuzekkeresiOnayEkiProps,
} from "../BaseLuzumMuzekkeresiOnayEki";

export const HIZMET_ALIMI_ONAY_EKI_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Hizmet Kodu", width: "14%", align: "left" },
  {
    key: "malzemeAdi",
    label: "Hizmet Adı / İşin Tanımı",
    width: "34%",
    align: "left",
  },
  { key: "ozelligi", label: "Açıklama / Şartlar", width: "26%", align: "left" },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar / Süre", width: "10%", align: "right" },
];

export function HizmetAlimiLuzumMuzekkeresiOnayEki(
  props: BaseLuzumMuzekkeresiOnayEkiProps,
) {
  return (
    <BaseLuzumMuzekkeresiOnayEki
      {...props}
      columns={props.columns || HIZMET_ALIMI_ONAY_EKI_COLUMNS}
      title={props.title || "LÜZUM MÜZEKKERESİ"}
      talepMetniSuffix={props.talepMetniSuffix ||
        "için aşağıda nev'i ve şartları yazılı hizmete ihtiyaç görüldüğünden temin edilmesi arz olunur."}
    />
  );
}
