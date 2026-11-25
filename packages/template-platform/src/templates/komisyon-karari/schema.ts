export interface KomisyonKarariData {
  institution: { name: string; unit: string };
  document: { number: string; date: string };
  company: { name: string };
  items: Array<{ name: string; quantity: number; unit: string }>;
  commissionMembers: Array<{ name: string; title: string; role: string }>;
}
