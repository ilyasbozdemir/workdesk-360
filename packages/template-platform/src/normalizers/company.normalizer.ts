export interface NormalizedCompany {
  name: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export function normalizeCompany(raw: any): NormalizedCompany {
  if (!raw) return { name: '' };
  return {
    name: raw.unvan || raw.name || '',
    taxNumber: raw.vergi_no || raw.taxNumber || '',
    taxOffice: raw.vergi_dairesi || raw.taxOffice || '',
    address: raw.adres || raw.address || '',
    phone: raw.telefon || raw.phone || '',
    email: raw.eposta || raw.email || ''
  };
}
