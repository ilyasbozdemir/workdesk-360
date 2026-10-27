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
      name: 'TEMİN 360 Eski Sürüm Proje Dosyası (HakimPro)',
      description: 'TEMİN 360 ile Açılabilen Eski Proje Dosyası (*.hkmp)',
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

export const FLOWDESK_360_MANIFEST: AppManifest = {
  id: 'flowdesk-360',
  name: 'FLOWDESK 360',
  version: '1.0.0-alpha.1',
  summary: 'Kurumsal Dinamik Süreç, Görev ve İş Akışı Yönetim Sistemi',
  description:
    'Kurumun farklı iş süreçlerini dinamik olarak tanımlayabildiği, adımlara ayırabildiği, sorumlular atayabildiği ve süreç ilerleyişini takip edebildiği bağımsız süreç yönetim masası.',
  category: 'workflow',
  appId: 'dev.ilyasbozdemir.flowdesk360',
  executableName: 'FlowDesk360.exe',
  fileAssociations: [
    {
      ext: 'flowdesk',
      name: 'FLOWDESK 360 Süreç Dosyası',
      description: 'FLOWDESK 360 Dinamik Süreç Dosyası (*.flowdesk)',
      mimeType: 'application/x-flowdesk',
      progId: 'FlowDesk360.Document',
      perceivedType: 'document',
      isPrimary: true
    },
    {
      ext: 'flow',
      name: 'FLOWDESK Süreç Şablonu',
      description: 'FLOWDESK Süreç Şablonu (*.flow)',
      mimeType: 'application/x-flowdesk-template',
      progId: 'FlowDesk360.Document',
      perceivedType: 'document',
      isPrimary: false
    }
  ],
  installState: 'installed',
  modules: [
    'Dinamik Süreç Şablonları',
    'Aktif Süreç Örnekleri',
    'Adım ve Görev Yönetimi',
    'Kontrollü Durum Geçişleri',
    'Sorumlu ve Rol Atamaları',
    'Denetlenebilir Süreç Tarihçesi',
    'Belge ve Dosya Referansları'
  ],
  releaseChannel: 'alpha',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  websiteUrl: 'https://flowdesk.ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360',
  sizeEstimatedMb: 120
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
  summary: 'Personel Kayıtları, İzin Yönetimi ve Görevlendirme Takibi',
  description:
    'Bağımsız masaüstü uygulaması (.exe) olarak personel kayıtları, yıllık/mazeret izin talepleri, izin bakiyesi hesaplaması ve denetlenebilir işlem geçmişi.',
  category: 'hr',
  appId: 'dev.ilyasbozdemir.personel360',
  executableName: 'Personel360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: [
    'Personel Kayıtları',
    'İzin Yönetimi & Bakiye',
    'İzin Talepleri & Onay',
    'Görevlendirme ve Hareketler',
    'Belge Üretimi & Matbu Formlar',
    'Denetlenebilir İşlem Geçmişi'
  ],
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

/**
 * Arşiv 360: Bağımsız katalog uygulaması yerine Evraktron bünyesinde bir
 * "Arşiv Modülü" olarak konumlandırılmıştır.
 */
export const ARSIV_360_MANIFEST: AppManifest = {
  id: 'arsiv-360',
  name: 'Arşiv 360',
  version: '0.1.0-planned',
  summary: 'Dosya ve Kayıt Arşivleme, Arama ve Güvenli Saklama (Evraktron Arşiv Modülü)',
  description:
    'Evraktron bünyesindeki Arşiv Modülü ile tamamlanan ihale, doğrudan temin ve mali belgelerin dijital arşiv standartlarında (.etap) saklanması, indekslenmesi ve hızlı erişimi.',
  category: 'archive',
  appId: 'dev.ilyasbozdemir.arsiv360',
  executableName: 'Arsiv360.exe',
  fileAssociations: [],
  installState: 'planned',
  modules: ['Dijital Arşiv (.etap)', 'Kutu/Klasör Barkodlama', 'Tarihsel Erişim'],
  releaseChannel: 'planned',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/workdesk-360'
}

export const EVRAKTRON_MANIFEST: AppManifest = {
  id: 'evraktron',
  name: 'Evraktron',
  version: '1.3.2',
  summary: 'Gelen-Giden Evrak Kayıt, Takip ve Arşivleme Sistemi',
  description:
    'Kurum evraklarının kaydedilmesi, numaralandırılması, havale ve işlem geçmişinin izlenmesi, FTS5 hızlı arama ve dahili Arşiv modülü (.etap) için bağımsız masaüstü uygulaması.',
  category: 'document',
  appId: 'dev.ilyasbozdemir.evraktron',
  executableName: 'Evraktron.exe',
  fileAssociations: [
    {
      ext: 'etap',
      name: 'Evraktron Evrak Paketi',
      description: 'Evraktron Evrak Paketi (*.etap)',
      mimeType: 'application/x-evraktron-etap',
      progId: 'Evraktron.Document',
      perceivedType: 'document',
      isPrimary: true
    }
  ],
  installState: 'planned',
  modules: [
    'Gelen Evrak',
    'Giden Evrak',
    'Evrak Kayıt ve Numaralandırma',
    'Havale ve İşlem Takibi',
    'Ek Dosyalar & FTS5 Arama',
    'Arşiv Modülü (.etap)',
    'FlowDesk Entegrasyonu'
  ],
  releaseChannel: 'beta',
  minEcosystemVersion: '1.0.0',
  author: 'ilyasbozdemir.dev',
  websiteUrl: 'https://evraktron.ilyasbozdemir.dev',
  repositoryUrl: 'https://github.com/ilyasbozdemir/evraktron'
}

export const DEFAULT_ECOSYSTEM_MANIFESTS: AppManifest[] = [
  TEMIN_360_MANIFEST,
  IHALE_360_MANIFEST,
  WORKSPACE_360_MANIFEST,
  DOSYA_360_MANIFEST,
  SUREC_360_MANIFEST,
  FLOWDESK_360_MANIFEST,
  HARITA_360_MANIFEST,
  PERSONEL_360_MANIFEST,
  BELGE_360_MANIFEST,
  EVRAKTRON_MANIFEST
]


