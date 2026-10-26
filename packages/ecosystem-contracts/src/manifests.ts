import { AppManifest } from './schema.js'

export const TEMIN_360_MANIFEST: AppManifest = {
  id: 'temin-360',
  name: 'TEMİN 360',
  version: '1.0.0-rc.6',
  summary: 'Kamu Alımları, İhale ve Hakediş Yönetim Sistemi',
  description:
    '4734, 4735, 5018 ve 2886 sayılı kanunlara tam uyumlu; lüzum müzekkeresinden hakedişe ve taşınır işlem fişine kadar uçtan uca ihale ve doğrudan temin süreç asistanı.',
  category: 'procurement',
  appId: 'dev.ilyasbozdemir.temin360',
  executableName: 'TEMIN360.exe',
  fileAssociations: [
    {
      ext: 'temin',
      name: 'TEMİN 360 Proje Dosyası',
      description: 'TEMİN 360 Proje Dosyası (*.temin)',
      isPrimary: true
    },
    {
      ext: 'hkmp',
      name: 'HakimPro Doğrudan Temin Dosyası',
      description: 'HakimPro Doğrudan Temin Dosyası (*.hkmp)',
      isPrimary: false
    }
  ],
  installState: 'installed',
  modules: [
    'Doğrudan Temin (Md. 22/d)',
    '2886 Devlet İhalesi',
    'Hakediş & Yaklaşık Maliyet',
    'EBYS & Canlı Belge Stüdyosu'
  ],
  releaseChannel: 'rc',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  websiteUrl: 'https://temin360.ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360',
  sizeEstimatedMb: 125
}

export const WORKSPACE_360_MANIFEST: AppManifest = {
  id: 'workspace-360',
  name: 'Workspace 360',
  version: '0.1.0',
  summary: 'WorkSuite 360 Merkezi Çalışma Alanı ve Başlatıcı',
  description:
    'WorkSuite 360 bünyesindeki tüm masaüstü uygulamalarını tek bir merkezden görüntüleyen, başlatan, sürümlerini ve kurulum durumlarını yöneten merkezi çalışma alanı kataloğu.',
  category: 'system',
  appId: 'dev.ilyasbozdemir.workspace360',
  executableName: 'Workspace360.exe',
  fileAssociations: [],
  installState: 'installed',
  modules: ['Uygulama Kataloğu', 'Merkezi Ayarlar', 'Sürüm Doğrulama'],
  releaseChannel: 'alpha',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360',
  sizeEstimatedMb: 85
}

export const DOSYA_360_MANIFEST: AppManifest = {
  id: 'dosya-360',
  name: 'Dosya 360',
  version: '0.1.0-planned',
  summary: 'Dosya Arama, Düzenleme ve Güvenli Temizlik Merkezi',
  description:
    'Hızlı Arama (anlık indeksleme), Etiketler ve Koleksiyonlar (sanal düzenleme), Yinelenen Dosyalar (hash doğrulama) ve Temizlik/Karantina yeteneklerini tek çatıda birleştiren güçlü masaüstü aracı.',
  category: 'file-management',
  appId: 'dev.ilyasbozdemir.dosya360',
  executableName: 'Dosya360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: [
    'Hızlı Arama',
    'Etiketler ve Koleksiyonlar',
    'Yinelenen Dosyalar',
    'Temizlik ve Karantina',
    'İndeksleme ve Depolama',
    'Genel Bakış ve Ayarlar'
  ],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360',
  sizeEstimatedMb: 110
}

export const SUREC_360_MANIFEST: AppManifest = {
  id: 'surec-360',
  name: 'Süreç 360',
  version: '0.1.0-planned',
  summary: 'İş Süreçleri, Görevler ve Aşamaların Takibi',
  description:
    'Kurumsal iş süreçlerinin, birimler arası görev dağılımının ve aşama onaylarının zaman çizelgesi ve kanban görünümleriyle takibi.',
  category: 'workflow',
  appId: 'dev.ilyasbozdemir.surec360',
  executableName: 'Surec360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: ['Süreç Akışları', 'Görev Dağılımı', 'Kanban & Zaman Çizelgesi'],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360'
}

