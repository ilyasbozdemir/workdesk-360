import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacTalepFormu } from "../BaseIhtiyacTalepFormu";
import { YapimIsleriIhtiyacTalepFormuType } from "./YapimIsleriIhtiyacTalepFormu.schema";

export const YAPIM_ISLERI_TALEP_FORMU_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "S. NO", width: "8%", align: "center" },
  {
    key: "kalemAdi",
    label: "İMALAT / İŞ KALEMİ ADI",
    width: "35%",
    align: "left",
  },
  { key: "ozelligi", label: "TEKNİK TARİFİ / AÇIKLAMA", width: "25%", align: "left" },
  { key: "miktar", label: "MİKTAR", width: "10%", align: "right" },
  { key: "birimi", label: "ÖLÇÜ BİRİMİ", width: "10%", align: "center" },
  { key: "pozNo", label: "POZ NO", width: "12%", align: "center" },
];

export interface YapimIsleriIhtiyacTalepFormuProps {
  data?: Partial<YapimIsleriIhtiyacTalepFormuType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function YapimIsleriIhtiyacTalepFormu(props: YapimIsleriIhtiyacTalepFormuProps) {
  return (
    <BaseIhtiyacTalepFormu
      {...props}
      defaultColumns={props.columns || YAPIM_ISLERI_TALEP_FORMU_COLUMNS}
      itemDescriptionText="yapım / imalat iş"
    />
  );
}
