import React from 'react'
import { Link } from '@tanstack/react-router'
import { Hammer, Package, Truck, FileCheck, Layers, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

interface HarcamaMerkeziModulesProps {
  activeLimit: number
  formatCurrency: (val: number) => string
}

export const HarcamaMerkeziModules: React.FC<HarcamaMerkeziModulesProps> = ({
  activeLimit,
  formatCurrency
}) => {
  const MODULES = [
    {
      id: 'yapim',
      title: 'Yapım İşleri & Hakediş Yönetimi',
      subTitle: 'Anahtar Teslimi Götürü Bedel & Birim Fiyatlı Hakedişler',
      icon: Hammer,
      badge: 'İLBANK & ÇŞB Uyumlu',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30',
      headerBg: 'bg-amber-500',
      description:
        'Kaba inşaat, altyapı, kanalizasyon, yol, içme suyu, parke ve bina yapım projelerinde pursantaj bazlı fiziki ilerleme ve hak ediş evrakları.',
      features: [
        'Pursantaj (Ağırlık Yüzdeleri) ve İlerleme Cetveli',
        'Kümülatif Hakediş Hesabı & Önceki Dönem Mahsubu',
        'Fiyat Farkı Hesabı (TÜİK Endeksleri Katsayılı)',
        'İhzarat Malzeme Tutanağı & Şantiye Ataşmanı',
        'Dizi Pusulası, İcmal & Sayıştay Denetim Kapakları',
        'Kesintiler (Stopaj %5, Damga Vergisi %0.948, Ceza)'
      ],
      actionLabel: 'Hakediş Modülünü Aç',
      actionPath: '/hakedis',
      isBeta: true
    },
    {
      id: 'mal',
      title: 'Mal Alımları & Taşınır Kayıt',
      subTitle: 'Teknik Şartname, Muayene Kabul & Ambar Girişi',
      icon: Package,
      badge: 'TKYS & TİF Entegre',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30',
      headerBg: 'bg-blue-600',
      description:
        'Demirbaş, araç-gereç, yedek parça, kırtasiye ve sarf malzeme alımlarında piyasa araştırmasından taşınır kayıt fişine tam kabul zinciri.',
      features: [
        'Piyasa Fiyat Araştırma Tutanağı & Teklifler',
        'Muayene ve Kabul Komisyonu Tutanağı',
        'Taşınır İşlem Fişi (TİF) & Ambar Stok Girişi',
        'Sevk İrsaliyesi, Fatura & Garanti Belgeleri',
        'Partili / Taksitli Teslimat Kabul Çizelgesi',
        'MİF (Muhasebe İşlem Fişi) & Ödeme Emri Belgesi'
      ],
      actionLabel: 'Mal Alımı Süreci Başlat',
      actionPath: '/dosyalar/yeni',
      isBeta: false
    },
    {
      id: 'hizmet',
      title: 'Hizmet Alımı & Puantaj Takibi',
      subTitle: 'Aylık Hak Ediş İcmali, Personel & Araç Takibi',
      icon: Truck,
      badge: 'SGK & Puantaj Kontrollü',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30',
      headerBg: 'bg-emerald-600',
      description:
        'Temizlik, güvenlik, iş makinesi/araç kiralama, bakım-onarım ve danışmanlık hizmetlerinin aylık hakediş ve SGK doğrulama süreçleri.',
      features: [
        'Aylık Personel Puantajı & Vardiya Takip Cetveli',
        'Araç & İş Makinesi Çalışma Saati Çizelgesi',
        'Aylık SGK Prim Hizmet Listesi & Borcu Yoktur Doğrulama',
        'Maaş Banka Dekontu & İşçi Hakları Denetimi',
        'Aylık Hizmet Kabul Tutanağı & Kesinti Raporu',
        'Hizmet Hakediş İcmali & Vezne Ödeme Emri'
      ],
      actionLabel: 'Hizmet Hakedişi Başlat',
      actionPath: '/hakedis',
      isBeta: true
    },
    {
      id: 'dogrudan_temin',
      title: 'Doğrudan Temin (4734 KİK 22/a-d)',
      subTitle: 'Hızlı Alım, Lüzum Müzekkeresi & Onay Belgesi',
      icon: FileCheck,
      badge: `Limit: ${formatCurrency(activeLimit)}`,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/30',
      headerBg: 'bg-indigo-600',
      description:
        'İhale yapılmaksızın harcama yetkilisince görevlendirilen kişi/komisyon tarafından piyasadan en uygun fiyatla yapılan hızlı kamu alımları (yalnızca mal alımı).',
      features: [
        'Lüzum Müzekkeresi & İhtiyaç Talep Formu',
        'Yaklaşık Maliyet Cetveli (Birim Fiyat Teklifli)',
        'Fiyat Araştırma & Teklif İsteme Mektupları',
        'Doğrudan Temin Onay Belgesi (Harcama Yetkilisi)',
        'Sözleşme & Taahhütname Taslağı (Opsiyonel)',
        'Klasör Sırtlığı, Dizi Pusulası & Arşivleme'
      ],
      actionLabel: 'Doğrudan Temin Başlat',
      actionPath: '/dosyalar/yeni',
      isBeta: false
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Kamu Harcama ve Alım Süreçleri Modül Kataloğu
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            İhtiyacınıza uygun iş türünü seçin, sistem ilgili şartnameye ve İller Bankası
            standartlarına göre evrak setini otomatik oluştursun.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((mod) => {
          const Icon = mod.icon
          return (
            <div
              key={mod.id}
              className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:scale-[1.01] bg-linear-to-br ${mod.gradient} bg-white dark:bg-slate-900`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${mod.headerBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border inline-block mb-1 ${mod.badgeColor}`}
                      >
                        {mod.badge}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {mod.subTitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed font-normal">
                  {mod.description}
                </p>

                {/* Feature Bullets */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    📋 Üretilen Resmi Evraklar &amp; Hesaplamalar:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {mod.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Bottom CTA Button */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Mevzuat: <strong>4734 / 4735 KİK</strong>
                  </span>
                  {mod.isBeta && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      BETA
                    </span>
                  )}
                </div>
                <Link to={mod.actionPath}>
                  <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer">
                    {mod.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