export const HARITA_360_MANIFEST: AppManifest = {
  id: 'harita-360',
  name: 'Harita 360',
  version: '0.1.0-planned',
  summary: 'Harita, Koordinat, Saha ve Taşınmaz Araçları',
  description:
    'ITRF96, ED50 ve WGS84 koordinat dönüşümleri, parsel sorgulama, saha fotoğrafları ve taşınmaz envanter haritalandırması.',
  category: 'gis',
  appId: 'dev.ilyasbozdemir.harita360',
  executableName: 'Harita360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: ['Koordinat Dönüştürücü', 'Parsel Haritası', 'Taşınmaz Envanteri'],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360'
}

export const PERSONEL_360_MANIFEST: AppManifest = {
  id: 'personel-360',
  name: 'Personel 360',
  version: '0.1.0-planned',
  summary: 'Personel Kayıtları, Görevlendirmeler ve İzin Takibi',
  description:
    'Komisyon üyeleri, muayene kabul heyetleri, harcama yetkilileri ve kurum personeli sicil ve görev takip merkezi.',
  category: 'hr',
  appId: 'dev.ilyasbozdemir.personel360',
  executableName: 'Personel360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: ['Personel Kartları', 'Komisyon Atamaları', 'Yetki Matrisi'],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360'
}

export const BELGE_360_MANIFEST: AppManifest = {
  id: 'belge-360',
  name: 'Belge 360',
  version: '0.1.0-planned',
  summary: 'Kurumsal Belge Yönetimi ve Resmi Yazışma',
  description:
    'Resmi yazışma kurallarına uygun evrak oluşturma, barkod/karekod üretimi, şablon kütüphanesi ve dijital paraflama.',
  category: 'document',
  appId: 'dev.ilyasbozdemir.belge360',
  executableName: 'Belge360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: ['Resmi Yazı Editörü', 'Şablon Kütüphanesi', 'Karekod & Doğrulama'],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360'
}

export const ARSIV_360_MANIFEST: AppManifest = {
  id: 'arsiv-360',
  name: 'Arşiv 360',
  version: '0.1.0-planned',
  summary: 'Dosya ve Kayıt Arşivleme, Arama ve Güvenli Saklama',
  description:
    'Tamamlanan ihale, doğrudan temin ve mali belgelerin dijital arşiv standartlarında saklanması, indekslenmesi ve hızlı erişimi.',
  category: 'archive',
  appId: 'dev.ilyasbozdemir.arsiv360',
  executableName: 'Arsiv360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: ['Dijital Arşiv', 'Kutu/Klasör Barkodlama', 'Tarihsel Erişim'],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360'
}

export const EVRAKTRON_MANIFEST: AppManifest = {
  id: 'evraktron',
  name: 'Evraktron',
  version: '0.1.0-planned',
  summary: 'Gelen-Giden Evrak Kayıt ve Takip Sistemi',
  description:
    'Kurum evraklarının kaydedilmesi, numaralandırılması, havale ve işlem geçmişinin izlenmesi, aranması ve arşivlenmesi için bağımsız masaüstü uygulaması.',
  category: 'document',
  appId: 'dev.ilyasbozdemir.evraktron',
  executableName: 'Evraktron.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: [
    'Gelen Evrak',
    'Giden Evrak',
    'Evrak Kayıt ve Numaralandırma',
    'Havale ve İşlem Takibi',
    'Ek Dosyalar',
    'Arama ve Raporlama',
    'Arşivleme'
  ],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/evraktron'
};



export const DEFAULT_ECOSYSTEM_MANIFESTS: AppManifest[] = [
  TEMIN_360_MANIFEST,
  WORKSPACE_360_MANIFEST,
  DOSYA_360_MANIFEST,
  SUREC_360_MANIFEST,
  HARITA_360_MANIFEST,
  PERSONEL_360_MANIFEST,
  BELGE_360_MANIFEST,
  ARSIV_360_MANIFEST
]
