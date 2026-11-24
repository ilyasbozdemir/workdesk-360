export interface ArastirmaMektubuData {
  institution: { name: string; unit: string };
  document: { number: string; date: string };
  company: { name: string; address?: string };
  deadlineDate: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  officialSignatory: { name: string; title: string; date?: string };
}
