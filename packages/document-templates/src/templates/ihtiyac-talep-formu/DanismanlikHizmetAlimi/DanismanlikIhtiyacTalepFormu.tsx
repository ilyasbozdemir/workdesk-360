import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacTalepFormu } from "../BaseIhtiyacTalepFormu";
import { DanismanlikIhtiyacTalepFormuType } from "./DanismanlikIhtiyacTalepFormu.schema";

export const DANISMANLIK_TALEP_FORMU_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S. NO", width: "8%", align: "center" },
  {
    key: "danismanlikKonusu",
    label: "DANIŞMANLIK HİZMETİNİN KONUSU",
    width: "35%",
    align: "left",
  },
  { key: "ozelligi", label: "KAPSAM / TEKNİK ÖZELLİK", width: "25%", align: "left" },
  { key: "miktar", label: "MİKTAR", width: "10%", align: "right" },
  { key: "birimi", label: "UZMANLIK / BİRİM", width: "10%", align: "center" },
  { key: "kodu", label: "HİZMET KODU", width: "12%", align: "center" },
];

export interface DanismanlikIhtiyacTalepFormuProps {
  data?: Partial<DanismanlikIhtiyacTalepFormuType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function DanismanlikIhtiyacTalepFormu(props: DanismanlikIhtiyacTalepFormuProps) {
  return (
    <BaseIhtiyacTalepFormu
      {...props}
      defaultColumns={props.columns || DANISMANLIK_TALEP_FORMU_COLUMNS}
      itemDescriptionText="danışmanlık hizmet"
    />
  );
}
