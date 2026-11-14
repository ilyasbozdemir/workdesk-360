import { ColumnDef } from "../../../document/DocumentTable";
import { BaseLuzumMuzekkeresi } from "../BaseLuzumMuzekkeresi";
import { HizmetAlimiLuzumMuzekkeresiType } from "./HizmetAlimiLuzumMuzekkeresi.schema";

export const HIZMET_ALIMI_LUZUM_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
  { key: "kodu", label: "Hizmet Kodu", width: "12%", align: "left" },
  { key: "kalemAdi", label: "Hizmetin Adı", width: "25%", align: "left" },
  { key: "ozelligi", label: "Hizmetin Niteliği / Açıklama", width: "20%", align: "left" },
  { key: "birimi", label: "Birimi / Süre", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı %", width: "8%", align: "center" },
  { key: "miktar", label: "Miktar", width: "12%", align: "right" },
];

export interface HizmetAlimiLuzumMuzekkeresiProps {
  data?: Partial<HizmetAlimiLuzumMuzekkeresiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function HizmetAlimiLuzumMuzekkeresi(props: HizmetAlimiLuzumMuzekkeresiProps) {
  return (
    <BaseLuzumMuzekkeresi
      {...props}
      defaultColumns={props.columns || HIZMET_ALIMI_LUZUM_TABLE_COLUMNS}
      itemDescriptionText="hizmet"
    />
  );
}
