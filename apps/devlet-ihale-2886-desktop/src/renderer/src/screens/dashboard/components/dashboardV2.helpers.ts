import { Coins, FileCheck, FileText, Scale, ShieldCheck } from 'lucide-react'
import { PillarItem } from './TeminPillarsMatrix'

// Kurum Türü Başlığı
export const getInstitutionTypeLabel = (type: string): string => {
  switch (type) {
    case 'belediye':
      return 'Belediye / Mahalli İdare'
    case 'genel_butce':
      return 'Bakanlık / Genel Bütçe'
    case 'ozel_butce':
      return 'Üniversite / Özel Bütçe'
    case 'duzenleyici':
      return 'Düzenleyici / Denetleyici Kurum'
    case 'diger':
      return 'Diğer Kurum'
    default:
      return 'Kurum Tipi Belirtilmedi'
  }
}

// Para Biçimlendirme
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(value || 0)
}

// Aşama Renk ve İsim Tanımlayıcı
export const getAsamaDetails = (
  asamaSira: number,
  asamalar: any[] = []
): { name: string; color: string } => {
  const asama = asamalar.find((a: any) => a.asama_sira === asamaSira)
  if (asama) {
    return {
      name: asama.asama_adi,
      color:
        'border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60'
    }
  }

  switch (asamaSira) {
    case 1:
      return {
        name: '1. İhtiyaç & Lüzum',
        color:
          'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60'
      }
    case 2:
      return {
        name: '2. Piyasa Fiyat Araştırması',
        color:
          'border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
      }
    case 3:
      return {
        name: '3. Teklif Değerlendirme',
        color:
          'border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60'
      }
    case 4:
      return {
        name: '4. Karar & Onay Belgesi',
        color:
          'border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60'
      }
    case 5:
      return {
        name: '5. Muayene Kabul & Ödeme',
        color:
          'border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60'
      }
    default:
      return {
        name: 'Süreç İlerliyor',
        color:
          'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-900'
      }
  }
}

export function getDtFileText(type?: string | null): string {
  if (!type) return 'Mal Alımı'
  const t = type.toLowerCase().trim()
  if (t === 'mal') return 'Mal Alımı'
  if (t === 'hizmet') return 'Hizmet Alımı'
  if (t === 'yapim_isi' || t === 'yapim' || t.includes('yapım')) {
    return 'Yapım İşi / Onarım'
  }
  if (t === 'danismanlik' || t.includes('danışman')) return 'Danışmanlık'
  if (t === 'hakedis' || t.includes('hakediş')) return 'Hakediş'
  if (t === 'ihale') return 'İhale'
  return type
}

export function getDtFileColor(type?: string | null): string {
  const t = (type || '').toLowerCase().trim()
  if (t === 'mal') {
    return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-800/60'
  }
  if (t === 'hizmet') {
    return 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-200/80 dark:border-violet-800/60'
  }
  if (t === 'yapim_isi' || t === 'yapim' || t.includes('yapım')) {
    return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/60'
  }
  if (t === 'danismanlik' || t.includes('danışman')) {
    return 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border-purple-200/80 dark:border-purple-800/60'
  }
  if (t === 'hakedis' || t.includes('hakediş')) {
    return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60'
  }
  return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
}

export function buildTeminPillars(
  stats: any,
  kikLimit: number,
  limitType: string,
  formatCurr: (v: number) => string
): PillarItem[] {
  return [
    {
      key: 'T' as const,
      letter: 'T',
      title: 'Teklif & Piyasa Fiyat Araştırması',
      subtitle: 'Piyasa Araştırma Tutanağı & Teklif Havuzu',
      icon: Coins,
      badge: `${formatCurr(stats.toplamYaklasikMaliyet)} Toplam Alım`,
      description:
        'Tedarikçi teklif mektuplarını toplar, yaklaşık maliyet cetvellerini otomatik hesaplar ve piyasa fiyat araştırma tutanaklarını kanuna tam uyumlu üretir.',
      statsText: `${stats.kayitliFirmaSayisi} İstekli Firma & Tedarikçi Havuzu`
    },
    {
      key: 'E' as const,
      letter: 'E',
      title: 'Evrak, Şartname & E-İmza',
      subtitle: 'Resmi Yazışma Standartları & EBYS Uyumluluğu',
      icon: FileCheck,
      badge: 'Baskıya & EBYS Hazır',
      description:
        'React TSX şablon motoruyla Onay Belgesi, İhtiyaç Belgesi, Piyasa Araştırma Tutanağı ve Ödeme Emri evraklarını tek tıkla mühürlü/imzalı PDF olarak üretir.',
      statsText: '25+ Resmi Kamu Evrak ve Tutanak Şablonu'
    },
    {
      key: 'M' as const,
      letter: 'M',
      title: 'Maliyet, Bütçe & Harcama Yönetimi',
      subtitle: '4734 / 22-d ve 5018 Sayılı Mali Yönetim',
      icon: Scale,
      badge: '%100 Mevzuat Uyum Skoru',
      description:
        'KİK doğrudan temin eşik limitlerini, harcama birimi bütçe tertiplerini ve analitik bütçe kodlarını gerçek zamanlı kontrol altında tutar.',
      statsText: `Yıllık KİK Eşik Sınırı: ${formatCurr(kikLimit)} (${
        limitType === 'buyuksehir' ? 'Büyükşehir' : 'Normal'
      })`
    },
    {
      key: 'I' as const,
      letter: 'İ',
      title: 'İhale, Doğrudan Temin & Sözleşme',
      subtitle: 'Uçtan Uca 4 Aşamalı Dijital Dosya Yaşam Döngüsü',
      icon: FileText,
      badge: `${stats.ihaleDosyaSayisi} Kayıtlı Dosya`,
      description:
        'İhtiyaç lüzumundan piyasa araştırmasına, teklif mektubu dağıtımından onay belgesine kadar tüm doğrudan temin adımlarını kanuna uygun yürütür.',
      statsText: `${stats.aktifDosyaSayisi || stats.ihaleDosyaSayisi} Aktif Süreç Devam Ediyor`
    },
    {
      key: 'N' as const,
      letter: 'N',
      title: 'Netice, Hakediş & Muayene Kabul',
      subtitle: 'Muayene Komisyonu, Hakediş & Ödeme Emri',
      icon: ShieldCheck,
      badge: 'Sayıştay Güvenceli',
      description:
        'Mal/hizmet ve yapım işleri için ara ve kesin hakediş raporları hazırlar, KDV tevkifatı ve damga vergisi kesintilerini hesaplar, muhasebe ödeme emrine bağlar.',
      statsText: `${stats.kayitliPersonelSayisi} Yetkili & Komisyon Üyesi Kayıtlı`
    }
  ]
}
