import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacListesi } from "../BaseIhtiyacListesi";
import { YapimIsleriIhtiyacListesiType } from "./YapimIsleriIhtiyacListesi.schema";

export const YAPIM_ISLERI_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
  { key: "pozNo", label: "Poz No / İş Kalemi No", width: "14%", align: "center" },
  { key: "kalemAdi", label: "İmalat / İş Kalemi Adı", width: "26%", align: "left" },
  { key: "ozelligi", label: "Teknik Tarifi / Açıklama", width: "25%", align: "left" },
  { key: "birimi", label: "Ölçü Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "center" },
];

export interface YapimIsleriIhtiyacListesiProps {
  data?: Partial<YapimIsleriIhtiyacListesiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function YapimIsleriIhtiyacListesi(props: YapimIsleriIhtiyacListesiProps) {
  return (
    <BaseIhtiyacListesi
      {...props}
      defaultColumns={props.columns || YAPIM_ISLERI_TABLE_COLUMNS}
      itemDescriptionText="yapım / imalat iş"
    />
  );
}
