import type { ModulPaketi } from '../modulMagazasi.types'
import { IS_DT_EDITION, isModuleAllowedInEdition } from '../../../../../shared/edition'

const TUM_MODUL_PAKETLERI: ModulPaketi[] = [
  // =========================================================================
  // 1. 4734 DOĞRUDAN TEMİN (ÇEKİRDEK SÜREÇ & STANDART ŞABLON KATALOĞU)
  // =========================================================================
  {
    id: 'kik-dogrudan-temin-22d',
    kod: 'KİK-22-D',
    paketTipi: 'modul',
    baslik: '4734 Doğrudan Temin Süreç & Standart Formlar',
    kisaAciklama:
      '4734 Sayılı Kanun Madde 22/d uyarınca parasal limitler dahilinde mal, hizmet ve yapım alımları uçtan uca dosya ve resmi evrak yönetimi.',
    detayliAciklama:
      'Belediyeler, il özel idareleri, üniversiteler ve kamu kurumları için 4734 sayılı Kamu İhale Kanunu Madde 22/d uyarınca ihtiyaç tespitinden muayene kabul ve ödeme aşamasına kadar tüm resmi standart formları (KİK ve MYHBY) içeren ana çalışma modülü.',
    mevzuat: '4734 Sayılı KİK m.22/d & MYHBY',
    kategori: 'alim_ihale',
    ikon: 'FileCheck',
    renk: 'blue',
    versiyon: 'v2.4.0',
    surumAsamasi: 'Kararlı',
    etiketler: [
      'Doğrudan Temin',
      '22/d',
      'Piyasa Araştırması',
      'KİK Standart Formlar',
      'Muayene Kabul'
    ],
    routePath: '/dosyalar',
    removable: false,
    silinebilir: false,
    araclar: [
      'KİK Parasal Limit Denetleyicisi',
      'KDV Tevkifat Hesaplama',
      'EKAP Yasaklılık Kontrol'
    ],
    asamalar: [
      {
        sira: 1,
        baslik: 'İhtiyaç Tespiti & Talep',
        aciklama: 'Birim talep fişi ve ihtiyaç gerekçesinin oluşturulması.'
      },
      {
        sira: 2,
        baslik: 'Harcama Yetkilisi Onayı',
        aciklama: '22/d Onay Belgesi ve bütçe ödeneği bloke işlemi.'
      },
      {
        sira: 3,
        baslik: 'Piyasa Fiyat Araştırması',
        aciklama: 'Firmalara teklif isteme mektubu ve tekliflerin toplanması.'
      },
      {
        sira: 4,
        baslik: 'Piyasa Araştırma Tutanağı',
        aciklama: 'En avantajlı teklifin tespiti ve komisyon/görevli imzaları.'
      },
      {
        sira: 5,
        baslik: 'Sipariş veya Sözleşme',
        aciklama: 'Yükleniciye sipariş mektubu veya doğrudan temin sözleşmesi.'
      },
      {
        sira: 6,
        baslik: 'Muayene & Kabul',
        aciklama: 'Malın/hizmetin teslim alınarak kabul tutanağının düzenlenmesi.'
      },
      {
        sira: 7,
        baslik: 'Ödeme Emri & Muhasebe',
        aciklama: 'Fatura tahakkuk müzekkeresi ve harcama evraklarının teslimi.'
      }
    ],
    belgeler: [
      {
        ad: 'Standart Form: İhtiyaç Belgesi ve Harcama Talep Müzekkeresi (4734 Sayılı KİK m.22 / )',
        kod: 'DT-01 / MYHBY-4/e',
        aciklama: 'Harcama birimi tarafından düzenlenen gerekçeli talep ve alım başlatma belgesi.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK024.0/M: Doğrudan Temin Onay Belgesi (Harcama Talimatı)',
        kod: 'DT-02 / KİK024.0/M',
        aciklama: 'Harcama yetkilisinden alınan bütçe ödeneği bloke ve resmi harcama talimatı.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK027.0/M: Birim Fiyat Teklif Mektubu ve Fiyat İsteme Formu',
        kod: 'DT-03 / KİK027.0/M',
        aciklama: 'İsteklilerden kaşeli/imzalı teklif almak için gönderilen resmi mektup.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form (MYHBY Örnek No: 2): Piyasa Fiyat Araştırması Tutanağı',
        kod: 'DT-04 / MYHBY Örnek:2',
        aciklama: 'Fiyatların kıyaslandığı, en avantajlı teklifin belirlendiği tutanak.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK054.0/M: Muayene ve Kabul Komisyon Kararı ve Tutanağı',
        kod: 'DT-05 / KİK054.0/M',
        aciklama:
          'Mal veya hizmet alımlarında şartnameye uygunluğu tescil eden muayene kabul tutanağı.',
        zorunluMu: true
      },
      {
        ad: 'Standart Form-KİK048.0/Y: Yapım İşleri Geçici Kabul Teklif Belgesi',
        kod: 'KİK048.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde geçici kabul heyeti teşkili teklif belgesi.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK049.0/Y: Yapım İşleri Geçici Kabul Tutanağı',
        kod: 'KİK049.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde geçici kabul komisyonu inceleme tutanağı.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK050.0/Y: Yapım İşleri Kesin Kabul Teklif Belgesi',
        kod: 'KİK050.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde teminat süresi sonu kesin kabul teklif belgesi.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK051.0/Y: Yapım İşleri Kesin Kabul Tutanağı',
        kod: 'KİK051.0/Y',
        aciklama: 'Doğrudan temin yapım işlerinde kesin kabul komisyonu tutanağı.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form-KİK: Doğrudan Temin Tip Sözleşmesi',
        kod: 'DT-06 / KİK-SÖZ',
        aciklama: 'Gerektiğinde firma ile idare arasında imzalanan taahhüt sözleşmesi.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form (KİK Tebliği m.22): Sipariş ve Tebliğ-Tebellüğ Mektubu',
        kod: 'DT-07 / KİK Tebliğ m.22',
        aciklama: 'Alımın kazanan istekliye bildirildiği resmi sipariş yazısı.',
        zorunluMu: false
      },
      {
        ad: 'Standart Form (MYHBY Örnek No: 3): Harcama Pusulası ve Klasör Dizi Fihristi',
        kod: 'DT-08 / MYHBY Örnek:3',
        aciklama: 'Fatura kesemeyen esnaftan yapılan alımların belgesi ve klasör dizi pusulası.',
        zorunluMu: false
      }
    ]
  },


]

export const RESMI_MODUL_PAKETLERI: ModulPaketi[] = IS_DT_EDITION
  ? TUM_MODUL_PAKETLERI.filter((m) => isModuleAllowedInEdition(m.id))
  : TUM_MODUL_PAKETLERI

