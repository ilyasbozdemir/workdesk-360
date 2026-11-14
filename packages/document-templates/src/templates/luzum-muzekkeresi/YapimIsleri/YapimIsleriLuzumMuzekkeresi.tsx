import { ColumnDef } from "../../../document/DocumentTable";
import { BaseLuzumMuzekkeresi } from "../BaseLuzumMuzekkeresi";
import { YapimIsleriLuzumMuzekkeresiType } from "./YapimIsleriLuzumMuzekkeresi.schema";

export const YAPIM_ISLERI_LUZUM_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "8%", align: "center" },
  { key: "pozNo", label: "Poz No / İş Kalemi No", width: "12%", align: "center" },
  { key: "kalemAdi", label: "İmalat / İş Kalemi Adı", width: "25%", align: "left" },
  { key: "ozelligi", label: "Teknik Tarifi / Açıklama", width: "20%", align: "left" },
  { key: "birimi", label: "Ölçü Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı %", width: "8%", align: "center" },
  { key: "miktar", label: "Miktar", width: "12%", align: "right" },
];

export interface YapimIsleriLuzumMuzekkeresiProps {
  data?: Partial<YapimIsleriLuzumMuzekkeresiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function YapimIsleriLuzumMuzekkeresi(props: YapimIsleriLuzumMuzekkeresiProps) {
  return (
    <BaseLuzumMuzekkeresi
      {...props}
      defaultColumns={props.columns || YAPIM_ISLERI_LUZUM_TABLE_COLUMNS}
      itemDescriptionText="yapım / imalat iş"
    />
  );
}
