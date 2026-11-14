import { ColumnDef } from "../../../document/DocumentTable";
import { BaseLuzumMuzekkeresi } from "../BaseLuzumMuzekkeresi";
import { MalAlimiLuzumMuzekkeresiType } from "./MalAlimiLuzumMuzekkeresi.schema";

export const MAL_ALIMI_LUZUM_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
  { key: "kodu", label: "Kodu", width: "12%", align: "left" },
  { key: "malzemeAdi", label: "Malzeme Adı", width: "25%", align: "left" },
  { key: "ozelligi", label: "Özelliği", width: "20%", align: "left" },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı %", width: "8%", align: "center" },
  { key: "miktar", label: "Miktar", width: "12%", align: "right" },
];

export interface MalAlimiLuzumMuzekkeresiProps {
  data?: Partial<MalAlimiLuzumMuzekkeresiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function MalAlimiLuzumMuzekkeresi(props: MalAlimiLuzumMuzekkeresiProps) {
  const alimTuru = String(
    props.data?.alimTuru || props.data?.alim_turu || props.data?.tur || "",
  ).toLowerCase();

  const isExplicitMal = alimTuru === "mal" || alimTuru === "mal alımı";

  return (
    <BaseLuzumMuzekkeresi
      {...props}
      defaultColumns={props.columns || MAL_ALIMI_LUZUM_TABLE_COLUMNS}
      itemDescriptionText={isExplicitMal ? "mal" : "mal/hizmet"}
    />
  );
}
