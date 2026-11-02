import fs from 'fs'
import path from 'path'
import os from 'os'
import { createRequire } from 'module'

const req = createRequire(import.meta.url)
const AdmZip = req('../apps/temin360-desktop/node_modules/adm-zip')
const { DatabaseSync } = await import('node:sqlite')

const teminPath = 'C:\\Users\\ilyas bozdemir\\Desktop\\Güneyyurt Belediyesi İhale - Doğrudan Temin.temin'
const zip = new AdmZip(teminPath)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check3-'))
zip.extractAllTo(tmp, true)
const db = new DatabaseSync(path.join(tmp, 'database.sqlite'))

const dosya290 = db.prepare('SELECT * FROM DATA_TeminDosyasi WHERE id = 290').get()
console.log('Dosya 290:', dosya290)

const queryRes = db.prepare(`
  SELECT
    d.id as dosya_id,
    d.temin_no,
    d.konu,
    d.tur,
    d.dosya_acilis_tarihi,
    d.temin_tarihi,
    d.status,
    d.yaklasik_maliyet,
    d.firma_id as firma_id_kazanan,
    df.teklif_toplami,
    df.kazandi_mi,
    df.teklif_durumu,
    df.davet_tarihi,
    COALESCE(winner.unvan, '') as firma_unvan_kazanan
  FROM DATA_TeminFirma df
  JOIN DATA_TeminDosyasi d ON df.temin_dosya_id = d.id
  LEFT JOIN TANIM_Firma winner ON d.firma_id = winner.id
  WHERE df.firma_id = 26 AND d.is_deleted = 0
`).all()

console.log('Query Result for Firma 26:', queryRes)

db.close()
fs.rmSync(tmp, { recursive: true, force: true })
