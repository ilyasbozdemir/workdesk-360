import { NavigateFn } from '@tanstack/react-router'
import { HeaderMenu } from './header.types'
import { APP_ROUTES } from '../../../constants/routeConstants'

export function getSistemTanimlariMenu(
  navigate: NavigateFn,
  procurementMode: 'dogrudan_temin' | 'ihale' | 'devlet_ihale_2886'
): HeaderMenu {
  if (procurementMode === 'dogrudan_temin') {
    return {
      name: 'Sistem Tanımları (DT)',
      items: [
        {
          label: '🛒 Kurum & Harcama Birimi Bilgileri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KURUM })
        },
        {
          label: '🛒 Doğrudan Temin Birimleri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.BIRIMLER })
        },
        {
          label: '🛒 Harcama Yetkilileri & Personel',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PERSONEL })
        },
        {
          label: '🛒 Piyasa Fiyat Araştırma Görevlileri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
        },
        {
          label: '🛒 Muayene & Kabul Komisyonları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
        },
        {
          label: '🛒 Görev & Yetki Tanımları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYON_GOREVLERI })
        },
        { divider: true },
        {
          label: '🛒 Doğrudan Temin İstekli Firmaları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.FIRMALAR })
        },
        {
          label: '📁 Yatırım ve Alım Projeleri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PROJELER })
        },
        {
          label: '🛒 Mal / Hizmet / Tüketim Listesi',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.MALZEMELER })
        },
        {
          label: '🛒 Taşınır Kodları & Ölçü Birimleri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.TASINIR_KOD })
        },
        {
          label: '🛒 Ambar & Depo Tanımları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.AMBAR })
        },
        {
          label: '📈 Yİ-ÜFE Endeksleri (TÜİK & hakedis.org)',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.MEVZUAT,
              search: { tab: 'yi-ufe' } as Record<string, string>
            })
        },
        { divider: true },
        {
          label: '📥 Harici Dosya Aktar & Eşle (JSON)',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.HARICI_DOSYA_AKTAR })
        }
      ]
    }
  }

  if (procurementMode === 'devlet_ihale_2886') {
    return {
      name: 'Sistem Tanımları (2886 Gelir)',
      items: [
        {
          label: '🏛️ İdare & Gelir/Kiralama Makamı Bilgileri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KURUM })
        },
        {
          label: '🏛️ İhale / Emlak & İstimlak Servisleri',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.BIRIMLER })
        },
        {
          label: '🏛️ Encümen Üyeleri & Takdir Komisyonu',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
        },
        {
          label: '🏛️ İhale İdare Yetkilileri & Raportörler',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PERSONEL })
        },
        {
          label: '🏛️ Encümen & Komisyon Görev Tanımları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYON_GOREVLERI })
        },
        { divider: true },
        {
          label: '🏢 İstekli Firmalar & Şahıslar (Kiracı / Alıcı)',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.FIRMALAR })
        },
        {
          label: '🏢 Mal, Varlık & Taşınmaz Kataloğu',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.MALZEMELER })
        },
        {
          label: '🏢 Taşınmaz / Taşınır Kodları',
          onClick: (): Promise<void> => navigate({ to: APP_ROUTES.TASINIR_KOD })
        },
        {
          label: '📈 TÜİK Yİ-ÜFE Kira Artış Endeksleri',
          onClick: (): Promise<void> =>
            navigate({
              to: APP_ROUTES.MEVZUAT,
              search: { tab: 'yi-ufe' } as Record<string, string>
            })
        }
      ]
    }
  }

  return {
    name: 'Sistem Tanımları (4734 İhale)',
    items: [
      {
        label: '🏛️ İdare & İhale Makamı Bilgileri',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KURUM })
      },
      {
        label: '🏛️ İhale / İhale Kayıt Birimleri (EKAP)',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.BIRIMLER })
      },
      {
        label: '🏛️ İhale Yetkilileri & Raportörler',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.PERSONEL })
      },
      {
        label: '🏛️ İhale Komisyonları (KİK Md. 6 - Asıl/Yedek)',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
      },
      {
        label: '🏛️ Muayene, Denetim ve Kabul Heyetleri',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYONLAR })
      },
      {
        label: '🏛️ Komisyon Görev ve Yetki Matrisi',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.KOMISYON_GOREVLERI })
      },
      { divider: true },
      {
        label: '🏛️ İhale İsteklileri & Müteahhit Firmalar',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.FIRMALAR })
      },
      {
        label: '🏛️ ÇŞB Birim Fiyat Pozları (Yapım & Onarım)',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.POZLAR })
      },
      {
        label: '🏛️ OKAS (Kamu Alımları Sözlüğü) Kodları',
        onClick: (): Promise<void> => navigate({ to: APP_ROUTES.OKAS_KOD })
      },
      {
        label: '🏛️ İhale Eşik Değerleri ve Limit Parametreleri',
        onClick: (): Promise<void> =>
          navigate({
            to: APP_ROUTES.MEVZUAT,
            search: { tab: 'limitler' } as Record<string, string>
          })
      },
      {
        label: '📈 Yİ-ÜFE Fiyat Farkı & Değerleme Endeksleri',
        onClick: (): Promise<void> =>
          navigate({ to: APP_ROUTES.MEVZUAT, search: { tab: 'yi-ufe' } as Record<string, string> })
      }
    ]
  }
}
