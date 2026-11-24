export interface IhtiyacOluruData {
  institution: { name: string; unit: string };
  document: { number: string; date: string };
  procurementMeta: { fileNumber: string; budgetYear: string; procurementMethod: string; creator: string };
  justificationText: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  harcamaYetkilisi: { name: string; title: string };
}
