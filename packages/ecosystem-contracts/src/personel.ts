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
  sendikaUyesiMi?: boolean
  sendikaAdi?: string
  sendikaGorevi?: 'uye' | 'isyeri_temsilcisi' | 'sube_yoneticisi' | 'genel_merkez'
  tisKapsamindaMi?: boolean
  olusturulduguTarih: string
  guncellendigiTarih: string
}

// ============================================================================
// 2. İzin Yönetimi, Fiş Türleri ve Mevzuat / Sendika Kuralları
// ============================================================================

export type IzinTuru =
  | 'yillik'
  | 'sendika'
  | 'mazeret'
  | 'hastalik'
  | 'evlilik'
  | 'babalik'
  | 'olum'
  | 'ucretsiz'
  | 'idari'
  | 'diger'

/**
 * Fiş Tipi / İzin Kuralı Yapılandırması:
 * İzin türünün mevzuata, kanuna (657/4857) veya sendika TİS anlaşmasına göre
 * nasıl hesaplanacağını, bakiyeden düşüp düşmeyeceğini ve şartlarını belirler.
 */
export interface IzinTipiKurali {
  kod: IzinTuru
  ad: string
  kadroTuru: 'hepsi' | 'memur_657' | 'isci_4857' | 'sozlesmeli_4b'
  bakiyedenDuserMi: boolean        // true ise yıllık izin bakiyesinden düşer (örn: yillik: true, sendika: false)
  haftaSonuHaricMi: boolean        // true ise Cumartesi-Pazar günleri hesaba katılmaz (örn: işçi TİS)
  ucretliMi: boolean               // Ücretli izin mi (ücretsiz izin hariç hepsi true)
  belgeZorunluMu: boolean          // Belge / rapor / sendika çağrı yazısı zorunlu mu?
  yillikKotaGun?: number           // Yıllık azami kota (örn: sendika: 30 gün, mazeret: 10 gün)
  sendikaGerektirirMi?: boolean    // Sadece sendika üyelerine / yöneticilerine mi açık?
  aciklama?: string
}

export const DEFAULT_IZIN_TIPI_KURALLARI: IzinTipiKurali[] = [
  {
    kod: 'yillik',
    ad: 'Yıllık Ücretli İzin',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: true,
    haftaSonuHaricMi: false, // 657'de takvim günü, 4857 TİS'te opsiyonel
    ucretliMi: true,
    belgeZorunluMu: false,
    aciklama: 'Kıdeme göre hak edilen yıllık izin hakkından düşülür.'
  },
  {
    kod: 'sendika',
    ad: 'Sendikal Faaliyet / Temsilci İzni',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false, // YILLIK İZİNDEN DÜŞMEZ!
    haftaSonuHaricMi: true,
    ucretliMi: true,
    belgeZorunluMu: true,    // Sendika görevlendirme / çağrı yazısı zorunlu
    yillikKotaGun: 30,       // 4688 md. 18 / TİS gereğince temsilci kotası
    sendikaGerektirirMi: true,
    aciklama: '4688 ve 6356 sayılı kanunlar ile TİS kapsamındaki sendikal izin hakkı.'
  },
  {
    kod: 'mazeret',
    ad: 'Mazeret İzni (Md. 104/C)',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: true,
    ucretliMi: true,
    belgeZorunluMu: false,
    yillikKotaGun: 10,
    aciklama: 'Yıllık izin bakiyesini etkilemez, amir takdirine bağlı yıllık 10 güne kadar mazeret.'
  },
  {
    kod: 'evlilik',
    ad: 'Evlilik İzni',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: false,
    ucretliMi: true,
    belgeZorunluMu: true,
    yillikKotaGun: 7,
    aciklama: '657 md. 104/B uyarınca 7 gün.'
  },
  {
    kod: 'babalik',
    ad: 'Babalık (Doğum) İzni',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: false,
    ucretliMi: true,
    belgeZorunluMu: true,
    yillikKotaGun: 10,
    aciklama: '657 md. 104/B uyarınca eşi doğum yapan personele 10 gün.'
  },
  {
    kod: 'olum',
    ad: 'Vefat / Ölüm İzni',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: false,
    ucretliMi: true,
    belgeZorunluMu: true,
    yillikKotaGun: 7,
    aciklama: '1. derece yakınların vefatı halinde 7 gün.'
  },
  {
    kod: 'hastalik',
    ad: 'Hastalık / Rapor İzni',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: false,
    ucretliMi: true,
    belgeZorunluMu: true,
    aciklama: 'Hekim veya sağlık kurulu raporuna istinaden verilen izin.'
  },
  {
    kod: 'ucretsiz',
    ad: 'Aylıksız / Ücretsiz İzin',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: false,
    ucretliMi: false,
    belgeZorunluMu: true,
    aciklama: 'Hizmet yılına bağlı olarak 1 yıla veya 5 yıla kadar alınabilen aylıksız izin.'
  },
  {
    kod: 'idari',
    ad: 'İdari İzin / Nöbet İzni',
    kadroTuru: 'hepsi',
    bakiyedenDuserMi: false,
    haftaSonuHaricMi: true,
    ucretliMi: true,
    belgeZorunluMu: false,
    aciklama: 'Valilik/Bakanlık genelgesi veya kurum içi nöbet denkleştirmesi izni.'
  }
]

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
 * Personelin statüsüne ve hizmet yılına göre mevzuata uygun hak ediş gün sayısını hesaplar.
 * 
 * - 657 Memur: 1-10 yıl (dahil) 20 gün, 10 yıldan fazla 30 gün, 1 yıldan az 0 gün
 * - 4857 İşçi: 1-5 yıl (dahil) 14 gün, 5-15 yıl 20 gün, 15 yıl ve üzeri 26 gün
 */
