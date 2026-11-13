import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacListesi } from "../BaseIhtiyacListesi";
import { DanismanlikIhtiyacListesiType } from "./DanismanlikIhtiyacListesi.schema";

export const DANISMANLIK_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
  { key: "kodu", label: "Hizmet Kodu", width: "12%", align: "left" },
  { key: "danismanlikKonusu", label: "Danışmanlık Hizmetinin Konusu", width: "28%", align: "left" },
  { key: "ozelligi", label: "Kapsam / Teknik Özellik", width: "25%", align: "left" },
  { key: "birimi", label: "Uzmanlık / Birim", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "center" },
];

export interface DanismanlikIhtiyacListesiProps {
  data?: Partial<DanismanlikIhtiyacListesiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function DanismanlikIhtiyacListesi(props: DanismanlikIhtiyacListesiProps) {
  return (
    <BaseIhtiyacListesi
      {...props}
      defaultColumns={props.columns || DANISMANLIK_TABLE_COLUMNS}
      itemDescriptionText="danışmanlık hizmet"
    />
  );
}

