import React from "react";
import { ColumnDef } from "../../../document/DocumentTable";
import {
  BaseLuzumMuzekkeresiOnayEki,
  BaseLuzumMuzekkeresiOnayEkiProps,
} from "../BaseLuzumMuzekkeresiOnayEki";

export const MAL_ALIMI_ONAY_EKI_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Taşınır Kodu", width: "14%", align: "left" },
  { key: "malzemeAdi", label: "Malzeme Adı", width: "32%", align: "left" },
  { key: "ozelligi", label: "Özelliği", width: "24%", align: "left" },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV Oranı (%)", width: "6%", align: "center" },
  { key: "miktar", label: "Miktar", width: "8%", align: "right" },
];

export function MalAlimiLuzumMuzekkeresiOnayEki(
  props: BaseLuzumMuzekkeresiOnayEkiProps,
) {
  return (
    <BaseLuzumMuzekkeresiOnayEki
      {...props}
      columns={props.columns || MAL_ALIMI_ONAY_EKI_COLUMNS}
      title={props.title || "LÜZUM MÜZEKKERESİ (MAL ALIMI)"}
      talepMetniSuffix={props.talepMetniSuffix ||
        "için aşağıda müfredatı ve evsafı yazılı malzemelere ihtiyaç görüldüğünden satın alınması arz olunur."}
    />
  );
}