export function calculateIzinHakedisi(params: {
  kadroTuru: 'memur_657' | 'isci_4857' | 'sozlesmeli_4b' | string
  hizmetYili: number
  izinTuru?: IzinTuru
}): number {
  const { kadroTuru, hizmetYili, izinTuru = 'yillik' } = params

  if (izinTuru === 'evlilik' || izinTuru === 'olum') return 7
  if (izinTuru === 'babalik') return 10
  if (izinTuru === 'mazeret') return 10

  if (izinTuru !== 'yillik') return 0

  if (kadroTuru === 'isci_4857') {
    if (hizmetYili < 1) return 0
    if (hizmetYili <= 5) return 14
    if (hizmetYili < 15) return 20
    return 26
  }

  // Varsayılan: 657 Memur & 4/B Sözleşmeli (Madde 102)
  if (hizmetYili < 1) return 0
  if (hizmetYili <= 10) return 20
  return 30
}

/**
 * İki tarih arasındaki net izin gün sayısını hesaplar.
 * haftaSonuHaric: true ise Cumartesi ve Pazar günleri hesaba katılmaz.
 */
export function calculateNetIzinGunu(
  baslangicIso: string,
  bitisIso: string,
  haftaSonuHaric: boolean = false
): number {
  const start = new Date(baslangicIso)
  const end = new Date(bitisIso)
  if (start > end) return 0

  let days = 0
  const cur = new Date(start)

  while (cur <= end) {
    const dayOfWeek = cur.getDay() // 0 = Pazar, 6 = Cumartesi
    if (!haftaSonuHaric || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      days++
    }
    cur.setDate(cur.getDate() + 1)
  }

  return days
}

/**
 * Geriye dönük uyumluluk için alias
 */
export function calculateIzinGunu(baslangicIso: string, bitisIso: string): number {
  return calculateNetIzinGunu(baslangicIso, bitisIso, false)
}

/**
 * İzin talebini fiş tipi kuralı (mevzuat/sendika), bakiye ve çakışan tarihlere göre doğrular.
 */
