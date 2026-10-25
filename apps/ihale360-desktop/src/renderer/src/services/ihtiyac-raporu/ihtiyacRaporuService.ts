import { ihtiyacRaporuRepository } from './repository'
import { ihtiyacRaporuLinkManager } from './linkManager'

/**
 * İhtiyaç Raporu ana servis arayüzü (Facade)
 * Veritabanı CRUD operasyonları (repository) ve doğrudan temin dosyası bağlantı işlemlerini (linkManager)
 * tek bir çatı altında birleştirir.
 */
export const ihtiyacRaporuService = {
  // Repository (CRUD & Sorgular)
  getRaporlar: ihtiyacRaporuRepository.getRaporlar.bind(ihtiyacRaporuRepository),
  getRaporById: ihtiyacRaporuRepository.getRaporById.bind(ihtiyacRaporuRepository),
  getRaporKalemleri: ihtiyacRaporuRepository.getRaporKalemleri.bind(ihtiyacRaporuRepository),
  getNextRaporNo: ihtiyacRaporuRepository.getNextRaporNo.bind(ihtiyacRaporuRepository),
  createRapor: ihtiyacRaporuRepository.createRapor.bind(ihtiyacRaporuRepository),
  updateRapor: ihtiyacRaporuRepository.updateRapor.bind(ihtiyacRaporuRepository),
  saveKalemler: ihtiyacRaporuRepository.saveKalemler.bind(ihtiyacRaporuRepository),
  deleteRapor: ihtiyacRaporuRepository.deleteRapor.bind(ihtiyacRaporuRepository),
  duplicateRapor: ihtiyacRaporuRepository.duplicateRapor.bind(ihtiyacRaporuRepository),

  // Link Manager (Dosyaya Bağlama, Kalem Aktarımı, Bağlantı Çözme)
  linkToDosya: ihtiyacRaporuLinkManager.linkToDosya.bind(ihtiyacRaporuLinkManager),
  unlinkFromDosya: ihtiyacRaporuLinkManager.unlinkFromDosya.bind(ihtiyacRaporuLinkManager),
  getDosyalarForSelect:
    ihtiyacRaporuLinkManager.getDosyalarForSelect.bind(ihtiyacRaporuLinkManager),
  getLinkedRaporForDosya:
    ihtiyacRaporuLinkManager.getLinkedRaporForDosya.bind(ihtiyacRaporuLinkManager)
}
