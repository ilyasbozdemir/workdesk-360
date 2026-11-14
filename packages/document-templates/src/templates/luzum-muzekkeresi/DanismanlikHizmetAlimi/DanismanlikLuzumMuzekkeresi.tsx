import { ColumnDef } from "../../../document/DocumentTable";
import { BaseLuzumMuzekkeresi } from "../BaseLuzumMuzekkeresi";
import { DanismanlikLuzumMuzekkeresiType } from "./DanismanlikLuzumMuzekkeresi.schema";

export const DANISMANLIK_LUZUM_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
  { key: "kodu", label: "Hizmet Kodu", width: "12%", align: "left" },
  {
    key: "danismanlikKonusu",
    label: "Danışmanlık Hizmetinin Konusu",
    width: "25%",
    align: "left",
  },
  {
    key: "ozelligi",
    label: "Kapsam / Teknik Özellik",
    width: "20%",
    align: "left",
  },
  { key: "birimi", label: "Uzmanlık / Birim", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı %", width: "8%", align: "center" },
  { key: "miktar", label: "Miktar", width: "12%", align: "right" },
];

export interface DanismanlikLuzumMuzekkeresiProps {
  data?: Partial<DanismanlikLuzumMuzekkeresiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function DanismanlikLuzumMuzekkeresi(
  props: DanismanlikLuzumMuzekkeresiProps,
) {
  return (
    <BaseLuzumMuzekkeresi
      {...props}
      defaultColumns={props.columns || DANISMANLIK_LUZUM_TABLE_COLUMNS}
      itemDescriptionText="danışmanlık hizmet"
    />
  );
}
