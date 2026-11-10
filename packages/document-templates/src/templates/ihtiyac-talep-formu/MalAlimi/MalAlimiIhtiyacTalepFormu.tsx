import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacTalepFormu } from "../BaseIhtiyacTalepFormu";
import { MalAlimiIhtiyacTalepFormuType } from "./MalAlimiIhtiyacTalepFormu.schema";

export const MAL_ALIMI_TALEP_FORMU_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S. NO", width: "8%", align: "center" },
  {
    key: "malzemeAdi",
    label: "MALZEME ADI",
    width: "35%",
    align: "left",
  },
  { key: "ozelligi", label: "ÖZELLİĞİ / AÇIKLAMA", width: "25%", align: "left" },
  { key: "miktar", label: "MİKTAR", width: "10%", align: "right" },
  { key: "birimi", label: "BİRİM", width: "10%", align: "center" },
  { key: "kodu", label: "TAŞINIR KODU", width: "12%", align: "center" },
];

export interface MalAlimiIhtiyacTalepFormuProps {
  data?: Partial<MalAlimiIhtiyacTalepFormuType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function MalAlimiIhtiyacTalepFormu(props: MalAlimiIhtiyacTalepFormuProps) {
  return (
    <BaseIhtiyacTalepFormu
      {...props}
      defaultColumns={props.columns || MAL_ALIMI_TALEP_FORMU_COLUMNS}
      itemDescriptionText="mal"
    />
  );
}
