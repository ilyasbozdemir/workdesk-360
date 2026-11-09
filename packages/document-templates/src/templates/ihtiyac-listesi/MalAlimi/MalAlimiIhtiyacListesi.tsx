import { ColumnDef } from "../../../document/DocumentTable";
import { BaseIhtiyacListesi } from "../BaseIhtiyacListesi";
import { MalAlimiIhtiyacListesiType } from "./MalAlimiIhtiyacListesi.schema";

export const MAL_ALIMI_TABLE_COLUMNS: ColumnDef[] = [
  { key: "siraNo", label: "Sıra No", width: "5%", align: "center" },
  { key: "kodu", label: "Taşınır Kodu", width: "12%", align: "left" },
  { key: "malzemeAdi", label: "Malzeme Adı", width: "28%", align: "left" },
  { key: "ozelligi", label: "Özelliği / Açıklama", width: "25%", align: "left" },
  { key: "birimi", label: "Birimi", width: "10%", align: "center" },
  { key: "kdvOrani", label: "KDV  Oranı (%)", width: "10%", align: "center" },
  { key: "miktar", label: "Miktar", width: "10%", align: "center" },
];

export interface MalAlimiIhtiyacListesiProps {
  data?: Partial<MalAlimiIhtiyacListesiType> & Record<string, any>;
  columns?: ColumnDef[];
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
  firstPageLimit?: number;
  middlePageLimit?: number;
  lastPageLimit?: number;
}

export function MalAlimiIhtiyacListesi(props: MalAlimiIhtiyacListesiProps) {
  const alimTuru = String(
    props.data?.alimTuru || props.data?.alim_turu || props.data?.tur || "",
  ).toLowerCase();

  const isExplicitMal = alimTuru === "mal" || alimTuru === "mal alımı";

  return (
    <BaseIhtiyacListesi
      {...props}
      defaultColumns={props.columns || MAL_ALIMI_TABLE_COLUMNS}
      itemDescriptionText={isExplicitMal ? "mal" : "mal/hizmet"}
    />
  );
}
