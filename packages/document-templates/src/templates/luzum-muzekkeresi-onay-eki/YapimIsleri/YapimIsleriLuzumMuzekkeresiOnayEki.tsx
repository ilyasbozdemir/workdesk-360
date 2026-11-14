import React from "react";
import { ColumnDef } from "../../../document/DocumentTable";
import {
  BaseLuzumMuzekkeresiOnayEki,
  BaseLuzumMuzekkeresiOnayEkiProps,
} from "../BaseLuzumMuzekkeresiOnayEki";

export const YAPIM_ISLERI_ONAY_EKI_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S.No", width: "6%", align: "center" },
  { key: "kodu", label: "Poz / İş Kalemi No", width: "14%", align: "left" },
  {
    key: "malzemeAdi",
    label: "İmalat Adı / İş Kalemi",
    width: "34%",
    align: "left",
  },
  {
    key: "ozelligi",
    label: "Teknik Tarifi / Mahal",
    width: "26%",
    align: "left",
  },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "right" },
];

export function YapimIsleriLuzumMuzekkeresiOnayEki(
  props: BaseLuzumMuzekkeresiOnayEkiProps,
) {
  return (
    <BaseLuzumMuzekkeresiOnayEki
      {...props}
      columns={props.columns || YAPIM_ISLERI_ONAY_EKI_COLUMNS}
      title={props.title || "LÜZUM MÜZEKKERESİ (YAPIM İŞLERİ)"}
      talepMetniSuffix={props.talepMetniSuffix ||
        "için aşağıda cins ve mahal bilgileri belirtilen yapım / onarım iş kalemlerine ihtiyaç görüldüğünden yapılması/yaptırılması arz olunur."}
    />
  );
}
