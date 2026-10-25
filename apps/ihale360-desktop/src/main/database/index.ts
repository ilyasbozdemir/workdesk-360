import { schema as sharedSchema, initializeDatabase as sharedInit } from '@dt/database'

export const TablePrefixLogic = {
  DATA: 'OPERASYONEL SÜREÇLER VE DOSYALAR (Temin Dosyaları, Teklifler, Siparişler)',
  TANIM: 'SİSTEM AYARLARI VE KONFİGÜRASYON (Mevzuat, Limitler, Firmalar, Personel)',
  LOG: 'SİSTEM LOGLARI VE KULLANICI HAREKETLERİ'
}

export const schema = sharedSchema

export const initializeDatabase = sharedInit
