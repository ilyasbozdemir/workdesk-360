import { NavigateFn } from '@tanstack/react-router'
import { HeaderMenu } from './header.types'
import { APP_ROUTES } from '../../../constants/routeConstants'

export function getIhaleMenus(navigate: NavigateFn, activeDosyaId: number | null): HeaderMenu[] {
  return [
    {
      name: 'İhale Süreçleri (KİK 19/21)',
      onClick: () => navigate({ to: APP_ROUTES.HARCAMA_MERKEZI }),
      items: [
        {
          label: 'Açık İhale Süreçleri (KİK Md. 19)',
          onClick: () => navigate({ to: APP_ROUTES.HARCAMA_MERKEZI })
        },
        {
          label: 'Pazarlık Usulü İhale (KİK Md. 21)',
          onClick: () => navigate({ to: APP_ROUTES.HARCAMA_MERKEZI })
        },
        {
          label: '📋 İhtiyaç Raporları Havuzu (Genel)',
          onClick: () => navigate({ to: APP_ROUTES.IHTIYAC_RAPORLARI })
        },
        {
          label: 'İhale Hakediş & Harcama Raporları',
          onClick: () => navigate({ to: APP_ROUTES.HAKEDIS })
        },
        { divider: true },
        {
          label: 'Şablon & Kategori Yönetimi',
          onClick: () => navigate({ to: APP_ROUTES.DEGISKENLER })
        },
        {
          label: 'Taslak & Belge Havuzu',
          onClick: () => navigate({ to: APP_ROUTES.TASLAK_YONETIM })
        }
      ]
    },
    ...(activeDosyaId
      ? [
          {
            name: 'İhale Süreç Adımları',
            items: [
              {
                label: '0. İhtiyaç Raporu & Lüzum Müzekkeresi',
                onClick: () =>
                  navigate({
                    to: APP_ROUTES.IHTIYAC_RAPORLARI,
                    search: { dosyaId: String(activeDosyaId) } as Record<string, string>
                  })
              },
              {
                label: '1. İhale Onay Belgesi & Şartnameler',
                onClick: () => navigate({ to: APP_ROUTES.HAZIRLIK_VE_IHTIYAC })
              },
              {
                label: '2. İhale İlanı & Davet Mektupları',
                onClick: () => navigate({ to: APP_ROUTES.PIYASA_FIYAT_ARASTIRMASI })
              },
              {
                label: '3. Teklif Değerlendirme & Komisyon Kararı',
                onClick: () => navigate({ to: APP_ROUTES.SIPARIS_VE_SOZLESME })
              },
              {
                label: '4. Sözleşme & Teminat İşlemleri',
                onClick: () => navigate({ to: APP_ROUTES.KABUL_VE_ODEME })
              },
              {
                label: '5. İhale Klasörü & Arşivleme',
                onClick: () => navigate({ to: APP_ROUTES.KLASOR_VE_KAPAKLAR })
              }
            ]
          },
          {
            name: 'İhale İşlemleri',
            items: [
              {
                label: 'İhale Dosya Durumu & Takip',
                onClick: () => navigate({ to: APP_ROUTES.TAKIP })
              },
              {
                label: '📋 Bu Dosyaya Bağlı İhtiyaç Raporları',
                onClick: () =>
                  navigate({
                    to: APP_ROUTES.IHTIYAC_RAPORLARI,
                    search: { dosyaId: String(activeDosyaId) } as Record<string, string>
                  })
              },
              {
                label: 'İhale Belge Çıktı Merkezi',
                onClick: () => navigate({ to: APP_ROUTES.CIKTI_MERKEZI_DASHBOARD })
              },
              {
                label: 'Hakediş & Ödeme Takibi',
                onClick: () => navigate({ to: APP_ROUTES.HAKEDIS })
              }
            ]
          }
        ]
      : []),
    {
      name: 'İhale Mevzuatı',
      items: [
        {
          label: '🧮 İhale & Kamu Maliyesi Hesaplama Araçları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HESAPLAMA_ARACLARI })
        },
        {
          label: 'İhale Eşik Değerleri & Limitler',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.MEVZUAT })
        },
        {
          label: 'KİK Standart Şablon & Formlar',
          onClick: () => navigate({ to: APP_ROUTES.TASLAK_YONETIM })
        },
        { label: 'Mevzuat & Genelgeler', onClick: () => navigate({ to: APP_ROUTES.MEVZUAT }) }
      ]
    }
  ]
}
