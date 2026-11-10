import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacListesi } from "../BaseIhtiyacListesi";
import { HizmetAlimiIhtiyacListesiType } from "./HizmetAlimiIhtiyacListesi.schema";

export const HIZMET_ALIMI_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
  { key: "kodu", label: "Hizmet Kodu", width: "12%", align: "left" },
  { key: "kalemAdi", label: "Hizmetin Adı", width: "28%", align: "left" },
  { key: "ozelligi", label: "Hizmetin Niteliği / Açıklama", width: "25%", align: "left" },
  { key: "birimi", label: "Birimi / Süre", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "center" },
];

export interface HizmetAlimiIhtiyacListesiProps {
  data?: Partial<HizmetAlimiIhtiyacListesiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function HizmetAlimiIhtiyacListesi(props: HizmetAlimiIhtiyacListesiProps) {
  return (
    <BaseIhtiyacListesi
      {...props}
      defaultColumns={props.columns || HIZMET_ALIMI_TABLE_COLUMNS}
      itemDescriptionText="hizmet"
    />
  );
}

