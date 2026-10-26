import type Database from 'better-sqlite3'
import { getAppSchema, initializeDatabase as sharedInit } from '@dt/database'

export const TablePrefixLogic = {
  DATA: 'OPERASYONEL SÜREÇLER VE DOSYALAR (2886 Satış, Kiralama ve Trampa Dosyaları)',
  TANIM: 'SİSTEM AYARLARI VE KONFİGÜRASYON (Mevzuat, Firmalar, Personel)',
  LOG: 'SİSTEM LOGLARI VE KULLANICI HAREKETLERİ'
}

export const schema = getAppSchema('devlet-ihale-2886-desktop')

export function initializeDatabase(
  db: Database.Database,
  institutionName: string,
  currentAppVersion: string = '1.0.0-beta.1'
): void {
  sharedInit(db, institutionName, currentAppVersion, 'devlet-ihale-2886-desktop')
}
