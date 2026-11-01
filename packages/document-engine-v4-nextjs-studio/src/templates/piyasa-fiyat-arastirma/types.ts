export type Kalem = { id: string; siraNo: number | null; ad: string | null; miktar: number | null; birim: string | null };
export type KomisyonUyesi = { id: string; adSoyad: string | null; unvan: string | null; gorev: string | null };
export type Teklif = { id: string; firma: string | null; itemId: string | null; birimFiyat: number | null };
export type PiyasaFiyatArastirmaData = {
  global: { kurum: { ad: string; adres: string | null; logo: string | null }; yetkili: { adSoyad: string | null; unvan: string | null } };
  document: { dosya: { dosyaNo: string; konu: string; tarih: string | null; birimAdi: string | null }; kalemSayisi: number; kalemler: Kalem[]; komisyon: KomisyonUyesi[]; teklifler: Teklif[]; aciklama: string };
};
