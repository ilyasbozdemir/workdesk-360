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
      onClick: (): Promise<void> => navigate({ to: APP_ROUTES.DOSYALAR }),
      items: [
        {
          label: 'Tüm Doğrudan Temin Dosyaları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.DOSYALAR })
        },
        {
          label: '📋 İhtiyaç Raporları Havuzu (Genel)',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.IHTIYAC_RAPORLARI })
        },
        {
          label: '📁 Proje Yönetimi & Yatırımlar',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PROJELER })
        },
        {
          label: 'Yeni Doğrudan Temin Dosyası',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.YENI_DOSYA })
        },
        {
          label: 'Hızlı Dosya Ekle / Güncelle',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HIZLI_DOSYA_EKLE })
        },
        {
          label: '📥 Harici Dosya Aktar (JSON)',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HARICI_DOSYA_AKTAR })
        },
        {
          label: 'Süreç Akış Haritası (Beta)',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.SUREC_AKISI })
        },
        {
          label: '📊 Harcama & Sayıştay Raporları',
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
                label: 'Süreç Takip & Durum Paneli',
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
                label: '🧭 Süreç Akış Haritası (Beta - Tablar)',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.SUREC_AKISI })
              },
              {
                label: 'Belge Çıktı Merkezi',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.CIKTI_MERKEZI_DASHBOARD })
              },
              {
                label: 'Hızlı Dosya Ekle / Güncelle',
                onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HIZLI_DOSYA_EKLE })
              },
              {
                label: 'Şablon & Taslak Yöneticisi',
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
