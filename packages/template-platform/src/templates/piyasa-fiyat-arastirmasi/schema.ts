export interface PiyasaFiyatArastirmasiData {
  institution: { name: string; unit: string };
  document: { number: string; date: string };
  items: Array<{ name: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }>;
  grandTotal: number;
  winnerCompany: { name: string };
  commissionMembers: Array<{ name: string; title: string; role: string }>;
}
