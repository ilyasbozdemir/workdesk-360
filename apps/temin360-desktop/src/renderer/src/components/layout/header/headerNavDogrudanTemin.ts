import { NavigateFn } from '@tanstack/react-router'
import { HeaderMenu } from './header.types'
import { APP_ROUTES } from '../../../constants/routeConstants'

export function getDogrudanTeminMenus(
  navigate: NavigateFn,
  activeDosyaId: number | null
): HeaderMenu[] {
  return [
    {
      name: 'Doğrudan Temin (KİK 22)',
      onClick: (): Promise<void> => navigate({ to: APP_ROUTES.TAKIP }),
      items: [
        {
          label: '📋 Dosya Detayları & Süreç Takibi (Kanban & Liste)',
          route: APP_ROUTES.TAKIP,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.TAKIP })
        },
        {
          label: '📁 Tüm Doğrudan Temin Dosyaları',
          route: APP_ROUTES.DOSYALAR,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.DOSYALAR })
        },
        {
          label: '⚖️ Piyasa Fiyat Araştırmaları Masası',
          route: APP_ROUTES.PIYASA_FIYAT_ARASTIRMALARI_MASASI,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PIYASA_FIYAT_ARASTIRMALARI_MASASI })
        },
        {
          label: '👥 Komisyon Yönetimi & Personel Kadroları',
          route: APP_ROUTES.KOMISYONLAR,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
        },
        {
          label: '📋 İhtiyaç Raporları Havuzu (Genel)',
          route: APP_ROUTES.IHTIYAC_RAPORLARI,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.IHTIYAC_RAPORLARI })
        },
        {
          label: '📁 Proje Yönetimi & Yatırımlar',
          route: APP_ROUTES.PROJELER,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PROJELER })
        },
        {
          label: '➕ Yeni Doğrudan Temin Dosyası',
          route: APP_ROUTES.YENI_DOSYA,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.YENI_DOSYA })
        },
        {
          label: '⚡ Toplu Hızlı Dosya Ekle / Güncelle',
          route: APP_ROUTES.HIZLI_DOSYA_EKLE,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HIZLI_DOSYA_EKLE })
        },
        {
          label: '📥 Harici Dosya Aktar (JSON)',
          route: APP_ROUTES.HARICI_DOSYA_AKTAR,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HARICI_DOSYA_AKTAR })
        },
        {
          label: '📊 Harcama & Sayıştay Raporları',
          route: APP_ROUTES.RAPORLAR,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.RAPORLAR })
        }
      ]
    },
    ...(activeDosyaId
      ? [
          {
            name: 'Süreç Yönetimi',
            items: [
              {
                label: '📋 Dosya Detayları & Durum Paneli',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.TAKIP })
              },
              {
                label: '📋 Bu Dosyaya Bağlı İhtiyaç Raporları',
                onClick: (): Promise<void> =>
                  navigate({
                    to: APP_ROUTES.IHTIYAC_RAPORLARI,
                    search: { dosyaId: String(activeDosyaId) } as Record<string, string>
                  })
              },
              {
                label: '📄 Belge Çıktı Merkezi',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.CIKTI_MERKEZI_DASHBOARD })
              },
              {
                label: '👥 Bu Dosyanın Komisyon Kadrosu',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
              },
              {
                label: '📑 Şablon & Taslak Yöneticisi',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.TASLAK_YONETIM })
              },
              {
                label: '📝 Dosya Notları & Yapılacaklar (To-Do)',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.NOTLAR })
              }
            ]
          },
          {
            name: 'Adım Adım Süreç',
            items: [
              {
                label: '0. İhtiyaç Raporu & Lüzum Müzekkeresi',
                onClick: (): Promise<void> =>
                  navigate({
                    to: APP_ROUTES.IHTIYAC_RAPORLARI,
                    search: { dosyaId: String(activeDosyaId) } as Record<string, string>
                  })
              },
              {
                label: '1. İhtiyaç Listesi & Maliyet & Onay',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HAZIRLIK_VE_IHTIYAC })
              },
              {
                label: '2. Piyasa Fiyat Araştırması',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI })
              },
              {
                label: '3. Sipariş & Sözleşme',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.SIPARIS_VE_SOZLESME })
              },
              {
                label: '4. Muayene & Kabul & Ödeme İşlemleri',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KABUL_VE_ODEME })
              },
              {
                label: '5. Klasör & Kapaklar',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KLASOR_VE_KAPAKLAR })
              }
            ]
          }
        ]
      : []),
    {
      name: 'Mevzuat & Limitler',
      items: [
        {
          label: '🧮 İhale & Kamu Maliyesi Hesaplama Araçları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HESAPLAMA_ARACLARI })
        },
        {
          label: '4734 Sayılı Kamu İhale Kanunu (KİK Md. 22)',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.MEVZUAT })
        },
        {
          label: 'Doğrudan Temin Parasal Limitleri (22/a, 22/d)',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.MEVZUAT,
              search: { tab: 'limitler' } as Record<string, string>
            })
        },
        {
          label: 'TÜİK Yİ-ÜFE Endeksleri & Değerleme',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.MEVZUAT,
              search: { tab: 'yi-ufe' } as Record<string, string>
            })
        }
      ]
    }
  ]
}

export function getFinanceMenus(navigate: NavigateFn): HeaderMenu[] {
  return [
    {
      name: 'Mali Hizmetler (5018 & BKMYBS)',
      onClick: (): Promise<void> => navigate({ to: APP_ROUTES.BKMYBS_MALI_YONETIM }),
      items: [
        {
          label: '🏛️ 5018 Mali Yönetim Masası (Beta)',
          route: APP_ROUTES.BKMYBS_MALI_YONETIM,
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.BKMYBS_MALI_YONETIM })
        },
        {
          label: '📋 Dosyalar ve Faturalar (Fatura & Kabul Kayıtları)',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'fatura-arama' } as Record<string, string>
            })
        },
        {
          label: '💰 Bütçe & Ödenek Kontrol Masası',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'butce-odenek' } as Record<string, string>
            })
        },
        {
          label: '📊 %10 KİK Doğrudan Temin Limit Kontrolü',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'limit-kota' } as Record<string, string>
            })
        },
        {
          label: '🧾 Vergi, Damga Vergisi & Tevkifat Hesaplamaları',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'vergi-kesinti' } as Record<string, string>
            })
        },
        {
          label: '📑 Muhasebe İşlem Fişi (MİF & ÖEB) Düzenleme',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'mif-oeb' } as Record<string, string>
            })
        },
        {
          label: '🏦 Hakediş Masası & Ödeme Takibi',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'hakedis' } as Record<string, string>
            })
        }
      ]
    },
    {
      name: 'Mali Mevzuat & Bütçe',
      items: [
        {
          label: '5018 Sayılı Kamu Malî Yönetimi ve Kontrol Kanunu',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'mevzuat-parametreler' } as Record<string, string>
            })
        },
        {
          label: 'Merkezi Yönetim Muhasebe Yönetmeliği',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.BKMYBS_MALI_YONETIM,
              search: { tab: 'mevzuat-parametreler' } as Record<string, string>
            })
        },
        {
          label: '🧮 İhale & Kamu Maliyesi Hesaplama Araçları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HESAPLAMA_ARACLARI })
        }
      ]
    }
  ]
}
