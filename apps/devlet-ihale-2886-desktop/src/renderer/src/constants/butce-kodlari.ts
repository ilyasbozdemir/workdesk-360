// =============================================
// ANALİTİK BÜTÇE SINIFLANDIRMASI - ABS KODLARI
// 5018 Sayılı Kamu Mali Yönetimi ve Kontrol Kanunu
// =============================================

// --- FONKSİYONEL KOD (4 düzey, 6 hane) ---
export const FONKSIYONEL_KODLAR = [
  { kod: '01', aciklama: 'Genel Kamu Hizmetleri' },
  { kod: '02', aciklama: 'Savunma Hizmetleri' },
  { kod: '03', aciklama: 'Kamu Düzeni ve Güvenlik Hizmetleri' },
  { kod: '04', aciklama: 'Ekonomik İşler ve Hizmetler' },
  { kod: '05', aciklama: 'Çevre Koruma Hizmetleri' },
  { kod: '06', aciklama: 'İskan ve Toplum Refahı Hizmetleri' },
  { kod: '07', aciklama: 'Sağlık Hizmetleri' },
  { kod: '08', aciklama: 'Dinlenme, Kültür ve Din Hizmetleri' },
  { kod: '09', aciklama: 'Eğitim Hizmetleri' },
  { kod: '10', aciklama: 'Sosyal Güvenlik ve Sosyal Yardım Hizmetleri' }
]

// --- FİNANSMAN TİPİ KODU (1 hane) ---
export const FINANSMAN_KODLARI = [
  { kod: '1', aciklama: 'Genel Bütçeli İdareler' },
  { kod: '2', aciklama: 'Özel Bütçeli İdareler' },
  { kod: '3', aciklama: 'Düzenleyici ve Denetleyici Kurumlar' },
  { kod: '4', aciklama: 'Sosyal Güvenlik Kurumları' },
  { kod: '5', aciklama: 'Mahalli İdareler (Belediye, İl Özel İdaresi, Köy)' },
  { kod: '6', aciklama: 'Özel Ödenekler' },
  { kod: '7', aciklama: 'Dış Proje Kredileri' },
  { kod: '8', aciklama: 'Bağış ve Yardımlar' }
]

// --- EKONOMİK KOD (4 düzey) ---
export const EKONOMIK_KODLAR = [
  { kod: '01', aciklama: 'Personel Giderleri' },
  { kod: '02', aciklama: 'Sosyal Güvenlik Kurumlarına Devlet Primi Giderleri' },
  { kod: '03', aciklama: 'Mal ve Hizmet Alım Giderleri' },
  { kod: '04', aciklama: 'Faiz Giderleri' },
  { kod: '05', aciklama: 'Cari Transferler' },
  { kod: '06', aciklama: 'Sermaye Giderleri' },
  { kod: '07', aciklama: 'Sermaye Transferleri' },
  { kod: '08', aciklama: 'Borç Verme' },
  { kod: '09', aciklama: 'Yedek Ödenekler' }
]

// --- GELİR EKONOMİK KODU ---
export const GELIR_KODLARI = [
  { kod: '01', aciklama: 'Vergi Gelirleri' },
  { kod: '02', aciklama: 'Sosyal Güvenlik Gelirleri' },
  { kod: '03', aciklama: 'Teşebbüs ve Mülkiyet Gelirleri' },
  { kod: '04', aciklama: 'Alınan Bağış ve Yardımlar ile Özel Gelirler' },
  { kod: '05', aciklama: 'Diğer Gelirler' },
  { kod: '06', aciklama: 'Sermaye Gelirleri' },
  { kod: '08', aciklama: 'Alacaklardan Tahsilat' },
  { kod: '09', aciklama: 'Red ve İadeler (-)' }
]
