export interface NormalizedMember {
  name: string;
  title: string;
  role: string;
}

export function normalizeCommissionMembers(members: any[]): NormalizedMember[] {
  if (!Array.isArray(members)) return [];
  return members.map((m) => ({
    name: m.ad_soyad || m.name || '',
    title: m.unvan || m.title || '',
    role: m.gorev || m.role || 'Üye'
  }));
}
