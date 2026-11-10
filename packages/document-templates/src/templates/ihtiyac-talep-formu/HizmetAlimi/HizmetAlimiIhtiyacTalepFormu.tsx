import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacTalepFormu } from "../BaseIhtiyacTalepFormu";
import { HizmetAlimiIhtiyacTalepFormuType } from "./HizmetAlimiIhtiyacTalepFormu.schema";

export const HIZMET_ALIMI_TALEP_FORMU_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S. NO", width: "8%", align: "center" },
  {
    key: "kalemAdi",
    label: "HİZMETİN ADI",
    width: "35%",
    align: "left",
  },
  { key: "ozelligi", label: "HİZMETİN NİTELİĞİ / AÇIKLAMA", width: "25%", align: "left" },
  { key: "miktar", label: "MİKTAR", width: "10%", align: "right" },
  { key: "birimi", label: "BİRİMİ / SÜRE", width: "10%", align: "center" },
  { key: "kodu", label: "HİZMET KODU", width: "12%", align: "center" },
];

export interface HizmetAlimiIhtiyacTalepFormuProps {
  data?: Partial<HizmetAlimiIhtiyacTalepFormuType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function HizmetAlimiIhtiyacTalepFormu(props: HizmetAlimiIhtiyacTalepFormuProps) {
  return (
    <BaseIhtiyacTalepFormu
      {...props}
      defaultColumns={props.columns || HIZMET_ALIMI_TALEP_FORMU_COLUMNS}
      itemDescriptionText="hizmet"
    />
  );
}
