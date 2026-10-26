import { AppManifest } from './schema.js'

export const TEMIN_360_MANIFEST: AppManifest = {
  id: 'temin-360',
  name: 'TEMİN 360',
  version: '1.0.0-rc.6',
  summary: 'Doğrudan Temin ve Satınalma Yönetim Sistemi',
  description:
    '4734 Sayılı Kamu İhale Kanunu Madde 22/d doğrudan temin süreçleri, piyasa fiyat araştırması, yaklaşık maliyet, onay belgesi ve hakediş asistanı.',
  category: 'procurement',
  appId: 'dev.ilyasbozdemir.temin360',
  executableName: 'TEMIN360.exe',
  fileAssociations: [
    {
      ext: 'temin',
      name: 'TEMİN 360 Proje Dosyası',
      description: 'TEMİN 360 Doğrudan Temin Proje Dosyası (*.temin)',
      mimeType: 'application/x-temin',
      progId: 'Temin360.Document',
      perceivedType: 'document',
      isPrimary: true
    },
    {
      ext: 'hkmp',
      name: 'HakimPro Doğrudan Temin Dosyası',
      description: 'HakimPro Doğrudan Temin Dosyası (*.hkmp)',
      mimeType: 'application/x-hkmp',
      progId: 'Temin360.Document',
      perceivedType: 'document',
      isPrimary: false,
      isLegacy: true
    },
    {
      ext: 'tmn360',
      name: 'Temin 360 Arşiv Dosyası',
      description: 'Temin 360 Arşiv Dosyası (*.tmn360)',
      mimeType: 'application/x-temin360',
      progId: 'Temin360.Document',
      perceivedType: 'document',
      isPrimary: false,
      isLegacy: true
    }
  ],
  installState: 'installed',
  modules: [
    'Doğrudan Temin (Md. 22/d)',
    'Piyasa Fiyat Araştırması',
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

export const IHALE_360_MANIFEST: AppManifest = {
  id: 'ihale-360',
  name: 'İHALE 360',
  version: '1.0.0-beta.1',
  summary: 'Kamu İhalesi Masası (4734 Sayılı Kanun)',
  description:
    '4734 Sayılı Kamu İhale Kanunu Madde 19 (Açık İhale) ve Madde 21 (Pazarlık Usulü) süreçleri, ihale komisyonları, teklif zarfları ve ihale takibi.',
  category: 'procurement',
  appId: 'dev.ilyasbozdemir.ihale360',
  executableName: 'IHALE360.exe',
  fileAssociations: [
    {
      ext: 'ihale',
      name: 'İHALE 360 Proje Dosyası',
      description: 'İHALE 360 Kamu İhalesi Proje Dosyası (*.ihale)',
      mimeType: 'application/x-ihale',
      progId: 'Ihale360.Document',
      perceivedType: 'document',
      isPrimary: true
    },
    {
      ext: 'ihale360',
      name: 'İHALE 360 Alternatif Proje Dosyası',
      description: 'İHALE 360 Alternatif Proje Dosyası (*.ihale360)',
      mimeType: 'application/x-ihale360',
      progId: 'Ihale360.Document',
      perceivedType: 'document',
      isPrimary: false
    }
  ],
  installState: 'installed',
  modules: [
    'Açık İhale (Md. 19)',
    'Pazarlık Usulü (Md. 21)',
    'İhale Komisyonu Yönetimi',
    'Teklif Değerlendirme & Hakediş'
  ],
  releaseChannel: 'beta',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  websiteUrl: 'https://ihale360.ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360',
  sizeEstimatedMb: 125
}

export const DEVLET_IHALE_2886_MANIFEST: AppManifest = {
  id: 'devlet-ihale-2886',
  name: 'DEVLET İHALE 2886',
  version: '1.0.0-beta.1',
  summary: 'Devlet İhale Kanunu (2886 Sayılı Kanun) Satış ve Kiralama Sistemi',
  description:
    '2886 Sayılı Devlet İhale Kanunu kapsamında taşınmaz satış, kiralama, trampa ve irtifak hakkı işlemleri; muhammen bedel, encümen kararları ve artırma turları.',
  category: 'procurement',
  appId: 'dev.ilyasbozdemir.devlet-ihale-2886',
  executableName: 'DEVLETIHALE2886.exe',
  fileAssociations: [
    {
      ext: 'ihale2886',
      name: 'Devlet İhale 2886 Proje Dosyası',
      description: '2886 Sayılı Devlet İhale Kanunu Proje Dosyası (*.ihale2886)',
      mimeType: 'application/x-ihale2886',
      progId: 'DevletIhale2886.Document',
      perceivedType: 'document',
      isPrimary: true
    },
    {
      ext: 'dihale',
      name: 'Devlet İhale 2886 Alternatif Proje Dosyası',
      description: '2886 Sayılı Devlet İhale Kanunu Alternatif Proje Dosyası (*.dihale)',
      mimeType: 'application/x-dihale',
      progId: 'DevletIhale2886.Document',
      perceivedType: 'document',
      isPrimary: false
    }
  ],
  installState: 'installed',
  modules: [
    'Taşınmaz Satış & Kiralama',
    'Muhammen Bedel & Kıymet Takdiri',
    'Encümen Süreçleri',
    'Açık Artırma Turları'
  ],
  releaseChannel: 'beta',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  websiteUrl: 'https://devletihale2886.ilyasbozdemir.dev',
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
  IHALE_360_MANIFEST,
  DEVLET_IHALE_2886_MANIFEST,
  WORKSPACE_360_MANIFEST,
  DOSYA_360_MANIFEST,
  SUREC_360_MANIFEST,
  HARITA_360_MANIFEST,
  PERSONEL_360_MANIFEST,
  BELGE_360_MANIFEST,
  ARSIV_360_MANIFEST
]