export function validateIzinTalebiKurallari(params: {
  talep: Omit<IzinTalebi, 'id' | 'durum' | 'onayAdimlari' | 'olusturulduguTarih' | 'guncellendigiTarih'>
  bakiye?: IzinBakiyesi
  mevcutTalepler: IzinTalebi[]
  kural?: IzinTipiKurali
  personel?: PersonelRecord
}): { gecerli: boolean; hata?: string } {
  const { talep, bakiye, mevcutTalepler, kural, personel } = params

  if (new Date(talep.baslangicTarihi) > new Date(talep.bitisTarihi)) {
    return { gecerli: false, hata: 'Başlangıç tarihi bitiş tarihinden sonra olamaz.' }
  }

  // 1. Sendika / Özel Şart Kontrolü
  if (kural?.sendikaGerektirirMi || talep.izinTuru === 'sendika') {
    if (personel && !personel.sendikaUyesiMi) {
      return {
        gecerli: false,
        hata: 'Sendika izni yalnızca sendika üyesi veya sendika işyeri/şube temsilcisi personele tanımlanabilir.'
      }
    }
  }

  // 2. Yıllık İzin Bakiye Kontrolü (Yalnızca bakiyeden düşen fiş türleri için!)
  const bakiyedenDuser = kural ? kural.bakiyedenDuserMi : talep.izinTuru === 'yillik'
  if (bakiyedenDuser && bakiye) {
    if (talep.gunSayisi > bakiye.kalanGun) {
      return {
        gecerli: false,
        hata: `Talep edilen gün (${talep.gunSayisi}), kalan yıllık izin bakiyesinden (${bakiye.kalanGun}) fazladır.`
      }
    }
  }

  // 3. Özel Fiş Türü Yıllık Kota Kontrolü (Örn: Sendika için 30 gün, Mazeret için 10 gün)
  const kota = kural?.yillikKotaGun
  if (kota) {
    const talepYili = new Date(talep.baslangicTarihi).getFullYear()
    const ayniTurdekiKullanilmis = mevcutTalepler
      .filter((m) => {
        if (m.durum === 'reddedildi' || m.durum === 'iptal_edildi') return false
        if (m.izinTuru !== talep.izinTuru) return false
        return new Date(m.baslangicTarihi).getFullYear() === talepYili
      })
      .reduce((toplam, m) => toplam + m.gunSayisi, 0)

    if (ayniTurdekiKullanilmis + talep.gunSayisi > kota) {
      return {
        gecerli: false,
        hata: `Talep edilen gün (${talep.gunSayisi}), bu izin türünün yıllık azami kotasını (${kota} gün) aşmaktadır. Mevcut kullanılan: ${ayniTurdekiKullanilmis} gün.`
      }
    }
  }

  // 4. Çakışan İzin Kontrolü
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

/**
 * Sıralı Çok Aşamalı Onay Durum Makinesi
 * 
 * Her aşama bağımsız onaylanır (Örn: Adım 1: Birim Amiri -> Adım 2: İK Müdürü).
 * Herhangi bir adım reddedilirse talep reddedilir.
 * Tüm adımlar onaylandığında talep 'onaylandi' durumuna geçer.
 */
export function advanceIzinOnayAdimi(params: {
  talep: IzinTalebi
  onaylayanKullaniciId: string
  onaylayanAdi: string
  karar: 'onaylandi' | 'reddedildi' | 'iade_edildi'
  aciklama?: string
}): { talep: IzinTalebi; tamamlandiMi: boolean; nihaiDurum: IzinTalebiDurumu } {
  const { talep, onaylayanKullaniciId, onaylayanAdi, karar, aciklama } = params
  const now = new Date().toISOString()

  if (talep.durum !== 'onayda' && talep.durum !== 'taslak') {
    throw new Error(`Sadece 'onayda' veya 'taslak' durumundaki izin talepleri onaylanabilir. Mevcut durum: ${talep.durum}`)
  }

  // İlk 'bekliyor' durumundaki adımı bul
  const currentAdim = talep.onayAdimlari.find((a) => a.karar === 'bekliyor')
  if (!currentAdim) {
    throw new Error('Onay bekleyen aşama bulunamadı.')
  }

  if (karar === 'reddedildi') {
    currentAdim.karar = 'reddedildi'
    currentAdim.onaylayanKullaniciId = onaylayanKullaniciId
    currentAdim.onaylayanAdi = onaylayanAdi
    currentAdim.onayTarihi = now
    currentAdim.aciklama = aciklama

    talep.durum = 'reddedildi'
    talep.redGerekcesi = aciklama || 'Gerekçe belirtilmedi'
    talep.guncellendigiTarih = now
    return { talep, tamamlandiMi: true, nihaiDurum: 'reddedildi' }
  }

  if (karar === 'iade_edildi') {
    currentAdim.aciklama = aciklama
    talep.durum = 'iade_edildi'
    talep.redGerekcesi = aciklama || 'Eksik bilgi nedeniyle iade edildi'
    talep.guncellendigiTarih = now
    return { talep, tamamlandiMi: true, nihaiDurum: 'iade_edildi' }
  }

  // Karar: Onaylandı
  currentAdim.karar = 'onaylandi'
  currentAdim.onaylayanKullaniciId = onaylayanKullaniciId
  currentAdim.onaylayanAdi = onaylayanAdi
  currentAdim.onayTarihi = now
  currentAdim.aciklama = aciklama

  // Kalan onay adımı var mı kontrol et
  const kalanBekleyen = talep.onayAdimlari.find((a) => a.karar === 'bekliyor')
  if (kalanBekleyen) {
    // Hala bekleyen sonraki adım var, talep durumu onayda kalır
    talep.durum = 'onayda'
    talep.guncellendigiTarih = now
    return { talep, tamamlandiMi: false, nihaiDurum: 'onayda' }
  }

  // Tüm onay adımları başarıyla tamamlandı
  talep.durum = 'onaylandi'
  talep.guncellendigiTarih = now
  return { talep, tamamlandiMi: true, nihaiDurum: 'onaylandi' }
}

/**
 * Personelin fiili çalışma durumunu referans tarihe göre dinamik hesaplar.
 * İzin onaylanmış olsa bile referans tarih izin aralığında değilse personel 'izinli' DEĞİLDİR.
 */
export function getPersonelFiiliCalismaDurumu(params: {
  personel: PersonelRecord
  onayliIzinler: IzinTalebi[]
  aktifGorevlendirmeler: Gorevlendirme[]
  referansTarih?: string // 'YYYY-MM-DD'
}): CalismaDurumu {
  const { personel, onayliIzinler, aktifGorevlendirmeler, referansTarih = new Date().toISOString().slice(0, 10) } = params

  if (personel.calismaDurumu === 'ayrilmis' || personel.calismaDurumu === 'askiya_alindi') {
    return personel.calismaDurumu
  }

  const refTime = new Date(referansTarih).getTime()

  // 1. İzin kontrolü (Referans gün izin aralığında mı?)
  const aktifIzin = onayliIzinler.find((iz) => {
    if (iz.durum !== 'onaylandi') return false
    const start = new Date(iz.baslangicTarihi).getTime()
    const end = new Date(iz.bitisTarihi).getTime()
    return refTime >= start && refTime <= end
  })

  if (aktifIzin) {
    return 'izinli'
  }

  // 2. Görevlendirme kontrolü
  const aktifGorev = aktifGorevlendirmeler.find((g) => {
    if (g.durum !== 'aktif') return false
    const start = new Date(g.baslangicTarihi).getTime()
    const end = g.bitisTarihi ? new Date(g.bitisTarihi).getTime() : Infinity
    return refTime >= start && refTime <= end
  })

  if (aktifGorev) {
    return 'gorevlendirmede'
  }

  return 'aktif'
}

/**
 * KVKK & Kişisel Veri Minimizasyonu
 * Denetim kaydı (audit log) için hassas kişisel verileri arındırır veya maskeler.
 */
export function sanitizePersonelForAudit(personel: Partial<PersonelRecord>): Record<string, unknown> {
  const tc = personel.tcKimlikNo ? `${personel.tcKimlikNo.slice(0, 3)}*****${personel.tcKimlikNo.slice(-2)}` : undefined

  return {
    id: personel.id,
    sicilNo: personel.sicilNo,
    tcKimlikMaskeli: tc,
    ad: personel.ad,
    soyad: personel.soyad,
    unvan: personel.unvan,
    kadro: personel.kadro,
    birimId: personel.birimId,
    calismaDurumu: personel.calismaDurumu
    // Kan grubu, açık adres, tam T.C. kimlik no denetim kaydına yazılmaz
  }
}

