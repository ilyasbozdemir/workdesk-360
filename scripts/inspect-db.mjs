import fs from 'fs'
import path from 'path'
import os from 'os'
import { createRequire } from 'module'

const req = createRequire(import.meta.url)
const AdmZip = req('../apps/temin360-desktop/node_modules/adm-zip')
const { DatabaseSync } = await import('node:sqlite')

const teminPath = 'C:\\Users\\ilyas bozdemir\\Desktop\\Güneyyurt Belediyesi İhale - Doğrudan Temin.temin'
const zip = new AdmZip(teminPath)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-'))
zip.extractAllTo(tmp, true)
const db = new DatabaseSync(path.join(tmp, 'database.sqlite'))

const allFirms = db.prepare('SELECT id, firma_kodu, unvan, vergi_no, telefon, email, il FROM TANIM_Firma ORDER BY id ASC').all()

// Master firms: firma_kodu is not null
const masters = allFirms.filter(f => f.firma_kodu && f.firma_kodu.trim() !== '')
// Stubs: firma_kodu is null or empty
const stubs = allFirms.filter(f => !f.firma_kodu || f.firma_kodu.trim() === '')

console.log(`Toplam Firma: ${allFirms.length} (Master: ${masters.length}, Stub/Eksik: ${stubs.length})`)

function normalize(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[iİıI]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]/g, '')
}

function cleanDigits(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  // If starts with 90, strip it; or take last 10 digits
  if (digits.length >= 10) return digits.slice(-10)
  return digits
}

console.log('\n--- EŞLEŞTİRME ANALİZİ ---')
for (const stub of stubs) {
  const stubNorm = normalize(stub.unvan)
  const stubPhone = cleanDigits(stub.telefon)
  const stubVkn = (stub.vergi_no || '').trim()

  let match = null
  let reason = ''

  // 1. VKN ile eşleştir
  if (stubVkn) {
    match = masters.find(m => (m.vergi_no || '').trim() === stubVkn)
    if (match) reason = `VKN (${stubVkn})`
  }

  // 2. Telefon ile eşleştir
  if (!match && stubPhone && stubPhone.length === 10) {
    match = masters.find(m => cleanDigits(m.telefon) === stubPhone)
    if (match) reason = `Telefon (${stubPhone})`
  }

  // 3. Unvan isim benzerliği (prefix veya içerik)
  if (!match && stubNorm.length >= 4) {
    match = masters.find(m => {
      const mNorm = normalize(m.unvan)
      return mNorm.startsWith(stubNorm) || stubNorm.startsWith(mNorm)
    })
    if (match) reason = `Unvan Benzerliği`
  }

  const dtfCount = db.prepare('SELECT COUNT(*) as c FROM DATA_TeminFirma WHERE firma_id = ?').get(stub.id).c
  const dosyaCount = db.prepare('SELECT COUNT(*) as c FROM DATA_TeminDosyasi WHERE firma_id = ?').get(stub.id).c

  if (match) {
    console.log(`[EŞLEŞTİ] Stub #${stub.id} "${stub.unvan}" (Tel: ${stub.telefon}) -> Master #${match.id} (${match.firma_kodu}) "${match.unvan}" | Sebep: ${reason} | Teklifler: ${dtfCount}, Kazanan Dosya: ${dosyaCount}`)
  } else {
    console.log(`[EŞLEŞMEDİ] Stub #${stub.id} "${stub.unvan}" (Tel: ${stub.telefon}) -> Teklifler: ${dtfCount}, Kazanan Dosya: ${dosyaCount}`)
  }
}

db.close()
try {
  fs.rmSync(tmp, { recursive: true, force: true })
} catch {}
