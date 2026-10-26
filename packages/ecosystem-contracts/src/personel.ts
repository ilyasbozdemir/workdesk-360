/**
 * Personel 360 — Bağımsız Masaüstü Uygulaması Veri Sözleşmeleri ve İş Kuralları
 * 
 * Personel 360, kendi .exe kurulumuna (Personel360.exe) ve bağımsız veri alanına sahip
 * kurumsal personel, izin, görevlendirme ve sicil yönetim masaüstü uygulamasıdır.
 */

// ============================================================================
// 1. Personel Kayıtları
// ============================================================================

export type CalismaDurumu = 'aktif' | 'izinli' | 'gorevlendirmede' | 'ayrilmis' | 'askiya_alindi'

export interface PersonelRecord {
  id: string
  tcKimlikNo: string
  sicilNo: string
  ad: string
  soyad: string
  unvan: string
  kadro: string
  birimId: string
  birimAdi: string
  iseBaslamaTarihi: string
  calismaDurumu: CalismaDurumu
  telefon?: string
  eposta?: string
  kanGrubu?: string
  adres?: string
  olusturulduguTarih: string
  guncellendigiTarih: string
}

// ============================================================================
// 2. İzin Yönetimi ve Türleri
// ============================================================================

export type IzinTuru =
  | 'yillik'
  | 'mazeret'
  | 'hastalik'
  | 'evlilik'
  | 'babalik'
  | 'olum'
  | 'ucretsiz'
  | 'diger'

export type IzinTalebiDurumu =
  | 'taslak'
  | 'onayda'
  | 'onaylandi'
  | 'reddedildi'
  | 'iade_edildi'
  | 'iptal_edildi'

export interface IzinOnayAdimi {
  unvan: string
  onaylayanKullaniciId?: string
  onaylayanAdi?: string
  onayTarihi?: string
  karar: 'bekliyor' | 'onaylandi' | 'reddedildi'
  aciklama?: string
}

export interface IzinTalebi {
  id: string
  personelId: string
  personelAdSoyad: string
  sicilNo: string
  izinTuru: IzinTuru
  baslangicTarihi: string  // ISO date: 'YYYY-MM-DD'
  bitisTarihi: string      // ISO date: 'YYYY-MM-DD'
  gunSayisi: number
  aciklama: string
  durum: IzinTalebiDurumu
  onayAdimlari: IzinOnayAdimi[]
  redGerekcesi?: string
  belgeArtifactPath?: string
  olusturulduguTarih: string
  guncellendigiTarih: string
}

export interface IzinBakiyesi {
  id: string
  personelId: string
  yil: number
  hakEdilenGun: number
  devredenGun: number
  kullanilanGun: number
  kalanGun: number
}

// ============================================================================
// 3. Görevlendirme ve Personel Hareketleri
// ============================================================================

export type GorevlendirmeTuru = 'gecici_gorev' | 'vekaleleten' | 'komisyon_gorevi' | 'nakil'

export interface Gorevlendirme {
  id: string
  personelId: string
  gorevTuru: GorevlendirmeTuru
  gorevlendirilenBirimId?: string
  gorevlendirilenBirimAdi?: string
  gorevTanimi: string
  baslangicTarihi: string
  bitisTarihi?: string
  olurNo?: string
  olurTarihi?: string
  durum: 'aktif' | 'tamamlandi' | 'iptal'
}

// ============================================================================
// 4. Denetlenebilir İşlem Geçmişi (Audit Log)
// ============================================================================

export interface PersonelIslemGecmisi {
  id: string
  personelId: string
  islemTuru: 'kayit_olusturma' | 'izin_talebi' | 'izin_onayi' | 'izin_reddi' | 'gorevlendirme' | 'bakiye_duzeltme'
  aciklama: string
  yapanKullaniciId: string
  yapanKullaniciAdi: string
  tarih: string
  eskiDeger?: Record<string, unknown>
  yeniDeger?: Record<string, unknown>
}

// ============================================================================
// 5. Doğrulanmış Personel İş Mantığı ve Hesaplamalar
// ============================================================================

/**
 * İki tarih arasındaki gün sayısını hesaplar (hafta sonu ve resmi tatil kuralları genişletilebilir).
 */
export function calculateIzinGunu(baslangicIso: string, bitisIso: string): number {
  const start = new Date(baslangicIso)
  const end = new Date(bitisIso)
  const diffTime = end.getTime() - start.getTime()
  if (diffTime < 0) return 0
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

/**
 * İzin talebini bakiye ve çakışan tarihlere göre doğrular.
 */
export function validateIzinTalebiKurallari(params: {
  talep: Omit<IzinTalebi, 'id' | 'durum' | 'onayAdimlari' | 'olusturulduguTarih' | 'guncellendigiTarih'>
  bakiye?: IzinBakiyesi
  mevcutTalepler: IzinTalebi[]
}): { gecerli: boolean; hata?: string } {
  const { talep, bakiye, mevcutTalepler } = params

  if (new Date(talep.baslangicTarihi) > new Date(talep.bitisTarihi)) {
    return { gecerli: false, hata: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.' }
  }

  // Yıllık izin bakiye kontrolü
  if (talep.izinTuru === 'yillik' && bakiye) {
    if (talep.gunSayisi > bakiye.kalanGun) {
      return {
        gecerli: false,
        hata: `Talep edilen gün (${talep.gunSayisi}), kalan yıllık izin bakiyesinden (${bakiye.kalanGun}) fazladır.`
      }
    }
  }

  // Çakışan izin kontrolü
  const talepBaslangic = new Date(talep.baslangicTarihi).getTime()
  const talepBitis = new Date(talep.bitisTarihi).getTime()

  const cakisan = mevcutTalepler.find((m) => {
    if (m.durum === 'reddedildi' || m.durum === 'iptal_edildi') return false
    const mBaslangic = new Date(m.baslangicTarihi).getTime()
    const mBitis = new Date(m.bitisTarihi).getTime()
    return talepBaslangic <= mBitis && talepBitis >= mBaslangic
  })

  if (cakisan) {
    return {
      gecerli: false,
      hata: `Belirtilen tarih aralığında onaylanmış veya bekleyen başka bir izin talebi bulunmaktadır (Tarih: ${cakisan.baslangicTarihi} - ${cakisan.bitisTarihi}).`
    }
  }

  return { gecerli: true }
}
